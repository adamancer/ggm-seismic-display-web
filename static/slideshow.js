(function(eq, $, undefined) {
	
	var baseUrl = "/ggm-seismic-display-web/static/images/";
	var filter = {};
	var sequence = [];
	var queue = [];
	var timeouts = {changeSlide: [], updateSlides: []};
	var msPerSlide = 15000;
	var msPerUpdate = 300000;
	
	eq.initPage = function(filter_) {
		eq.log("Initiating slideshow (filter='" + filter_ + "')")
		
		filter = filter_;
		eq.updateSlides();
	}

	eq.updateSlides = function() {
		// Updates the slides based on the current images.json file
		eq.log("Updating slides")

		eq.clearTimeouts("changeSlide");
		eq.clearTimeouts("updateSlides");

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
			eq.changeSlide();

			timeouts["updateSlides"].push(setTimeout(function() {
				eq.updateSlides();
			}, eq.getMsUntil(msPerUpdate)));
		});
	}

	eq.setQueue = function() {
		// Creates a queue of images to display
		eq.log("Updating queue")

		eq.clearTimeouts("changeSlide");

		// World and USA maps display more frequently
		let world = (sequence[0].includes("-c01-")) ? sequence.shift() : null;
		let usa = (sequence[0].includes("-c02-")) ? sequence.shift() : null;

		queue.length = 0;
		let seq = [];
		for (var i = 0; i < 5000; i++) {
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
	}

	eq.changeSlide = function() {
		// Updates the current slide and schedules the next change
		eq.log("Showing " + queue[0]);

		eq.clearTimeouts("changeSlide");

		// Rebuild queue if empty
		if (!queue.length) { eq.setQueue(); }

		var url = baseUrl + queue.shift();
		$.ajax({
			type: "HEAD",
			url: url,
			success: function() {
				$("#slide").attr("src", url);
				timeouts["changeSlide"].push(setTimeout(function() {
					eq.changeSlide();
				}, eq.getMsUntil(msPerSlide)));
			},
			error: function() {
				eq.log("Image not found: " + url);
				eq.updateSlides();
			}
		})
	}

	eq.getMsUntil = function(timeoutMs) {
		// Calculates timeouts to fall on exact intervals
		const d = new Date()
		let ms = d.getSeconds() * 1000 + d.getMilliseconds() + timeoutMs;
		let rem = ms % timeoutMs;
		eq.log("Scheduled timeout for " + (timeoutMs - rem) + " ms");
		return timeoutMs - rem;
	}

	eq.clearTimeouts = function(key) {
		// Clears existing timeouts under the given key
		if (timeouts[key].length) {
			eq.log("Clearing timeouts[" + key + "]");
			while (timeouts[key].length) {
				clearTimeout(timeouts[key].pop());
			}
		}
	}
	
	eq.log = function(message) {
		// Datestamps a console message
		const d = new Date();
		if (Array.isArray(message)) { message = "[" + message.join(", ") + "]"; }
		console.log(d.toISOString() + ": " + message)
	}
	
}( window.eq = window.eq || {}, jQuery ));