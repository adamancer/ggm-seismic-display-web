(function(eq, $, undefined) {
	
	var baseUrl = "/ggm-seismic-display/static";
	var kind = {};
	var images = {};
	var sequence = [];
	var queue = [];
	var changeSlide = null;
	var updateSlides = null;

	var msPerSlide = 3000;
	var msPerUpdate = 300000;
	
	eq.initPage = function(kind_) {
		kind = kind_;
		eq.updateSlides();
	}

	eq.updateSlides = function() {
		// Updates the slides
		images.length = 0;
		sequence.length = 0;
		$.getJSON(baseUrl + "images.json", function(data){
			$.each(data, function(key, val) {
				$.each(val, function(i, v) {
					if (v.startsWith(kind)) { sequence.push(v); }
				});
			});
			console.log(sequence);
			eq.setQueue();
			// Adjust interval to land on next hour
			updateSlides = setTimeout(function() {
				eq.updateSlides();
			}, eq.getMsUntil(msPerUpdate));
		});
	}

	eq.setQueue = function() {
		// Creates a queue of images to display

		queue.length = 0;
		let seq = [];
		for (var i = 0; i < 10000; i++) {
			if (seq.length == 0) { seq = sequence.slice(0); }
			queue.push(seq.shift());
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
		changeSlide = setTimeout(function() {
			eq.updateImage();
			eq.changeSlide();
		}, eq.getMsUntil(msPerSlide));
	}


	eq.updateImage = function() {
		console.log("Showing " + queue[0]);
		$("#slide").attr("src", baseUrl + queue.shift());
	}

	eq.getMsUntil = function(intervalMs) {
		// Calculates the number of milliseconds until the next run of a timeout
		const d = new Date()
		let ms = d.getSeconds() * 1000 + d.getMilliseconds() + intervalMs;
		let rem = ms % intervalMs;
		console.log({
			interval: intervalMs,
			ms_exact: ms,
			ms_remainder: rem,
			ms_diff: intervalMs - rem
		});
		return intervalMs - rem;
	}
	
}( window.eq = window.eq || {}, jQuery ));