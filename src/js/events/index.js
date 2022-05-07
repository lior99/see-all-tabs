function registerEvents() {
    const tabList = document.querySelector('.tab-list');
    const filterBox = document.querySelector('.filterBox');
    // const groups = document.querySelector('#groups');

    tabList.addEventListener('click', onTabListClick);
    tabList.addEventListener('mousedown', onMouseDown);
    filterBox.addEventListener('keyup', filterTabs);

    // groups.addEventListener('click', onTabGroupClick);

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

/**
* handle clicking on a tab row
* @param {event} event - onClick event
*/
async function onTabListClick(event) {
    // const { tabId, windowId } = getTabData(event);
    // const tagName = event.target.tagName.toLowerCase();
    // const type = event.target.dataset.type;

    const { target } = event;
    const { className } = target;
    let tabRow;
    const { type } = target.dataset;

    switch(className) {
        case 'tab-desc':
        case 'speaker':
            tabRow = target.parentNode.parentNode;
            break;
        case 'tab-title':
        case 'favicon':
        case 'close-button':
            tabRow = target.parentNode;
            break;
    }
     
    const { tabId, windowId } = tabRow.dataset;

    if (type === 'speaker') {
        toggleMute(tabId);
        return;
    }

    // // if ((tagName === 'img' || tagName === 'div') && type === 'closeButton') {
    if (type === 'closeButton') {
        removeTabFromList(tabId);
        closeTab(tabId);
        return;
    }

    await setActiveTab({ tabId, windowId });

    // } else {
    //     if (!tabId) {
    //         return;
    //     }
    //     setActiveTab({ tabId, windowId });
    // }
}

/**
 * handle click on a tab name in the list
 * @param {number} tabId - from chrome's tab data object. used to get the clicked tab
 * @param {number} windowId - index of the window
 */
async function setActiveTab(params) {
    const { tabId, windowId } = params;
    console.log('params', params);
    // chrome.windows.update(windowId, { focused: true }, function () {
    //     // selectedWindowId = windowId;
    // });

    await chrome.tabs.update(parseInt(tabId), { active: true });
}

/**
 * register to user events such as click, mousedown and handlign filter box and filter
 * box clearance
 *  */
function onTabGroupClick(event) {
    const { target } = event;
    if (target.dataset.type === 'group') {
        let { id: groupId } = target.dataset;

        groupId = parseInt(groupId);

        chrome.tabGroups.get(groupId, tabGroup => {
            const { collapsed } = tabGroup;

            chrome.tabGroups.update(groupId, {
                collapsed: !collapsed
            }, function (tabGroup) {
                // console.log('tabGroup', tabGroup)
            })
        });
    }
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

/**
 * Removes filter on box and calling the display list to render the list again
 */
function clearFilter() {
    document.querySelector('.filterBox').value = '';
    const tabListElement = document.querySelector('.tab-list');

    while (tabListElement.firstChild) {
        tabListElement.removeChild(tabListElement.firstChild);
    }

    displayList({ tabsList: listOfTabs });
    isInFilterMode = false;
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
* onmouse move handle for the body
*/
function onMouseMove() {
    setHightlitedTab({ set: false });
}

export {
    registerEvents,
    onTabListClick,
    onMouseDown,
    filterTabs,
    onTabGroupClick,
    clearFilter,
    onKeyboardButtonPress,
    onMouseMove
}