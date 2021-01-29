import {
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT, ARROW_UP,
  ENTER_KEY,
  groupColors,
  INCOGNITO_IMAGE,
  SPEAKER
} from './consts.js';

const App = (function() {
  let currentWindowId = null;
  let windowCounter = 0;
  let listOfTabs = [];
  let highlightedTab = -1;
  let isInFilterMode = false;
  let filteredResultsLength = 0;
  let tabsCount = 0;
  let showOnlyCurrentWindow; // = true;
  let eventCounter = 0;

  /**
   * main entry point
   * */

  async function init({ settings }) {
    const { onlyCurrentWindow = true, theme = {} } = settings;
    const { name = 'dark' } = theme;

    showOnlyCurrentWindow = onlyCurrentWindow;

    const tabGroup = await getTabsGroups();

    if (tabGroup) {
      setGroupsIcons(tabGroup);
    }

    registerEvents();
    listOfTabs = await getTabsList(showOnlyCurrentWindow);

    setTheme(name);

    displayList({ tabsList: listOfTabs, tabGroup });
    document.querySelector('.filterBox').focus();
    tabsCount = calcTabsCount({ groupOfTabs: listOfTabs });
  }

  function setGroupsIcons(groups) {
    groups.forEach(group => {
      const div = document.createElement('div');
      div.className = 'tab-group';
      div.style.background = groupColors[group.color];
      div.textContent = group.title;
      div.dataset.collapsed = group.collapsed; 
      div.dataset.id = group.id;
      div.dataset.type = 'group';

      document.querySelector('#groups').appendChild(div);
    });
  }

  function setTheme(selectedTheme) {
    switch(selectedTheme) {
      case 'light':
        document.body.classList.remove('dark-mode');
        document.body.classList.remove('black-theme');
        document.body.classList.add('light-theme');

        break;
      case 'black':
        document.body.classList.add('black-theme');
        document.body.classList.remove('dark-mode');
        document.body.classList.remove('light-theme');
        break;
      case 'dark':
        document.body.classList.add('dark-theme');
        document.body.classList.remove('black-theme');
        document.body.classList.remove('light-theme');
        break;
      }
  }

  function getTabsGroups() {
    if (chrome.tabGroups) {
      return new Promise(resolve => {
        chrome.tabGroups.query({}, function(tabGroup){
          resolve(tabGroup);
        });
      });
    } else {
      return Promise.resolve(null);
    }
  }

  /**
   * Get list of all open tabs using chrome's own getAll method
   * */
  function getTabsList(showOnlyCurrentWindow = false) {
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
  }

  /**
   * register to user events such as click, mousedown and handlign filter box and filter
   * box clearance
   *  */

  function registerEvents() {
    const tabList = document.querySelector('.tab-list');
    const filterBox = document.querySelector('.filterBox');
    const groups = document.querySelector('#groups');

    tabList.addEventListener('click', onTabListClick);
    tabList.addEventListener('mousedown', onMouseDown);
    filterBox.addEventListener('keyup', filterTabs);

    groups.addEventListener('click', onTabGroupClick);

    document
      .querySelector('.remove-filter')
      .addEventListener('click', clearFilter);
    document
      .querySelector('body')
      .addEventListener('keyup', onKeyboardButtonPress);
    document
      .querySelector('body')
      .addEventListener('mousemove', onMouseMove);
  }

  function onTabGroupClick(event) {
    const { target } = event;
    if (target.dataset.type === 'group') {
      let { id: groupId } = target.dataset;

      groupId = parseInt(groupId);

      chrome.tabGroups.get(groupId, tabGroup => {
        const { collapsed } = tabGroup;

        chrome.tabGroups.update(groupId, {
          collapsed: !collapsed
        }, function(tabGroup){
          console.log('tabGroup', tabGroup)
        })
      });
    }
  }

  /**
   * onmouse move handle for the body
   */
  function onMouseMove() {
    setHightlitedTab({ set: false });
  }

  /**
   * render the tab list object
   * @param {array} tabList - array of open tabs
   */
  async function displayList({ tabsList, tabGroup }) {
    const tabListDomElement = document.querySelector('.tab-list');
    const currentWindowId = await getCurrentWindow();

    if (showOnlyCurrentWindow) {
      const domFragment = displayListOfTabsInCurrentWindowOnly({ tabs: tabsList, currentWindowId, tabGroup })
      tabListDomElement.appendChild(domFragment);
    } else {
      tabsList.sort((a, b) => {
        return (a.id === currentWindowId) ? -1 : 1;
      })

      tabsList.forEach(async (chromeWindow, index) => {
        const tabRowFragment = document.createDocumentFragment();
  
        // chromeWindow.tabs.forEach(async tab => {
        //   const tabRow = await buildTabRow({ tab, currentWindowId, onlyTabInWindow: chromeWindow.tabs.length === 1 });
        //   console.log('%ctab row in inner function', 'color: magenta; font-size: 30px', tabRow);
        //   tabRowFragment.appendChild(tabRow);
        //   console.log('%c tabRowFragment', 'color: hotpink; font-size: 30px', tabRowFragment);
        // });

        const tabRowsList = await createAllTabRowsAsync({ tabList: chromeWindow.tabs });
        console.log('%c tabRowsList', 'color: yellow; font-size: 30px', tabRowsList);
        tabRowsList.forEach(tabRow => tabRowFragment.appendChild(tabRow));

        if (tabsList.length > 1 && chromeWindow.tabs.length > 0) {
            const group = buildWindowsGroup({
              chromeWindow,
              tabRowFragment,
              windowIndex: index + 1,
              windowId: window.id,
              isCurrentWindow: chromeWindow.id === currentWindowId
            });
          
            tabListDomElement.appendChild(group);
  
        } else {
          tabListDomElement.appendChild(tabRowFragment);
          
          console.log('%c @@@@ tabListDomElement', 'color: magenta; font-size: 30px', tabListDomElement);
        }
      });
    }
  }

  async function createAllTabRowsAsync({ tabList }) {
    return new Promise(async (resolve, reject) => {
      try {
        const tabsPromises = await tabList.map(async tab => {
          const tabRow = await buildTabRow({ tab, currentWindowId, onlyTabInWindow: tabList.length === 1 });
          console.log('%c createAllTabRowsAsync -> tabRow ', 'color: hotpink; font-size: 30px', tabRow);
          return tabRow;
        });

        const tabs = await Promise.all(tabsPromises);
        console.log('%c @@@@ tabs', 'color: magenta; font-size: 30px', tabs);

        resolve(tabs);
      } catch(error) {
        reject(error);
      }
    })
  }

  /**
   * list of tabs without a group - only tabs in current window
   * @param {array} tabs - all tabs in the window that invoked the extension
   * @param {number} currentWindowId - current window id
   */
  function displayListOfTabsInCurrentWindowOnly({ tabs, currentWindowId, tabGroup }) {

    console.log('%c #######', 'color: magenta; font-size: 30px', );

    const tabRowFragment = document.createDocumentFragment();
    let groupParams = null;

    
    // check if browser supports tab grouping
    if (chrome.tabGroups) {
      
      console.log('%c support', 'color: pink; font-size: 40px', chrome.tabGroups);

      tabs.forEach(tab => {
        const groups = getGroupData({ tabGroup, groupId: tab.groupId });
  
        let groupParams = null;
  
        if (groups) {
          const { collapsed, color, title } = params;
          groupParams = { collapsed, color, title };
        }
  
        tabRowFragment.appendChild(buildTabRow({ tab, currentWindowId, onlyTabInWindow: tabs.length === 1, groupParams }));
      });
    } else {
      tabs.forEach(tab => {
        tabRowFragment.appendChild(buildTabRow({ tab, currentWindowId, onlyTabInWindow: tabs.length === 1, groupParams }));
      });
    }
  
    return tabRowFragment;
  }

  function getGroupData({ tabGroup, groupId }) {
    const tabGroupItem = tabGroup.filter(group => group.id === groupId);

    if (tabGroupItem.length > 0) {
      const { collapsed, color, title } = tabGroupItem[0];
      return {
        collapsed,
        color,
        title 
      }
    } else {
      return null;
    }
  }

  /**
   * Gets the current active window
   */
  function getCurrentWindow() {
    return new Promise(resolve => {
      chrome.windows.getCurrent({}, currentWindow => {
        resolve(currentWindow.id);
      });
    });
  }

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
  function buildWindowsGroup({ chromeWindow, tabRowFragment, windowIndex, windowId, isCurrentWindow }) {
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
  }

  /**
   * create a tab row as div in the UI
   * @param {object} tab - chrome's tab object
   * @param {number} currentWindowId - id of current window
   * @param {boolean} onlyTabInWindow - is there only one tab in the window, if yes than don't style it as active
   */
  async function buildTabRow({ tab, currentWindowId, onlyTabInWindow, groupParams }) {
    const active = tab.active && tab.windowId === currentWindowId && !onlyTabInWindow ? 'active' : '';

    const tabRow = document.createElement('div');
    tabRow.className = `tab-row ${active}`;
    tabRow.dataset.tabId = tab.id;
    tabRow.dataset.windowId = tab.windowId;

    if (chrome.tabGroups) {
        const { groupId } = tab; 

        if (groupId > 0) {
          const { tabColor, id } = await (() => {
            return new Promise(resolve => {
              chrome.tabGroups.get(groupId, tabGroupParams => {
                const { color, id } = tabGroupParams;
                const tabColor = groupColors[color];
                resolve({ tabColor, id })
              });
            })
          })();

          const activePlaceHolder = createTabGroupPlaceHolder({ tabColor, id });
          tabRow.appendChild(activePlaceHolder);
        }
    }
   
    const favIcon = createFavIcon({ tab });
    tabRow.appendChild(favIcon);

    const tabTitle = createTabTitle({ tab });
    tabRow.appendChild(tabTitle);

    const closeButtonDiv = createCloseButtonDiv();
    tabRow.appendChild(closeButtonDiv);

    return tabRow;
  }


  /**
   * Create a box to display active indicator
   */
  function createTabGroupPlaceHolder({ id, tabColor }) {
    const placeHolder = document.createElement('div');
    placeHolder.className = 'place-holder';
    placeHolder.style.background = tabColor;
    // placeHolder.dataset.group = 'dummy'; // TODO: please refactor this 
    
    return placeHolder;
  }


  /**
   * create a div containing the title of tab
   * @param {object} tab - chrome's tab object
   */
  function createTabTitle({ tab }) {
    const tabTitle = document.createElement('div');
    tabTitle.className = 'tab-title';

    const speakerSpan = createSpeakerIcon({ tab });
    tabTitle.appendChild(speakerSpan);

    const tabDesc = document.createElement('span');
    tabDesc.className = 'tab-desc';
    tabDesc.innerText = tab.title;

    tabTitle.appendChild(tabDesc);
    return tabTitle;
  }

  /**
   * create a div with fav icon
   * @param {object} tab - chrome's tab object
   */
  function createFavIcon({ tab }) {
    const favIcon = document.createElement('div');
    favIcon.className = 'favicon';

    const favIconImage = document.createElement('img');
    favIconImage.src = tab.favIconUrl;

    favIcon.appendChild(favIconImage);
    return favIcon;
  }

  /**
   * create a div with close button
   */
  function createCloseButtonDiv() {
    const closeButtonDiv = document.createElement('div');
    closeButtonDiv.className = 'close-button';
    closeButtonDiv.dataset.type = 'closeButton';
   
    return closeButtonDiv;
  }

  /**
   * create div with speacker or mute icon
   * @param {object} tab object and speaker visibility
   */
  function createSpeakerIcon(params) {
    const { tab } = params;
    const speakerSpan = document.createElement('span');
    
    speakerSpan.className = `speaker ${tab.audible ? tab.mutedInfo.muted ? 'volume-mute' : 'volume-up' : ''}`;
    speakerSpan.dataset.type = SPEAKER.type;

    return speakerSpan;
  }

  /**
   * Removes filter on box and calling the display list to render the list again
   */
  function clearFilter() {
    document.querySelector('.filterBox').value = '';
    const tabListElement = document.querySelector('.tab-list');

    while(tabListElement.firstChild) {
      tabListElement.removeChild(tabListElement.firstChild);
    }

    displayList({ tabsList: listOfTabs });
    isInFilterMode = false;
  }

  /**
   * handle middle click button, closes the tab
   * @param {event} event - mouse down event
   */
  function onMouseDown(event) {
    event.stopImmediatePropagation();

    const isMiddleButtonDown = event.button === 1;

    if (isMiddleButtonDown) {
      const { tabId } = getTabData(event);
      if (!tabId) {
        return;
      }

      removeTabFromList(tabId);
      closeTab(tabId);
    }
  }

  /**
   * handle clicking on a tab row
   * @param {event} event - onClick event
   */
  function onTabListClick(event) {
    const { tabId, windowId } = getTabData(event);
    const tagName = event.target.tagName.toLowerCase();
    const type = event.target.dataset.type;

    if (type === 'speaker') {
      toggleMute(tabId);
      return;
    }

    // if ((tagName === 'img' || tagName === 'div') && type === 'closeButton') {
    if (type === 'closeButton') {
      removeTabFromList(tabId);
      closeTab(tabId);
    } else {
      if (!tabId) {
        return;
      }
      setActiveTab({ tabId, windowId });
    }
  }

  /**
   * handle clicking on the sound icon, toggling mute and unmute
   * @param {number} tabId from chrome's tab data object. used to get the clicked tab
   */
  function toggleMute(tabId) {
    chrome.tabs.get(tabId, tabData => {
      const muted = !tabData.mutedInfo.muted;
      chrome.tabs.update(tabId, { muted: muted });
      toggleMuteIcon(tabId, muted);
    });
  }

  /**
   * handle click on a tab name in the list
   * @param {number} tabId - from chrome's tab data object. used to get the clicked tab
   * @param {number} windowId - index of the window
   */
  function setActiveTab({ tabId, windowId }) {
    chrome.windows.update(windowId, { focused: true }, function() {
      // selectedWindowId = windowId;
    });

    chrome.tabs.update(tabId, { active: true });
  }

  function unregisterEvents() {
    document
      .querySelector('.tab-list')
      .removeEventListener('click', onTabListClick);
    document
      .querySelector('.filterBox')
      .removeEventListener('keyup', filterTabs);
    document
      .querySelector('.remove-filter')
      .removeEventListener('click', clearFilter);
    window.removeEventListener('mousemove', onMouseMove);
  }

  /**
   * handle on click on a tab to return it's id and window id (index of id)
   * @param {event} event - on click event
   */
  function getTabData(event) {
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
  }

  /**
   * handle closing the tab
   * @param {number} tabId - the tab the user clicked on closing
   */
  function closeTab(tabId) {
    chrome.tabs.remove(tabId, () => {
      if (!Array.isArray(listOfTabs)) {
        listOfTabs = [listOfTabs];
      }
  
      if (showOnlyCurrentWindow) {
          const index = listOfTabs.findIndex(tab => tab.id === tabId);
          if (index !== -1) {
            listOfTabs.splice(index, 1)
          }
      } else {
        listOfTabs.some(chromeWindow => {
          const index = chromeWindow.tabs.findIndex(tab => tab.id === tabId);
          if (index !== -1) {
            chromeWindow.tabs.splice(index, 1)
            return;
          }
        })
      }

      tabsCount = calcTabsCount({ groupOfTabs: listOfTabs });
    });

  }

  /**
   * handler for clicking the close button, remove the div from the container
   * @param {number} tabId - tab number
   */
  function removeTabFromList(tabId) {
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
  }

  /**
   * Event handler for clicking on the speaker icon
   * @param {number} tabId - chrome object tab id
   * @param {boolean} muted - is the tab muted or not
   */
  function toggleMuteIcon(tabId, muted) {
    const list = [...document.querySelectorAll('.tab-row')];
    const tab = list.find(
      tab => parseInt(tab.dataset.tabId) === parseInt(tabId)
    );

    
    const speakerSpan = tab.children[1].children[0];
    if (muted) {
      speakerSpan.classList.remove('volume-up');
      speakerSpan.classList.add('volume-mute');
    } else {
      speakerSpan.classList.remove('volume-mute');
      speakerSpan.classList.add('volume-up');
    }
  }

  /**
   * Filter the tab list when writing in the filter box
   * @param {event} event - keyboard event
   */
  function filterTabs(event) {
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
      eventCounter++;
      return;
    }

    if (eventCounter === 3) {
      eventCounter = 0;
    }

    const valueToFilterBy = event.target.value.toLowerCase();
    if (valueToFilterBy.length === 0) {
      clearFilter();
      return;
    }

    let filteredList;

    if (showOnlyCurrentWindow) {
      filteredList = listOfTabs.filter(tab => {
        return (
          tab.title.toLowerCase().indexOf(valueToFilterBy) > -1 ||
          tab.url.toLowerCase().indexOf(valueToFilterBy) > -1
        );
      });    
    } else {
      filteredList = listOfTabs.map(group => {
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

    displayFilteredList(filteredList);
    highlightedTab = -1;
    isInFilterMode = true;
    filteredResultsLength = calcTabsCount({
      groupOfTabs: filteredList
    });
  }

  function onKeyboardButtonPress(event) {
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
            highlightedTab
          ].dataset;
          const params = {
            tabId: parseInt(tabId),
            windowId: parseInt(windowId)
          };

          setActiveTab(params);
          break;
        }

        case ARROW_UP: {
          highlightPreviousTab();
          break;
        }
        case ARROW_DOWN: {
          highlightNextTab();
          break;
        }
      }
    }
  }

  function highlightNextTab() {
    if (isInFilterMode) {
      if (highlightedTab + 1 <= filteredResultsLength - 1) {
        highlightedTab++;
        setHightlitedTab({ set: true });
      }
    } else {
      if (highlightedTab + 1 < tabsCount) {
        highlightedTab++;
        setHightlitedTab({ set: true });
      }
    }
  }

  function highlightPreviousTab() {
    if (highlightedTab > 0) {
      highlightedTab--;
      setHightlitedTab({ set: true });
    }
  }

  /**
   * calculate how many open tabs are there including all open windows
   */
  function calcTabsCount({ groupOfTabs }) {
    if (showOnlyCurrentWindow) {
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
  }

  /**
   * Set background color to a tab
   * @param {boolean} set - indicates whether to highlight a tab or not
   */
  function setHightlitedTab({ set }) {
    const tabRowsList = document.querySelectorAll('.tab-row');

    tabRowsList.forEach(element => element.classList.remove('hightlighted'));

    if (set) {
      tabRowsList[highlightedTab].classList.add('hightlighted');
      tabRowsList[highlightedTab].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }

  /**
   * Display the results of the filter as a list
   * @param {array} filteredListOfTabs - list of filter tabs
   */

  function displayFilteredList(filteredListOfTabs) {
    const tabListDomElement = document.querySelector('.tab-list');
    tabListDomElement.textContent = '';
    displayList({ tabsList: filteredListOfTabs });
  }

  return {
    init
  }
})();

export default App;
