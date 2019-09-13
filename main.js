const App = {
    currentWindowId: null,
    windowCounter: 0,
    listOfTabs: [],
    
    /**
     * main entry point
     * */  
    init: async function() {
        this.registerEvents();
        this.listOfTabs = await this.getTabsList();
        this.displayList({ tabsList: this.listOfTabs });
    },

    /**
     * Get list of all open tabs using chrome's own getAll method 
     * */ 
    getTabsList: function() {
        return new Promise((resolve) => {
            chrome.windows.getAll({ populate: true }, listOfWindows => {
                resolve(listOfWindows);
            });
        })
    },

    
    /**
     * register to user events such as click, mousedown and handlign filter box and filter
     * box clearance
     *  */ 
    registerEvents: function() {
        const tabList = document.querySelector('.tab-list');
        tabList.addEventListener('click', this.onTabListClick.bind(this));
        tabList.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.querySelector('.filterBox').addEventListener('keyup', this.filterTabs.bind(this));
        document.querySelector('.remove-filter').addEventListener('click', this.clearFilter.bind(this));
    },

    /**
     * render the tab list object  
     * @param {array} tabList - array of open tabs
     */
    displayList: function({ tabsList }) {
        const tabListDomElement = document.querySelector('.tab-list');

        tabsList.forEach((chromeWindow, index) => {
            const tabRowFragment = document.createDocumentFragment();

            chromeWindow.tabs.forEach(tab => {
                tabRowFragment.appendChild(this.buildTabRow({ tab }));
            });

            if (tabsList.length > 1 && chromeWindow.tabs.length > 0) {
                const group = this.buidWindowsGroup({ chromeWindow, tabRowFragment, windowIndex: index + 1 });
                tabListDomElement.appendChild(group);
            } else {
                tabListDomElement.appendChild(tabRowFragment);
            }
        });
    },

    /**
     * Organize sets of tabs into a group by windows.
     * if more than one chrome window is open, hightlight it's window
     * name with a number like window1, window2, etc.
     * @param {object} chromeWindow - chrome object containing tab data
     * @param {object} tabRowFragment - html fragment
     * @param {number} windowIndex - index of the current window (window1, window2, etc.) 
     */
    buidWindowsGroup: function({ chromeWindow, tabRowFragment, windowIndex }) {
        const group = document.createElement('div');
        group.className = `group ${chromeWindow.incognito ? 'incognito' : ''}`;

        const groupTitle = document.createElement('div');
        groupTitle.className = 'group-title';
        currentWindowId = chromeWindow.tabs.length > 0 ? chromeWindow.tabs[0].windowId : windowIndex;
        groupTitle.innerHTML = `window ${windowIndex}`;
        
        if (chromeWindow.incognito) {
            const img = document.createElement('img');
            img.src = '../images/incognito.png';
            img.style.width = '32px';
            img.className = "incognito-image";

            groupTitle.appendChild(img)
        }
        
        group.dataset.groupId = currentWindowId;

        if (chromeWindow.tabs.length > 0) {
            group.appendChild(groupTitle);
        }

        group.appendChild(tabRowFragment);

        return group;
    },

    /**
     * create a tab row as div in the UI
     * @param {object} tab - chrome's tab object
     */
    buildTabRow: function({ tab }) {
        const active = tab.active ? 'active' : '';

        const tabRow = document.createElement('div');
        tabRow.className = `tab-row ${active}`;
        tabRow.dataset.tabId = tab.id;
        tabRow.dataset.windowId = tab.windowId;
        
        const favIcon = this.createFavIcon({ tab });
        tabRow.appendChild(favIcon);

        const tabTitle = this.createTabTitle({ tab });
        tabRow.appendChild(tabTitle);

        const closeButtonDiv = this.createCloseButtonDiv();
        tabRow.appendChild(closeButtonDiv);

        return tabRow;
    },

    /**
     * create a div containing the title of tab
     * @param {object} tab - chrome's tab object
     */
    createTabTitle: function({ tab }) {
        const tabTitle = document.createElement('div');
        tabTitle.className = 'tab-title';

        const speakerSpan = this.createSpeakerIcon({ tab });
        tabTitle.appendChild(speakerSpan);

        const tabDesc = document.createElement('span');
        tabDesc.className = 'tab-desc';
        tabDesc.innerText = tab.title;

        tabTitle.appendChild(tabDesc);
        return tabTitle;
    },

    /**
     * create a div with fav icon 
     * @param {object} tab - chrome's tab object
     */
    createFavIcon: function({ tab }) {
        const favIcon = document.createElement('div');
        favIcon.className = 'favicon';

        const favIconImage = document.createElement('img');
        favIconImage.src = tab.favIconUrl;

        favIcon.appendChild(favIconImage);
        return favIcon;

    },

    /**
     * create a div with close button
     */
    createCloseButtonDiv: function() {
        const closeButtonDiv = document.createElement('div');
        closeButtonDiv.className = 'close-button';
        closeButtonDiv.dataset.type = 'closeButton';

        const closeButtonImage = document.createElement('img');
        closeButtonImage.src = './images/svg/times-circle.svg';
        closeButtonImage.dataset.type = 'closeButton';

        closeButtonDiv.appendChild(closeButtonImage);
        return closeButtonDiv;
    },

    /**
     * create div with speacker or mute icon 
     * @param {object} tab object and speaker visibility
     */
    createSpeakerIcon: function(params) {
        const { tab } = params;

        const speakerVisible = !tab.audible ? 'hidden' : '';
        let speakerImg = 'display: none';
        let mutedSpeakerImg = 'display:none';

        if (tab.audible) {
            speakerImg = tab.mutedInfo.muted ? 'display:none' : 'display:block';
            mutedSpeakerImg = tab.mutedInfo.muted ? 'display:block' : 'display:none';
        }

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
        return speakerSpan;
    },

    /**
     * Removes filter on box and calling the display list to render the list again
     */
    clearFilter: function() {
        document.querySelector('.filterBox').value = '';
        document.querySelector('.tab-list').innerHTML = '';
        this.displayList({ tabsList: this.listOfTabs });
    },

    /**
    * handle middle click button, closes the tab
    * @param {event} event - mouse down event
    */
    onMouseDown: function(event) {
        const isMiddleButtonDown = event.which === 2;
        if (isMiddleButtonDown) {
            const { tabId } = this.getTabData(event);
            this.removeTabFromList(tabId);
            this.closeTab(tabId);
        }
    },

    /**
     * handle clicking on a tab row
     * @param {event} event - onClick event
     */
    onTabListClick :function(event) {
        const { tabId, windowId } = this.getTabData(event);
        const tagName = event.target.tagName.toLowerCase();
        const type = event.target.dataset.type;

        if (tagName === 'img' && type === 'speaker') {
            this.toggleMute(tabId);
            return;
        }

        if ((tagName === 'img' || tagName === 'div') && type === 'closeButton') {
            this.removeTabFromList(tabId);
            this.closeTab(tabId);
        } else {
            this.setActiveTab({ tabId, windowId });
        }
    },

    /**
     * handle clicking on the sound icon, toggling mute and unmute 
     * @param {number} tabId from chrome's tab data object. used to get the clicked tab
     */
    toggleMute: function(tabId) {
        chrome.tabs.get(tabId, tabData => {
            const muted = !tabData.mutedInfo.muted;
            chrome.tabs.update(tabId, { muted: muted });
            this.toggleMuteIcon(tabId, muted);
        });
    },

    /**
     * handle click on a tab name in the list
     * @param {number} tabId - from chrome's tab data object. used to get the clicked tab
     * @param {number} windowId - index of the window
     */
    setActiveTab: function({ tabId, windowId }) {
        chrome.windows.update(windowId, { focused: true }, function() {
            this.selectedWindowId = windowId;
        });

        chrome.tabs.update(tabId, { active: true });
    },

    unregisterEvents: function() {
        document.querySelector('.tab-list').removeEventListener('click', this.onTabListClick.bind(this));
        document.querySelector('.filterBox').removeEventListener('keyup', this.filterTabs.bind(this));
        document.querySelector('.remove-filter').removeEventListener('click', this.clearFilter.bind(this));
    },

    /**
     * handle on click on a tab to return it's id and window id (index of id)
     * @param {event} event - on click event 
     */
    getTabData: function(event) {
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
    }, 

    /**
     * handle closing the tab
     * @param {number} tabId - the tab the user clicked on closing
     */
    closeTab: function(tabId) {
        chrome.tabs.remove(tabId);
    },

    /**
     * handler for clicking the close button, remove the div from the container
     * @param {number} tabId - tab number
     */
    removeTabFromList: function(tabId) {
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
    }, 

    /**
     * Event handler for clicking on the speaker icon
     * @param {number} tabId - chrome object tab id
     * @param {boolean} muted - is the tab muted or not 
     */
    toggleMuteIcon: function(tabId, muted) {
        const list = [...document.querySelectorAll('.tab-row')];
        const tab = list.find(tab => parseInt(tab.dataset.tabId) === parseInt(tabId));

        const tabTitle = tab.children[1];

        tabTitle.children[0].children[0].style.display = muted ? 'none' : 'block';
        tabTitle.children[0].children[1].style.display = muted ? 'block' : 'none';
    }, 

    /**
     * Filter the tab list when writing in the filter box
     * @param {event} event - keyboard event
     */
    filterTabs: function(event) {
        const valueToFilterBy = event.target.value.toLowerCase();

        const filteredList = this.listOfTabs.map(group => {
            const tabs = group.tabs.filter(tab => {
                return tab.title.toLowerCase().indexOf(valueToFilterBy) > -1 || tab.url.toLowerCase().indexOf(valueToFilterBy) > -1;
            });

            return Object.assign({}, group, {
                tabs,
            });
        });

        this.displayFilteredList(filteredList);
    },

    /**
     * Display the results of the filter as a list
     * @param {array} filteredListOfTabs - list of filter tabs
     */

    displayFilteredList: function(filteredListOfTabs) {
        const tabListDomElement = document.querySelector('.tab-list');
        tabListDomElement.innerHTML = '';
        this.displayList({ tabsList: filteredListOfTabs });
    }
};

/**
 * start up and register to unload
 */
window.addEventListener('DOMContentLoaded', function() {
    App.init();
});

window.addEventListener('unload', function() {
    App.unregisterEvents();
});