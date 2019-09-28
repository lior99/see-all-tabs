import App from './App/App.js';

/**
 * start up and register to unload
 */
window.addEventListener('DOMContentLoaded', function() {
	App.init();
});

window.addEventListener('unload', function() {
	App.unregisterEvents();
});
