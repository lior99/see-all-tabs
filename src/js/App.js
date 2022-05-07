import { setTheme } from './theme-handler/index.js';
import * as eventsHandlers from './events/index.js';
import tabsHandler from './tabs/index.js';

const App = (function () {
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

  async function init(args) {
    const { settings } = args;
    const { onlyCurrentWindow = true, theme = {} } = settings;
    const { name = 'dark' } = theme;
    const { registerEvents } = eventsHandlers;

    showOnlyCurrentWindow = onlyCurrentWindow;
    await tabsHandler.renderTabsList(showOnlyCurrentWindow);

    // listOfTabs = await tabsHandler.getTabsList(showOnlyCurrentWindow);
    
    registerEvents();
    setTheme(name);

    
    document.querySelector('.filterBox').focus();
    // tabsCount = calcTabsCount({ groupOfTabs: listOfTabs });
  }
  

 

  
  // function getGroupData({ tabGroup, groupId }) {
  //   const tabGroupItem = tabGroup.filter(group => group.id === groupId);

  //   if (tabGroupItem.length > 0) {
  //     const { collapsed, color, title } = tabGroupItem[0];
  //     return {
  //       collapsed,
  //       color,
  //       title
  //     }
  //   } else {
  //     return null;
  //   }
  // }



  // /**
  //  * Organize sets of tabs into a group by windows.
  //  * if more than one chrome window is open, hightlight it's window
  //  * name with a number like window1, window2, etc.
  //  * @param {object} chromeWindow - chrome object containing tab data
  //  * @param {object} tabRowFragment - html fragment
  //  * @param {number} windowIndex - index of the current window (window1, window2, etc.)
  //  * @param {number} windowId - id of chrome window
  //  * @param {boolean} isCurrentWindow - flag is the chrome window the active one
  //  */
  // function buildWindowsGroup({ chromeWindow, tabRowFragment, windowIndex, windowId, isCurrentWindow }) {
  //   const group = document.createElement('div');
  //   group.className = `group ${chromeWindow.incognito ? 'incognito' : ''}`;

  //   const groupTitle = document.createElement('div');

  //   const currentWindowId = windowId;

  //   if (isCurrentWindow) {
  //     groupTitle.textContent = `This Window`;
  //     groupTitle.className = 'group-title current';
  //   } else {
  //     groupTitle.textContent = `window ${windowIndex}`;
  //     groupTitle.className = 'group-title';
  //   }

  //   if (chromeWindow.incognito) {
  //     const img = document.createElement('img');
  //     img.src = INCOGNITO_IMAGE.src;
  //     img.style.width = INCOGNITO_IMAGE.width;
  //     img.className = INCOGNITO_IMAGE.className;

  //     groupTitle.appendChild(img);
  //   }

  //   group.dataset.groupId = currentWindowId;

  //   if (chromeWindow.tabs.length > 0) {
  //     group.appendChild(groupTitle);
  //   }

  //   group.appendChild(tabRowFragment);

  //   return group;
  // }



  // function createTabContainer(params) {
  //   const { color, title } = params;

  //   const tab = document.createElement('div');

  //   tab.style.background = color;
  //   tab.textContent = title;

  //   return tab;
  // }

  // /**
  //  * Create a box to display active indicator
  //  */
  // function createTabGroupPlaceHolder({ id, tabColor }) {
  //   const placeHolder = document.createElement('div');
  //   placeHolder.className = 'place-holder';
  //   placeHolder.style.background = tabColor;

  //   return placeHolder;
  // }





  // /**
  //  * handle clicking on the sound icon, toggling mute and unmute
  //  * @param {number} tabId from chrome's tab data object. used to get the clicked tab
  //  */
  // function toggleMute(tabId) {
  //   chrome.tabs.get(tabId, tabData => {
  //     const muted = !tabData.mutedInfo.muted;
  //     chrome.tabs.update(tabId, { muted: muted });
  //     toggleMuteIcon(tabId, muted);
  //   });
  // }

  

  // function unregisterEvents() {
  //   document
  //     .querySelector('.tab-list')
  //     .removeEventListener('click', onTabListClick);
  //   document
  //     .querySelector('.filterBox')
  //     .removeEventListener('keyup', filterTabs);
  //   document
  //     .querySelector('.remove-filter')
  //     .removeEventListener('click', clearFilter);
  //   window.removeEventListener('mousemove', onMouseMove);
  // }

  // /**
  //  * handle on click on a tab to return it's id and window id (index of id)
  //  * @param {event} event - on click event
  //  */
  // function getTabData(event) {
  //   let currentElement = event.target;
  //   let elementType = currentElement.tagName.toLowerCase();

  //   if (currentElement.classList.contains('tab-list')) {
  //     return {};
  //   }

  //   while (
  //     elementType !== 'div' ||
  //     (elementType === 'div' && !currentElement.classList.contains('tab-row'))
  //   ) {
  //     currentElement = currentElement.parentNode;
  //     elementType = currentElement.tagName.toLowerCase();
  //   }

  //   return {
  //     tabId: parseInt(currentElement.dataset.tabId),
  //     windowId: parseInt(currentElement.dataset.windowId)
  //   };
  // }

  // /**
  //  * handle closing the tab
  //  * @param {number} tabId - the tab the user clicked on closing
  //  */
  // function closeTab(tabId) {
  //   chrome.tabs.remove(tabId, () => {
  //     if (!Array.isArray(listOfTabs)) {
  //       listOfTabs = [listOfTabs];
  //     }

  //     if (showOnlyCurrentWindow) {
  //       const index = listOfTabs.findIndex(tab => tab.id === tabId);
  //       if (index !== -1) {
  //         listOfTabs.splice(index, 1)
  //       }
  //     } else {
  //       listOfTabs.some(chromeWindow => {
  //         const index = chromeWindow.tabs.findIndex(tab => tab.id === tabId);
  //         if (index !== -1) {
  //           chromeWindow.tabs.splice(index, 1)
  //           return;
  //         }
  //       })
  //     }

  //     tabsCount = calcTabsCount({ groupOfTabs: listOfTabs });
  //   });

  // }

  // /**
  //  * handler for clicking the close button, remove the div from the container
  //  * @param {number} tabId - tab number
  //  */
  // function removeTabFromList(tabId) {
  //   const list = [...document.querySelectorAll('.tab-row')];
  //   const tab = list.find(
  //     tab => parseInt(tab.dataset.tabId) === parseInt(tabId)
  //   );

  //   const group = tab.parentElement;

  //   if (!group) {
  //     document.querySelector('.tab-list').removeChild(tab);
  //   } else {
  //     group.removeChild(tab);
  //     const children = [...group.children];

  //     if (children.legnth > 0) {
  //       const hasTabs = children.some(htmlElement =>
  //         htmlElement.classList.contains('tab-row')
  //       );

  //       if (!hasTabs) {
  //         document.querySelector('.tab-list').removeChild(group);
  //       }
  //     }
  //   }
  // }

  // /**
  //  * Event handler for clicking on the speaker icon
  //  * @param {number} tabId - chrome object tab id
  //  * @param {boolean} muted - is the tab muted or not
  //  */
  // function toggleMuteIcon(tabId, muted) {
  //   const list = [...document.querySelectorAll('.tab-row')];
  //   const tab = list.find(
  //     tab => parseInt(tab.dataset.tabId) === parseInt(tabId)
  //   );


  //   const speakerSpan = tab.children[1].children[0];
  //   if (muted) {
  //     speakerSpan.classList.remove('volume-up');
  //     speakerSpan.classList.add('volume-mute');
  //   } else {
  //     speakerSpan.classList.remove('volume-mute');
  //     speakerSpan.classList.add('volume-up');
  //   }
  // }

  // function highlightNextTab() {
  //   if (isInFilterMode) {
  //     if (highlightedTab + 1 <= filteredResultsLength - 1) {
  //       highlightedTab++;
  //       setHightlitedTab({ set: true });
  //     }
  //   } else {
  //     if (highlightedTab + 1 < tabsCount) {
  //       highlightedTab++;
  //       setHightlitedTab({ set: true });
  //     }
  //   }
  // }

  // function highlightPreviousTab() {
  //   if (highlightedTab > 0) {
  //     highlightedTab--;
  //     setHightlitedTab({ set: true });
  //   }
  // }

  // /**
  //  * calculate how many open tabs are there including all open windows
  //  */
  // function calcTabsCount({ groupOfTabs }) {
  //   if (showOnlyCurrentWindow) {
  //     return groupOfTabs.length;
  //   }

  //   if (!Array.isArray(groupOfTabs)) {
  //     groupOfTabs = [groupOfTabs]
  //   }

  //   if (groupOfTabs.length === 1) {
  //     return groupOfTabs[0].tabs.length;
  //   }

  //   let total = 0;
  //   const totalTabsNumber = groupOfTabs.reduce((tabCount, currentValue) => {
  //     return tabCount + currentValue.tabs.length;
  //   }, total);

  //   return totalTabsNumber;
  // }

  // /**
  //  * Display the results of the filter as a list
  //  * @param {array} filteredListOfTabs - list of filter tabs
  //  */

  // function displayFilteredList(filteredListOfTabs) {
  //   const tabListDomElement = document.querySelector('.tab-list');
  //   tabListDomElement.textContent = '';
  //   displayList({ tabsList: filteredListOfTabs });
  // }

  return {
    init
  }
})();

export default App;
