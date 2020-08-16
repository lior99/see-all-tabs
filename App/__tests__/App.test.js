import App from '../App';
import { JestEnvironment } from '@jest/environment';

// beforeEach(() => {
//   const callback = (listOfWindows) => {
//     return Promise.resolve(
//       {
//         id: 1,
//         tabs: [
//           {
//             id: 104,
//             url: 'http://www.google.com',
//             title: 'Search in gogole',

//           }
//         ]
//       }
//     )
//   }


//   global.chrome = {
//     windows: {
//       getAll: jest.fn({}, listOfWindows => {
//        callback();
//       })
//     }
//   }

//   jest.setTimeout(30000);
// });


function buildTabRowMock() {
  const tabRow = document.createElement('div');
  tabRow.dataset.tabId = '8';
  tabRow.dataset.windowId = '1';

  const placeHolder = document.createElement('div');
  placeHolder.classList.add('place-holder');

  tabRow.appendChild(placeHolder);

  const favIcon = document.createElement('div');
  const img = document.createElement('img');
  img.src = "https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico?v=ec617d715196";

  favIcon.appendChild(img);

  tabRow.appendChild(favIcon);

  const tabTitle = document.createElement('div');
  const speakerSpan = document.createElement('span');
  speakerSpan.className = 'speaker';
  speakerSpan.dataset.type = 'speaker';
  tabTitle.append(speakerSpan);

  const tabDesc = document.createElement('span');
  tabDesc.className = 'tab-desc';
  tabDesc.textContent = 'Stack Overflow - Where Developers Learn, Share, &amp; Build Careers';
  tabTitle.appendChild(tabDesc);

  tabRow.appendChild(tabTitle);

  const closeButtonDiv = document.createElement('div');
  closeButtonDiv.className = 'close-button';
  closeButtonDiv.dataset.type = 'closeButton';
  tabRow.appendChild(closeButtonDiv);

  return tabRow;
}



describe('checking extension functionallity', () => {
  it('should get a list of tabs from all windows', async ()=> {
    global.chrome = {
      windows: {
        getAll: function(obj, callBack) {
          callBack([
            { id: 1, title: 'Google', url: 'https://www.google.com' },
            { id: 2, title: 'stackoverflow', url: 'http://stackoverflow.com/' },
          ]);
        }
      }
    }

    try {
      const tabs = await App.getTabsList();
      expect(tabs.length).toEqual(2);

    } catch(err) {
      console.log('got error ', err);
    }
  });

  it('should get a list of tabs from current window only', async ()=> {
    global.chrome = {
      windows: {
        getCurrent: function(obj, callback) {
          callback(104); //104 as the window id
        }
      },
      tabs: {
        getAllInWindow: function(id, callback) {
          callback([
            { id: 1, title: 'Google', url: 'https://www.google.com' },
            { id: 2, title: 'stackoverflow', url: 'http://stackoverflow.com/' },
          ]);
        }
      }
    }

    try {
      const tabs = await App.getTabsList(true);
      expect(tabs.length).toEqual(2);

    } catch(err) {
      console.log('got an error', err);
      throw err;
    }
  });

  it('should display a list of tabs when showOnlyCurrentWindow is true', async () => {
    // mock results
    const mockTablist = [
      { id: 1, title: 'Stack Overflow - Where Developers Learn, Share, & Build Careers', url: 'https://stackoverflow.com/' },
      // { id: 2, title: 'Github', url: 'http://www.github.com' }
    ]

    //mock chrome
    global.chrome = {
      windows: {
        getCurrent: function(obj, callback) {
          callback(100);
        }
      }
    }

    // mocking App
    App.showOnlyCurrentWindow = true;
    App.displayListOfTabsInCurrentWindowOnly = jest.fn(() => {
      const fragment = document.createDocumentFragment();

      const mockTabRow = buildTabRowMock();

      fragment.appendChild(mockTabRow);
      return fragment;
    });

    document.body.innerHTML = '<div class="tab-list"></div>';

    await App.displayList({ tabsList: mockTablist });
    const tabListDomElement = document.querySelector('.tab-list');

    expect(App.displayListOfTabsInCurrentWindowOnly).toBeCalled();
    expect(tabListDomElement.textContent).toEqual('Stack Overflow - Where Developers Learn, Share, &amp; Build Careers')
  })

  it.skip('should display a list of tabs when showOnlyCurrentWindow is false', async () => {

  })
});