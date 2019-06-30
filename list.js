(function main() {
	let currentWindowId = null;
	let windowCounter = 0;

	const init = function() {
		registerToClickEvent();
	};

	const displayList = function() {
		const tabList = document.querySelector('.tab-list');

		chrome.windows.getAll({ populate: true }, function(windows) {
			windows.forEach(chromeWindow => {
				const tabRowFragment = document.createDocumentFragment();
				chromeWindow.tabs.forEach(tab => {
					tabRowFragment.appendChild(buildTabRow({ tab }));
				});

				if (windows.length > 1) {
					const group = buildGroup({ chromeWindow, tabRowFragment });
					tabList.appendChild(group);
				} else {
					tabList.appendChild(tabRowFragment);
				}
			});
		});
	};

	const buildGroup = function({ chromeWindow, tabRowFragment }) {
		const group = document.createElement('div');
		group.className = 'group';

		const groupTitle = document.createElement('div');
		groupTitle.className = 'group-title';
		currentWindowId = chromeWindow.tabs[0].windowId;
		windowCounter++;
		groupTitle.innerText = `window ${windowCounter}`;
		group.className = 'group';
		group.dataset.groupId = currentWindowId;
		group.appendChild(groupTitle);
		group.appendChild(tabRowFragment);
		return group;
	};

	const buildTabRow = function({ tab }) {
		const active = tab.active ? 'active' : '';
		const speakerVisible = !tab.audible ? 'hidden' : '';

		let speakerImg = 'display: none';
		let mutedSpeakerImg = 'display:none';

		if (tab.audible) {
			speakerImg = tab.mutedInfo.muted ? 'display:none' : 'display:block';
			mutedSpeakerImg = tab.mutedInfo.muted ? 'display:block' : 'display:none';
		}

		const tabRow = document.createElement('div');
		tabRow.className = `tab-row ${active}`;
		tabRow.dataset.tabId = tab.id;
		tabRow.dataset.windowId = tab.windowId;

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
	};

	const registerToClickEvent = function() {
		const tabList = document.querySelector('.tab-list');
		tabList.addEventListener('click', handleClickEvent);
	};

	const handleClickEvent = function(event) {
		const { tabId, windowId } = getTabData(event);
		const tagName = event.target.tagName.toLowerCase();
		const type = event.target.dataset.type;

		if (tagName === 'img' && type === 'speaker') {
			toggleMute(tabId);
			return;
		}

		if ((tagName === 'img' || tagName === 'div') && type === 'closeButton') {
			removeTabFromList(tabId);
			closeTab(tabId);
		} else {
			setActiveTab({ tabId, windowId });
		}
	};

	const toggleMute = function(tabId) {
		chrome.tabs.get(tabId, function(tabData) {
			const muted = !tabData.mutedInfo.muted;
			chrome.tabs.update(tabId, { muted: muted });
			toggleMuteIcon(tabId, muted);
		});
	};

	const setActiveTab = function({ tabId, windowId }) {
		// if (windowId && windowId !== selectedWindowId) {
		chrome.windows.update(windowId, { focused: true }, function() {
			selectedWindowId = windowId;
		});

		chrome.tabs.update(tabId, { active: true });
		// } else {
		// 	chrome.tabs.update(tabId, { active: true });
		// }
	};

	const unregisterAndCleanUp = function() {
		document.querySelector('.tab-list').removeEventListener('click', cAllTabs.handleClickEvent);
	};

	const getTabData = function(event) {
		let currentElement = event.target;
		let elementType = currentElement.tagName.toLowerCase();

		while (elementType !== 'div' || (elementType === 'div' && !currentElement.classList.contains('tab-row'))) {
			currentElement = currentElement.parentNode;
			elementType = currentElement.tagName.toLowerCase();
		}

		return {
			tabId: parseInt(currentElement.dataset.tabId),
			windowId: parseInt(currentElement.dataset.windowId),
		};
	};

	const closeTab = function(tabId) {
		chrome.tabs.remove(tabId);
	};

	const removeTabFromList = function(tabId) {
		const list = [...document.querySelectorAll('.tab-row')];
		const tab = list.find(tab => parseInt(tab.dataset.tabId) === parseInt(tabId));
		
		const group = tab.parentElement;

		if (group && group.children.length > 1) {
			group.removeChild(tab);
		} else {
			document.querySelector('.tab-list').removeChild(tab);
		}
	};

	const toggleMuteIcon = function(tabId, muted) {
		const list = [...document.querySelectorAll('.tab-row')];
		const tab = list.find(tab => parseInt(tab.dataset.tabId) === parseInt(tabId));

		const tabTitle = tab.children[1];
		if (muted) {
			tabTitle.children[0].children[0].style.display = 'none';
			tabTitle.children[0].children[1].style.display = 'block';
		} else {
			tabTitle.children[0].children[0].style.display = 'block';
			tabTitle.children[0].children[1].style.display = 'none';
		}
	};

	const handleSettingsClick = function() {
		const display = document.querySelector('.settings-content').style.display;
		if (display === 'none' || display === '') {
			document.querySelector('.settings-content').style.display = 'block';
			document.querySelector('.tab-list').style.display = 'none';
		} else {
			document.querySelector('.settings-content').style.display = 'none';
			document.querySelector('.tab-list').style.display = 'block';
		}
	};

	// register to dom events
	// ---------------------------------------------------------
	document.addEventListener('DOMContentLoaded', function() {
		init();
		displayList();
	});

	document.addEventListener('unload', function() {
		unregisterAndCleanUp();
	});
	// ---------------------------------------------------------
})();
