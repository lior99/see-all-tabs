import {
  INCOGNITO_IMAGE,
  SPEAKER,
  ARROW_DOWN,
  ARROW_UP,
  ENTER_KEY,
  ARROW_LEFT,
  ARROW_RIGHT,
} from './consts.js';

const App = {
  currentWindowId: null,
  windowCounter: 0,
  listOfTabs: [],
  highlightedTab: -1,
  isInFilterMode: false,
  filteredResultsLength: 0,
  tabsCount: 0,
  showOnlyCurrentWindow: false,

  /**
   * main entry point
   * */

  init: async function({ settings }) {
    const { onlyCurrentWindow, theme } = settings;
    const { name: selectedTheme }= theme;

    this.showOnlyCurrentWindow = onlyCurrentWindow;
    this.eventCounter = 0;

    this.setTheme(selectedTheme);
    
    this.registerEvents();
    this.listOfTabs = await this.getTabsList(this.showOnlyCurrentWindow);


    this.displayList({ tabsList: this.listOfTabs });
    document.querySelector('.filterBox').focus();
    this.tabsCount = this.calcTabsCount({ groupOfTabs: this.listOfTabs });
  },

  setTheme(selectedTheme) {
    switch(selectedTheme) {
      case 'light':
        document.body.classList.remove('dark-mode');
        document.body.classList.remove('black');
        break;
      case 'black':
        document.body.classList.add('black-theme');
        break;
      case 'dark':
        document.body.classList.add('dark-theme');
        break;
      }
  },

  /**
   * Get list of all open tabs using chrome's own getAll method
   * */

  getTabsList: function(showOnlyCurrentWindow = false) {
    return new Promise(resolve => {
      if (showOnlyCurrentWindow) {
        chrome.windows.getCurrent({ populate: true }, window => {
          // chrome.tabs.getAllInWindow(window.id, tabs => {
          //   resolve(tabs);
          // })

          const queryinfo = {
            currentWindow: true,
          };

          chrome.tabs.query(queryinfo, tabs => {
            resolve(tabs);
          })
        });  
      } else {
        chrome.windows.getAll({ populate: true }, listOfWindows => {
          resolve(listOfWindows);
        });
      }
    });
  },

  /**
   * register to user events such as click, mousedown and handlign filter box and filter
   * box clearance
   *  */

  registerEvents: function() {
    const tabList = document.querySelector('.tab-list');
    const filterBox = document.querySelector('.filterBox');
    tabList.addEventListener('click', this.onTabListClick.bind(this));
    tabList.addEventListener('mousedown', this.onMouseDown.bind(this));
    filterBox.addEventListener('keyup', this.filterTabs.bind(this));
    document
      .querySelector('.remove-filter')
      .addEventListener('click', this.clearFilter.bind(this));
    document
      .querySelector('body')
      .addEventListener('keyup', this.onKeyboardButtonPress.bind(this));
    document
      .querySelector('body')
      .addEventListener('mousemove', this.onMouseMove.bind(this));
  },

  /**
   * onmouse move handle for the body
   */
  onMouseMove: function() {
    this.setHightlitedTab({ set: false });
  },

  /**
   * render the tab list object
   * @param {array} tabList - array of open tabs
   */
  displayList: async function({ tabsList }) {
    const tabListDomElement = document.querySelector('.tab-list');
    const currentWindowId = await this.getCurrentWindow();

    if (this.showOnlyCurrentWindow) {
      const domFragment = this.displayListOfTabsInCurrentWindowOnly({ tabs: tabsList, currentWindowId })
      tabListDomElement.appendChild(domFragment);
    } else {
      tabsList.sort((a, b) => {
        return (a.id === currentWindowId) ? -1 : 1;
      })

      tabsList.forEach((chromeWindow, index) => {
        const tabRowFragment = document.createDocumentFragment();
  
        chromeWindow.tabs.forEach(tab => {
          tabRowFragment.appendChild(this.buildTabRow({ tab, currentWindowId, onlyTabInWindow: chromeWindow.tabs.length === 1 }));
        });
  
        if (tabsList.length > 1 && chromeWindow.tabs.length > 0) {
            const group = this.buildWindowsGroup({
              chromeWindow,
              tabRowFragment,
              windowIndex: index + 1,
              windowId: window.id,
              isCurrentWindow: chromeWindow.id === currentWindowId
            });
          
            tabListDomElement.appendChild(group);
  
        } else {
          tabListDomElement.appendChild(tabRowFragment);
        }
      });
    }
  },

  /**
   * list of tabs without a group - only tabs in current window
   * @param {array} tabs - all tabs in the window that invoked the extension
   * @param {number} currentWindowId - current window id
   */
  displayListOfTabsInCurrentWindowOnly: function({ tabs, currentWindowId }) {
    const tabRowFragment = document.createDocumentFragment();

    tabs.forEach(tab => {
      tabRowFragment.appendChild(this.buildTabRow({ tab, currentWindowId, onlyTabInWindow: tabs.length === 1 }));
    });

    return tabRowFragment;
  },

  /**
   * Gets the current active window
   */
  getCurrentWindow: function() {
    return new Promise(resolve => {
      chrome.windows.getCurrent({}, currentWindow => {
        resolve(currentWindow.id);
      });
    });
  },

  /**
   * Organize sets of tabs into a group by windows.
   * if more than one chrome window is open, hightlight it's window
   * name with a number like window1, window2, etc.
   * @param {object} chromeWindow - chrome object containing tab data
   * @param {object} tabRowFragment - html fragment
   * @param {number} windowIndex - index of the current window (window1, window2, etc.)
   * @param {number} windowId - id of chrome window
   * @param {boolean} isCurrentWindow - flag is the chrome window the active one
   */
  buildWindowsGroup: function({ chromeWindow, tabRowFragment, windowIndex, windowId, isCurrentWindow }) {
    const group = document.createElement('div');
    group.className = `group ${chromeWindow.incognito ? 'incognito' : ''}`;

    const groupTitle = document.createElement('div');

    const currentWindowId = windowId;

    if (isCurrentWindow) {
      groupTitle.textContent = `This Window`;
      groupTitle.className = 'group-title current';
    } else {
      groupTitle.textContent = `window ${windowIndex}`;
      groupTitle.className = 'group-title';
    }

    if (chromeWindow.incognito) {
      const img = document.createElement('img');
      img.src = INCOGNITO_IMAGE.src;
      img.style.width = INCOGNITO_IMAGE.width;
      img.className = INCOGNITO_IMAGE.className;

      groupTitle.appendChild(img);
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
   * @param {number} currentWindowId - id of current window
   * @param {boolean} onlyTabInWindow - is there only one tab in the window, if yes than don't style it as active
   */
  buildTabRow: function({ tab, currentWindowId, onlyTabInWindow }) {
    const active = tab.active && tab.windowId === currentWindowId && !onlyTabInWindow ? 'active' : '';

    const tabRow = document.createElement('div');
    tabRow.className = `tab-row ${active}`;
    tabRow.dataset.tabId = tab.id;
    tabRow.dataset.windowId = tab.windowId;

    const activePlaceHolder = this.createActivePlaceHolder(active);
    tabRow.appendChild(activePlaceHolder);

    const favIcon = this.createFavIcon({ tab });
    tabRow.appendChild(favIcon);

    const tabTitle = this.createTabTitle({ tab });
    tabRow.appendChild(tabTitle);

    const closeButtonDiv = this.createCloseButtonDiv();
    tabRow.appendChild(closeButtonDiv);

    return tabRow;
  },


  /**
   * Create a box to display active indicator
   */
  createActivePlaceHolder: function() {
    const placeHolder = document.createElement('div');
    placeHolder.className = 'place-holder';
    
    return placeHolder;
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
   
    return closeButtonDiv;
  },

  /**
   * create div with speacker or mute icon
   * @param {object} tab object and speaker visibility
   */
  createSpeakerIcon: function(params) {
    const { tab } = params;
    const speakerSpan = document.createElement('span');
    
    speakerSpan.className = `speaker ${tab.audible ? tab.mutedInfo.muted ? 'volume-mute' : 'volume-up' : ''}`;
    speakerSpan.dataset.type = SPEAKER.type;

    return speakerSpan;
  },

  /**
   * Removes filter on box and calling the display list to render the list again
   */
  clearFilter: function() {
    document.querySelector('.filterBox').value = '';
    const tabListElement = document.querySelector('.tab-list');

    while(tabListElement.firstChild) {
      tabListElement.removeChild(tabListElement.firstChild);
    }

    this.displayList({ tabsList: this.listOfTabs });
    this.isInFilterMode = false;
  },

  /**
   * handle middle click button, closes the tab
   * @param {event} event - mouse down event
   */
  onMouseDown: function(event) {
    event.stopImmediatePropagation();

    const isMiddleButtonDown = event.button === 1;

    if (isMiddleButtonDown) {
      const { tabId } = this.getTabData(event);
      if (!tabId) {
        return;
      }

      this.removeTabFromList(tabId);
      this.closeTab(tabId);
    }
  },

  /**
   * handle clicking on a tab row
   * @param {event} event - onClick event
   */
  onTabListClick: function(event) {
    // if (event.currentTarget.id === 'tabList') {
    //   alert('inside')
    //   return;
    // }

    const { tabId, windowId } = this.getTabData(event);
    const tagName = event.target.tagName.toLowerCase();
    const type = event.target.dataset.type;

    if (type === 'speaker') {
      this.toggleMute(tabId);
      return;
    }

    // if ((tagName === 'img' || tagName === 'div') && type === 'closeButton') {
    if (type === 'closeButton') {
      this.removeTabFromList(tabId);
      this.closeTab(tabId);
    } else {
      if (!tabId) {
        return;
      }
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
    document
      .querySelector('.tab-list')
      .removeEventListener('click', this.onTabListClick);
    document
      .querySelector('.filterBox')
      .removeEventListener('keyup', this.filterTabs);
    document
      .querySelector('.remove-filter')
      .removeEventListener('click', this.clearFilter);
    window.removeEventListener('mousemove', this.onMouseMove);
  },

  /**
   * handle on click on a tab to return it's id and window id (index of id)
   * @param {event} event - on click event
   */
  getTabData: function(event) {
    let currentElement = event.target;
    let elementType = currentElement.tagName.toLowerCase();

    if (currentElement.classList.contains('tab-list')) {
      return {};
    }

    while (
      elementType !== 'div' ||
      (elementType === 'div' && !currentElement.classList.contains('tab-row'))
    ) {
      currentElement = currentElement.parentNode;
      elementType = currentElement.tagName.toLowerCase();
    }

    return {
      tabId: parseInt(currentElement.dataset.tabId),
      windowId: parseInt(currentElement.dataset.windowId)
    };
  },

  /**
   * handle closing the tab
   * @param {number} tabId - the tab the user clicked on closing
   */
  closeTab: function(tabId) {
    chrome.tabs.remove(tabId, () => {
      if (!Array.isArray(this.listOfTabs)) {
        this.listOfTabs = [this.listOfTabs];
      }
  
      if (this.showOnlyCurrentWindow) {
          const index = this.listOfTabs.findIndex(tab => tab.id === tabId);
          if (index !== -1) {
            this.listOfTabs.splice(index, 1)
          }
      } else {
        this.listOfTabs.some(chromeWindow => {
          const index = chromeWindow.tabs.findIndex(tab => tab.id === tabId);
          if (index !== -1) {
            chromeWindow.tabs.splice(index, 1)
            return;
          }
        })
      }

      this.tabsCount = this.calcTabsCount({ groupOfTabs: this.listOfTabs });
    });

  },

  /**
   * handler for clicking the close button, remove the div from the container
   * @param {number} tabId - tab number
   */
  removeTabFromList: function(tabId) {
    const list = [...document.querySelectorAll('.tab-row')];
    const tab = list.find(
      tab => parseInt(tab.dataset.tabId) === parseInt(tabId)
    );

    const group = tab.parentElement;

    if (!group) {
      document.querySelector('.tab-list').removeChild(tab);
    } else {
      group.removeChild(tab);
      const children = [...group.children];
      
      if (children.legnth > 0) {
        const hasTabs = children.some(htmlElement =>
          htmlElement.classList.contains('tab-row')
        );
  
        if (!hasTabs) {
          document.querySelector('.tab-list').removeChild(group);
        }
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
    const tab = list.find(
      tab => parseInt(tab.dataset.tabId) === parseInt(tabId)
    );

    
    const speakerSpan = tab.children[2].children[0];
    if (muted) {
      speakerSpan.classList.remove('volume-up');
      speakerSpan.classList.add('volume-mute');
    } else {
      speakerSpan.classList.remove('volume-mute');
      speakerSpan.classList.add('volume-up');
    }
  },

  /**
   * Filter the tab list when writing in the filter box
   * @param {event} event - keyboard event
   */
  filterTabs: function(event) {
    const { keyCode } = event;

    if (
      keyCode === ARROW_DOWN ||
      keyCode === ARROW_UP ||
      keyCode === ENTER_KEY ||
      keyCode === ARROW_LEFT ||
      keyCode === ARROW_RIGHT
    ) {
      return;
    }

    // clicking on the touchpad "middle click" fires 4 keyboard events
    // so, I use this hack to prevent the filter which caused the list to duplicate itself 4 times
    if (event.key === 'F22' || event.key === 'Shift' || event.key === 'Control' || event.key === 'Meta') {
      this.eventCounter++;
      return;
    }

    if (this.eventCounter === 3) {
      this.eventCounter = 0;
    }

    const valueToFilterBy = event.target.value.toLowerCase();
    if (valueToFilterBy.length === 0) {
      this.clearFilter();    
      return;
    }

    let filteredList;

    if (this.showOnlyCurrentWindow) {
      filteredList = this.listOfTabs.filter(tab => {
        return (
          tab.title.toLowerCase().indexOf(valueToFilterBy) > -1 ||
          tab.url.toLowerCase().indexOf(valueToFilterBy) > -1
        );
      });    
    } else {
      filteredList = this.listOfTabs.map(group => {
        const tabs = group.tabs.filter(tab => {
          return (
            tab.title.toLowerCase().indexOf(valueToFilterBy) > -1 ||
            tab.url.toLowerCase().indexOf(valueToFilterBy) > -1
          );
        });
  
        return Object.assign({}, group, {
          tabs
        });
      });
    }

    this.displayFilteredList(filteredList);
    this.highlightedTab = -1;
    this.isInFilterMode = true;
    this.filteredResultsLength = this.calcTabsCount({
      groupOfTabs: filteredList
    });
  },

  onKeyboardButtonPress: function(event) {
    const { keyCode } = event;

    // check if up/down arrows and enter
    if (
      keyCode === ARROW_DOWN ||
      keyCode === ARROW_UP ||
      keyCode === ENTER_KEY
    ) {
      switch (keyCode) {
        case ENTER_KEY: {
          const { tabId, windowId } = document.querySelectorAll('.tab-row')[
            this.highlightedTab
          ].dataset;
          const params = {
            tabId: parseInt(tabId),
            windowId: parseInt(windowId)
          };

          this.setActiveTab(params);
          break;
        }

        case ARROW_UP: {
          this.highlightPreviousTab();
          break;
        }
        case ARROW_DOWN: {
          this.highlightNextTab();
          break;
        }
      }
    }
  },

  highlightNextTab: function() {
    if (this.isInFilterMode) {
      if (this.highlightedTab + 1 <= this.filteredResultsLength - 1) {
        this.highlightedTab++;
        this.setHightlitedTab({ set: true });
      }
    } else {
      if (this.highlightedTab + 1 < this.tabsCount) {
        this.highlightedTab++;
        this.setHightlitedTab({ set: true });
      }
    }
  },

  highlightPreviousTab: function() {
    if (this.highlightedTab > 0) {
      this.highlightedTab--;
      this.setHightlitedTab({ set: true });
    }
  },

  /**
   * calculate how many open tabs are there including all open windows
   */
  calcTabsCount: function({ groupOfTabs }) {
    if (this.showOnlyCurrentWindow) {
      return groupOfTabs.length;
    }


    if(!Array.isArray(groupOfTabs)) {
      groupOfTabs = [groupOfTabs]
    }
    
    if (groupOfTabs.length === 1) {
      return groupOfTabs[0].tabs.length;
    }

    let total = 0;
    const totalTabsNumber = groupOfTabs.reduce((tabCount, currentValue) => {
      return tabCount + currentValue.tabs.length;
    }, total);

    return totalTabsNumber;
  },

  /**
   * Set background color to a tab
   * @param {boolean} set - indicates whether to highlight a tab or not
   */
  setHightlitedTab: function({ set }) {
    const tabRowsList = document.querySelectorAll('.tab-row');

    tabRowsList.forEach(element => element.classList.remove('hightlighted'));

    if (set) {
      tabRowsList[this.highlightedTab].classList.add('hightlighted');
      tabRowsList[this.highlightedTab].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  },

  /**
   * Display the results of the filter as a list
   * @param {array} filteredListOfTabs - list of filter tabs
   */

  displayFilteredList: function(filteredListOfTabs) {
    const tabListDomElement = document.querySelector('.tab-list');
    tabListDomElement.textContent = '';
    this.displayList({ tabsList: filteredListOfTabs });
  }
}

export default App;
