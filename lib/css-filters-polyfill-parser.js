importScripts('cssParser.js');

var parser = new CSSParser();

self.addEventListener('message', function(e) {
	var sheet = {
		content: parser.parse(e.data.content, false, true),
		media: e.data.media
	}
	self.postMessage(sheet);
}, false);