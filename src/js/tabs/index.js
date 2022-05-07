import { SPEAKER, GROUP_COLORS } from '../consts/index.js';

const tabsHandler = {
  renderTabsList: async function (showOnlyCurrentWindow) {
    const groups = await this.getTabsGroups();

    // if (tabGroup) {
    //   this.setGroupsIcons(tabGroup);
    // }

    const listOfTabs = await this.getTabsList(showOnlyCurrentWindow);
    this.displayList({ tabsList: listOfTabs, tabGroup: groups || [], showOnlyCurrentWindow });
  },

  /**
   * Get list of all open tabs using chrome's own getAll method
   * */
  getTabsList: function (showOnlyCurrentWindow = false) {
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
  * create a tab row as div in the UI
  * @param {object} tab - chrome's tab object
  * @param {number} currentWindowId - id of current window
  * @param {boolean} onlyTabInWindow - is there only one tab in the window, if yes than don't style it as active
  */
  buildTabRow: async function (params) {
    const { tab, currentWindowId, onlyTabInWindow, tabGroup, color } = params;
    const active = tab.active && tab.windowId === currentWindowId && !onlyTabInWindow ? 'active' : '';

    const tabRow = document.createElement('div');
    tabRow.className = `tab-row ${active}`;
    tabRow.dataset.tabId = tab.id;
    tabRow.dataset.windowId = tab.windowId;
    tabRow.dataset.type = 'tab';

    if (tab.groupId !== -1) {
      tabRow.style.borderLeft = `solid 5px ${GROUP_COLORS[color]}`;
    }

    const favIcon = this.createFavIcon({ tab });
    tabRow.appendChild(favIcon);

    const tabTitle = this.createTabTitle({ tab });
    tabRow.appendChild(tabTitle);

    const closeButtonDiv = this.createCloseButtonDiv();
    tabRow.appendChild(closeButtonDiv);

    return tabRow;
  },

  /**
  * create a div with fav icon
  * @param {object} tab - chrome's tab object
  */
  createFavIcon: function ({ tab }) {
    const favIcon = document.createElement('div');
    favIcon.className = 'favicon';

    const favIconImage = document.createElement('img');
    favIconImage.src = tab.favIconUrl;

    favIcon.appendChild(favIconImage);
    return favIcon;
  },

  /**
   * create a div containing the title of tab
   * @param {object} tab - chrome's tab object
   */
  createTabTitle: function ({ tab }) {
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
  * create div with speacker or mute icon
  * @param {object} tab object and speaker visibility
  */
  createSpeakerIcon: function (params) {
    const { tab } = params;
    const speakerSpan = document.createElement('span');

    speakerSpan.className = `speaker ${tab.audible ? tab.mutedInfo.muted ? 'volume-mute' : 'volume-up' : ''}`;
    speakerSpan.dataset.type = SPEAKER.type;

    return speakerSpan;
  },

  /**
   * create a div with close button
   */
  createCloseButtonDiv: function () {
    const closeButtonDiv = document.createElement('div');
    closeButtonDiv.className = 'close-button';
    closeButtonDiv.dataset.type = 'closeButton';

    return closeButtonDiv;
  },

  getTabsGroups: function () {
    if (chrome.tabGroups) {
      return new Promise(resolve => {
        chrome.tabGroups.query({}, function (tabGroup) {
          resolve(tabGroup);
        });
      });
    } else {
      return Promise.resolve(null);
    }
  },

  // setGroupsIcons: function (groups) {
  //   groups.forEach(group => {
  //     const div = document.createElement('div');
  //     div.className = 'tab-group';
  //     div.style.background = GROUP_COLORS[group.color];
  //     div.textContent = group.title;
  //     div.dataset.collapsed = group.collapsed;
  //     div.dataset.id = group.id;
  //     div.dataset.type = 'group';

  //     document.querySelector('#groups').appendChild(div);
  //   });
  // },

  /**
   * render the tab list object
   * @param {array} tabList - array of open tabs
   */
  displayList: async function (args) {
    const { tabsList, tabGroup, showOnlyCurrentWindow } = args;
    const tabListDomElement = document.querySelector('.tab-list');
    const currentWindowId = await this.getCurrentWindow();

    if (showOnlyCurrentWindow) {
      const domFragment = await this.displayListOfTabsInCurrentWindowOnly({ tabs: tabsList, currentWindowId, tabGroup });

      tabListDomElement.appendChild(domFragment);
    } else {
      tabsList.sort((a, b) => {
        return (a.id === currentWindowId) ? -1 : 1;
      })

      tabsList.forEach(async (chromeWindow, index) => {
        const { color, id: groupId } = tabGroup;
        const tabRowFragment = document.createDocumentFragment();
        const tabRowsList = await this.createAllTabRows({ tabList: chromeWindow.tabs, currentWindowId, color, groupId });

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
        }
      });
    }
  },

  // /**
  //  * Gets the current active window
  //  */
  getCurrentWindow: function () {
    return new Promise(resolve => {
      chrome.windows.getCurrent({}, currentWindow => {
        resolve(currentWindow.id);
      });
    });
  },

  // /**
  //  * list of tabs without a group - only tabs in current window
  //  * @param {array} tabs - all tabs in the window that invoked the extension
  //  * @param {number} currentWindowId - current window id
  //  */
  displayListOfTabsInCurrentWindowOnly: async function({ tabs, currentWindowId, tabGroup }) {
    const tabRowFragment = document.createDocumentFragment();
    let groupParams = null;

    // check if browser supports tab grouping
    // if (chrome.tabGroups) {
    //   tabs.forEach(async tab => {
    //     const groups = getGroupData({ tabGroup, groupId: tab.groupId });

    //     let groupParams = null;

    //     if (groups) {
    //       const { collapsed, color, title } = params;
    //       groupParams = { collapsed, color, title };
    //     }

    //     const tabRow = await buildTabRow({ tab, currentWindowId, onlyTabInWindow: tabs.length === 1, groupParams });

    //     tabRowFragment.appendChild(tabRow);
    //   });
    // } else {
    const tabList = await this.createAllTabRows({ tabList: tabs, currentWindowId, tabGroup });

    tabList.forEach(tab => tabRowFragment.appendChild(tab));
    // }

    return tabRowFragment;
  },

  prepareTabsAndGroupsForRendering: function(args) { 
    const { tabList, tabGroup } = args;

    const tabsInGroups = tabGroup.map(group => {
      const allTabsInGroup = tabList.filter(tab => tab.groupId === group.id);
      const { color, title, collapsed } = group;

      return {
        groupData: {
          title,
          color,
          collapsed 
        },
        tabs: [...allTabsInGroup],
        index: allTabsInGroup[0].index
      }
    })

    const tabsNotInGroups = tabList.filter(tab => tab.groupId === -1);

    const tempList = [
      ...tabsInGroups,
      ...tabsNotInGroups
    ]

    const sortedArray = tempList.sort((a, b) => {
      if (a.index < b.index) {
        return -1;
      }

      if (a.index > b.index) {
        return 1;
      }

      return 0;
    });

    return sortedArray;
  },

  createAllTabRows: async function(args) {
    const { tabList, currentWindowId, tabGroup } = args;
    const list = this.prepareTabsAndGroupsForRendering({ tabList, tabGroup });

    return new Promise(async (resolve, reject) => {
      try {
        const tabsPromises = await list.map(async tab => {
          if (tab.groupData) {
            const group = this.createGroup(tab.groupData);
            tab.tabs.forEach(async t => {
              const tabRow = await this.buildTabRow({ tab: t, currentWindowId, onlyTabInWindow: tabList.length === 1, tabGroup: [], color: tab.groupData.color })
              group.appendChild(tabRow);

            })
            return group;
          } else {
            const tabRow = await this.buildTabRow({ tab, currentWindowId, onlyTabInWindow: tabList.length === 1, tabGroup });
            return tabRow;
          }
        });

        const tabs = await Promise.all(tabsPromises);

        resolve(tabs);
      } catch (error) {
        reject(error);
      }
    })
  },

  createGroup: function(groupData) {
    const { color, title, collapsed } = groupData;
    const groupDiv = document.createElement('div');
    groupDiv.dataset.type = 'group';

    const span = document.createElement('span');
    span.innerHTML = title;
    span.className = 'group-name';
    span.style.backgroundColor = GROUP_COLORS[color];
    groupDiv.appendChild(span);

    return groupDiv;
  }
}

export default tabsHandler;
