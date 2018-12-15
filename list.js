document.addEventListener('DOMContentLoaded', function() {
	cAllTabs.init();
	cAllTabs.displayList();
})

document.addEventListener('unload', function() {
	cAllTabs.unregisterAndCleanUp();
 })

const cAllTabs = {
	init : function() {
		this.registerToClickEvent();
	},

	displayList : function () {
		const tabList = document.querySelector('.tab-list');
		const rowFragment = document.createDocumentFragment();

		chrome.tabs.query({}, tabs => {
			tabs.forEach(tab => {
				let active = tab.active ? 'active' : '';
				const speakerVisible = !tab.audible ? 'hidden' : '' ;

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

				rowFragment.appendChild(this.buildTabRow({tab, active, speakerVisible, speakerImg, mutedSpeakerImg}));
			});

			tabList.appendChild(rowFragment);
		});
	},

	buildTabRow: function({tab, active, speakerImg, mutedSpeakerImg, speakerVisible}) {
		const tabRow = document.createElement('div');
		tabRow.className = `tab-row ${active}`;
		tabRow.dataset.tabId = tab.id;

		const favIcon = document.createElement('div');
		favIcon.className = 'favicon';	

		const favIconImage = document.createElement('img');
		favIconImage.src = tab.favIconUrl;

		favIcon.appendChild(favIconImage);
		tabRow.appendChild(favIcon);

		const tabTitle = document.createElement('div');
		tabTitle.className = 'tab-title';

		const speakerSpan = document.createElement('span');
		speakerSpan.className = `speaker ${speakerVisible}`;

		const speakerImage = document.createElement('img');
		speakerImage.src = '../images/icons8-Speaker-16.png';
		speakerImage.alt = 'tab is playing';
		speakerImage.dataset.type = 'speaker';
		speakerImage.style = speakerImg;

		speakerSpan.append(speakerImage);
		
		const mutedSpeakerImgElement = document.createElement('img');
		mutedSpeakerImgElement.src = '../images/icons8-No Audio-16.png';
		mutedSpeakerImgElement.alt = 'tab is muted';
		mutedSpeakerImgElement.dataset.type = 'speaker';
		mutedSpeakerImgElement.style = mutedSpeakerImg;
		
		speakerSpan.append(speakerImage);
		speakerSpan.append(mutedSpeakerImgElement);
		tabTitle.appendChild(speakerSpan);
		
		const tabDesc = document.createElement('span');
		tabDesc.className = 'tab-desc';
		tabDesc.innerText = tab.title;

		tabTitle.appendChild(tabDesc);
		tabRow.appendChild(tabTitle);

		const closeButtonDiv = document.createElement('div');
		closeButtonDiv.className = 'close-button';
		closeButtonDiv.dataset.type = 'closeButton';

		const closeButtonImage = document.createElement('img');
		closeButtonImage.src = './images/svg/times-circle.svg';
		closeButtonImage.dataset.type = 'closeButton';

		closeButtonDiv.appendChild(closeButtonImage);

		tabRow.appendChild(closeButtonDiv);

		return tabRow;
	},

	registerToClickEvent : function(){
		const tabList = document.querySelector('.tab-list');
		tabList.addEventListener('click', cAllTabs.handleClickEvent.bind(this));
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