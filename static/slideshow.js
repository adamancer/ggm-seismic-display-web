(function(eq, $, undefined) {
	
	var baseUrl = "/ggm-seismic-display-web/static/images/";
	var filter = {};
	var sequence = [];
	var queue = [];
	var changeSlide = null;
	var msPerSlide = 15000;
	
	eq.initPage = function(filter_) {
		eq.log("Initiating slideshow (filter='" + filter_ + "')")
		
		filter = filter_;
		eq.updateSlides();
	}

	eq.updateSlides = function() {
		// Updates the slides
		eq.log("Updating slides")

		const d = new Date();
		sequence.length = 0;
		$.getJSON(baseUrl + "images.json?t=" + d.getTime(), function(data){
			$.each(data, function(key, val) {
				$.each(val, function(i, v) {
					if (v.startsWith(filter)) { sequence.push(v); }
				});
			});
			eq.log(sequence);
			eq.setQueue();
		});
	}

	eq.setQueue = function() {
		// Creates a queue of images to display
		eq.log("Updating queue")

		// World and USA maps display more frequently
		let world = (sequence[0].includes("-c01-")) ? sequence.shift() : null;
		let usa = (sequence[0].includes("-c02-")) ? sequence.shift() : null;

		queue.length = 0;
		let seq = [];
		for (var i = 0; i < 10000; i++) {
			if (world && i % 8 == 0) { queue.push(world); }
			else if (usa && i % 4 == 0) { queue.push(usa); }
			else { 
				if (seq.length == 0) { seq = sequence.slice(0); }
				queue.push(seq.shift());
			}
		}

		// Align queue to start of hour
		let count = 0;
		let d = new Date();
		count += d.getSeconds() / (msPerSlide / 1000);
		count += d.getMinutes() * (60000 / msPerSlide)
		queue = queue.slice(count);

		// Set initial slide and timer
		eq.updateImage();
		eq.changeSlide();
	}

	eq.changeSlide = function() {
		// Changes the slide
		eq.log("Changing slide")

		changeSlide = setTimeout(function() {
			eq.updateImage();
			eq.changeSlide();
		}, eq.getMsUntil(msPerSlide));
	}

	eq.updateImage = function() {
		// Updates the src attribute of the image element
		eq.log("Showing " + queue[0]);

		var url = baseUrl + queue.shift();

		$.ajax({
			type: "HEAD",
			url: url,
			success: function() { $("#slide").attr("src", url); },
			error: function() {
				eq.log("Image not found: " + url);
				eq.updateSlides();
			}
		})
	}

	eq.getMsUntil = function(intervalMs) {
		// Calculates the number of milliseconds until the next event call
		const d = new Date()
		let ms = d.getSeconds() * 1000 + d.getMilliseconds() + intervalMs;
		let rem = ms % intervalMs;
		eq.log("Scheduled next event for " + (intervalMs - rem) + " ms");
		return intervalMs - rem;
	}
	
	eq.log = function(message) {
		const d = new Date();
		if (Array.isArray(message)) { message = "[" + message.join(", ") + "]"; }
		console.log(d.toISOString() + ": " + message)
	}
	
}( window.eq = window.eq || {}, jQuery ));