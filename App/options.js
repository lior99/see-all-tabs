const optionsHandler = {
  start: function() {
    const onLoad = () => {
        const saveButton = document.querySelector('#saveButton');
        const closeButton = document.querySelector('#closeButton'); 
        this.registerEvents(saveButton, closeButton);

        this.loadSettingsFromStorage();
    }

    window.addEventListener('DOMContentLoaded', onLoad);
  },

  registerEvents: function (saveBtn, closeBtn) {
    saveBtn.addEventListener('click', this.onSaveClick);
    closeBtn.addEventListener('click', this.onCloseClick);
  },

  onCloseClick: () => {
    window.close();
  },
  
  onSaveClick: () => {
    const onlyCurrentWindowInput = document.querySelector('#onlyCurrentWindow');

    const data = {
      onlyCurrentWindow: onlyCurrentWindowInput.checked
    }

    chrome.storage.sync.set(data);
  },

  loadSettingsFromStorage: function() {
    chrome.storage.sync.get({
      onlyCurrentWindow: false,
      darkModeOn: false
    }, (values) => {
      this.setValuesOnPage(values);
    })
  },

  setValuesOnPage: (values) => {
    document.querySelector('#onlyCurrentWindow').checked = values.onlyCurrentWindow;
    document.querySelector('#darkTheme').checked = values.darkModeOn;
  }
}

/**
 *  start
 */
optionsHandler.start();