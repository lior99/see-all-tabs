(function main() {
	let currentWindowId = null;
	let windowCounter = 0;
	let listOfTabs = [];

	function displayFilteredList(filteredListOfTabs) {
		const tabListDomElement = document.querySelector('.tab-list');
		tabListDomElement.innerHTML = '';
		displayList({ tabsList: filteredListOfTabs });
	}

	function getTabsList() {
		return new Promise((resolve, reject) => {
			chrome.windows.getAll({ populate: true }, listOfWindows => {
				listOfTabs = [...listOfWindows];
				resolve();
			});
		});
	}

	function displayList({ tabsList }) {
		const tabListDomElement = document.querySelector('.tab-list');

		tabsList.forEach((chromeWindow, index) => {
			const tabRowFragment = document.createDocumentFragment();
			chromeWindow.tabs.forEach(tab => {
				tabRowFragment.appendChild(buildTabRow({ tab }));
			});

			if (tabsList.length > 1 && chromeWindow.tabs.length > 0) {
				const group = buildGroup({ chromeWindow, tabRowFragment, windowIndex: index + 1 });
				tabListDomElement.appendChild(group);
			} else {
				tabListDomElement.appendChild(tabRowFragment);
			}
		});
	}

	function buildGroup({ chromeWindow, tabRowFragment, windowIndex }) {
		const group = document.createElement('div');
		group.className = 'group';

		const groupTitle = document.createElement('div');
		groupTitle.className = 'group-title';
		currentWindowId = chromeWindow.tabs.length > 0 ? chromeWindow.tabs[0].windowId : windowIndex;
		groupTitle.innerText = `window ${windowIndex}`;
		group.className = 'group';
		group.dataset.groupId = currentWindowId;

		if (chromeWindow.tabs.length > 0) {
			group.appendChild(groupTitle);
		}
		group.appendChild(tabRowFragment);

		return group;
	}

	function buildTabRow({ tab }) {
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
	}

	function clearFilter() {
		document.querySelector('.filterBox').value = '';
		document.querySelector('.tab-list').innerHTML = '';
		displayList({ tabsList: listOfTabs });
	}

	function registerEvents() {
		document.querySelector('.tab-list').addEventListener('click', handleClickEvent);
		document.querySelector('.filterBox').addEventListener('keyup', filterTabs);
		document.querySelector('.remove-filter').addEventListener('click', clearFilter);
	}

	function handleClickEvent(event) {
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
	}

	function toggleMute(tabId) {
		chrome.tabs.get(tabId, function(tabData) {
			const muted = !tabData.mutedInfo.muted;
			chrome.tabs.update(tabId, { muted: muted });
			toggleMuteIcon(tabId, muted);
		});
	}

	function setActiveTab({ tabId, windowId }) {
		// if (windowId && windowId !== selectedWindowId) {
		chrome.windows.update(windowId, { focused: true }, function() {
			selectedWindowId = windowId;
		});

		chrome.tabs.update(tabId, { active: true });
	}

	function unregisterAndCleanUp() {
		document.querySelector('.tab-list').addEventListener('click', handleClickEvent);
		document.querySelector('.filterBox').addEventListener('keyup', filterTabs);
		document.querySelector('.remove-filter').addEventListener('click', clearFilter);
	}

	function getTabData(event) {
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
	}

	function closeTab(tabId) {
		chrome.tabs.remove(tabId);
	}

	function removeTabFromList(tabId) {
		const list = [...document.querySelectorAll('.tab-row')];
		const tab = list.find(tab => parseInt(tab.dataset.tabId) === parseInt(tabId));

		const group = tab.parentElement;

		if (!group) {
			document.querySelector('.tab-list').removeChild(tab);
		} else {
			group.removeChild(tab);
			const children = [...group.children];
			const hasTabs = children.some(htmlElement => htmlElement.classList.contains('tab-row'));
			if (!hasTabs) {
				document.querySelector('.tab-list').removeChild(group);
			}
		}
	}

	function toggleMuteIcon(tabId, muted) {
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
	}

	function filterTabs(event) {
		const valueToFilterBy = event.target.value;

		const filteredList = listOfTabs.map(group => {
			const tabs = group.tabs.filter(tab => {
				return tab.title.indexOf(valueToFilterBy) > -1 || tab.url.indexOf(valueToFilterBy) > -1;
			});

			return Object.assign({}, group, {
				tabs,
			});
		});

		displayFilteredList(filteredList);
	}

	async function init() {
		registerEvents();
		await getTabsList();
		displayList({ tabsList: listOfTabs });
	}

	// register to dom events
	// ---------------------------------------------------------
	document.addEventListener('DOMContentLoaded', function() {
		init();
	});

	document.addEventListener('unload', function() {
		unregisterAndCleanUp();
	});
	// ---------------------------------------------------------
})();
