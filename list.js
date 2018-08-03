document.addEventListener('DOMContentLoaded', function() {
	cAllTabs.init();
	cAllTabs.displayList();
	document.querySelector('#settings-button').addEventListener('click', cAllTabs.handleSettingsClick);
})

document.addEventListener('unload', function() {
	cAllTabs.unregisterAndCleanUp();
 })

const cAllTabs = {
	init : function() {
		this.registerToClickEvent();
	},

	displayList : function () {
		let theme = window.localStorage.getItem('see_all_tabs_theme') 
		switch(theme) {
			case null : 
			case 'classic' :
				theme = 'theme-classic';
				break;
			case 'material':
				theme = 'theme-material';
				break;
			case 'dark':
				theme = 'theme-dark';
				break;
		}

		chrome.tabs.query({}, tabs => {
			let output = tabs.map(tab => {
				let active = tab.active ? 'active' : '';
				const speakerVisible = !tab.audible ? 'hidden' : '' ;
				const hasOffset = tab.audible ? 'offset' : '';

				let speakerImg = 'display:none';
				let mutedSpeakerImg = 'display:none';

				if (tab.audible) {
					if (tab.mutedInfo.muted) {
						speakerImg = 'display:none';
						mutedSpeakerImg = 'display:block';
					}	
					else {
						speakerImg = 'display:block';
						mutedSpeakerImg = 'display:none';
					}
				}
				return `<div class="tab-row ${theme} ${active}" data-tab-id="${tab.id}">
							<div class="favicon">
								<img src="${tab.favIconUrl}" />
							</div>
							<div class="tab-title">
								<span class="speaker ${speakerVisible}">
									<img src="../images/icons8-Speaker-16.png" alt="tab is playing" data-type="speaker" style="${speakerImg}" />
									<img src="../images/icons8-No Audio-16.png" alt="tab is muted" data-type="speaker" style="${mutedSpeakerImg}"/>
								</span>	
								<span class="tab-desc ${hasOffset}">${tab.title}</span>
							</div>
							<div class="close-button" data-type="closeButton">
								<i class="fas fa-times-circle fa-2x"></i>
							</div>	
						</div>`;
				
			});

			output = output.join('');
			document.querySelector('.tab-list').innerHTML = output;
		});
	},

	registerToClickEvent : function(){
		const tabList = document.querySelector('.tab-list');
		tabList.addEventListener('click', cAllTabs.handleClickEvent.bind(this));

		document.querySelector('.themes').addEventListener('click', this.handleThemeClick.bind(this));
	},

	handleThemeClick : function(event) {
		let element = event.target;
		let theme;
		
		if (element.tagName.toLowerCase() === 'input') {
			theme = element.value;
		}
		else if (element.tagName.toLowerCase() === 'div') {			
			element = element.parentNode.children[0];
			theme = element.value;
		}
		
		window.localStorage.setItem('see_all_tabs_theme', theme);
		this.displayList();

	},

	handleClickEvent: function(event){
		const tabId = this.getTabId(event);
		const tagName = event.target.tagName.toLowerCase();
		const type = event.target.dataset.type;

		if (tagName === 'img' && type === 'speaker') {
			this.toggleMute.bind(this, tabId)();
			return;
		}

		if ((tagName === 'img' || tagName === 'div') &&  type === 'closeButton') {
			this.removeTabFromList(tabId);
			this.closeTab(tabId);
		}
		else {
			this.setActiveTab(tabId);
		}
	},

	toggleMute : function(tabId) {
		chrome.tabs.get(tabId, function(tabData) {
			const muted = !tabData.mutedInfo.muted;
			chrome.tabs.update(tabId, {muted:muted});
			this.toggleMuteIcon(tabId, muted);
		}.bind(this));
	},

	setActiveTab : function(tabId){
		chrome.tabs.update(tabId, {active:true});
	},

	unregisterAndCleanUp : function(){
		document.querySelector('.tab-list').removeEventListener('click', cAllTabs.handleClickEvent);

	},

	getTabId : function(event) {
		let currentElement = event.target;
		let elementType = currentElement.tagName.toLowerCase();

		while(elementType !== 'div' || (elementType === 'div' && !currentElement.classList.contains('tab-row'))) {
			currentElement = currentElement.parentNode;
			elementType = currentElement.tagName.toLowerCase();
		}

		return parseInt(currentElement.dataset.tabId);
	},

	closeTab: function(tabId) {
		chrome.tabs.remove(tabId);
	},

	removeTabFromList : function(tabId) {
		const list = [...document.querySelectorAll('.tab-row')];
		const tab = list.find(tab => parseInt(tab.dataset.tabId) === parseInt(tabId));
		document.querySelector('.tab-list').removeChild(tab);
	},

	toggleMuteIcon : function(tabId, muted) {
		const list = [...document.querySelectorAll('.tab-row')];
		const tab = list.find(tab => parseInt(tab.dataset.tabId) === parseInt(tabId));

		const tabTitle = tab.children[1];
		if (muted) {
			tabTitle.children[0].children[0].style.display = "none";
			tabTitle.children[0].children[1].style.display = "block";
		}
		else {
			tabTitle.children[0].children[0].style.display = "block";
			tabTitle.children[0].children[1].style.display = "none";
		}
	
		//document.querySelector('.tab-list').removeChild(tab);
	},

	handleSettingsClick : function() {
		const display = document.querySelector('.settings-content').style.display;
		if (display === 'none' || display === '') {
			document.querySelector('.settings-content').style.display = 'block';
			document.querySelector('.tab-list').style.display = 'none';
		}
		else {
			document.querySelector('.settings-content').style.display = 'none';
			document.querySelector('.tab-list').style.display = 'block';
		}
	}
}