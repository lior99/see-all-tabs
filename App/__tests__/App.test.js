import App from '../App';

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

  it.skip('should display a list of tabs when showOnlyCurrentWindow is true', () => {

  })

  it.skip('should display a list of tabs when showOnlyCurrentWindow is false', () => {

  })
});