import App from './App/App.js';

/**
 * start up and register to unload
 */
window.addEventListener('DOMContentLoaded', function() {
	chrome.storage.sync.get(null, values => {
		App.init({settings: values});
	})

});

window.addEventListener('unload', function() {
	App.unregisterEvents();
});
