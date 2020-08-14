const optionsHandler = {
  start(){
    this.handleClick = this.handleClick.bind(this);

    const onLoad = () => {
        this.registerEvents();
        this.loadSettingsFromStorage();
    }

    window.addEventListener('DOMContentLoaded', onLoad);
  },

  registerEvents() {
    document.querySelector('body').addEventListener('click', this.handleClick);
  },

  unRegisterEvents() {
    document.querySelector('body').removeEventListener('click', this.handleClick);
  },

  handleClick(event) {
    if (event.target.type && event.target.type === 'checkbox') {
      this.onCheckboxToggle();
    } else if (event.target.id === 'closeButton') {
      this.onCloseClick();
    }
  },

  onCloseClick() {
    this.unRegisterEvents();
    window.close();
  },
  
  onCheckboxToggle() {
    const onlyCurrentWindowInput = document.querySelector('#onlyCurrentWindow');
    const darkThemeInput = document.querySelector('#darkTheme');

    const data = {
      onlyCurrentWindow: onlyCurrentWindowInput.checked,
      darkModeOn: darkThemeInput.checked
    }

    chrome.storage.sync.set(data);
  },

  loadSettingsFromStorage() {
    chrome.storage.sync.get({
      onlyCurrentWindow: false,
      darkModeOn: false
    }, (values) => {
      this.setValuesOnPage(values);
    })
  },

  setValuesOnPage(values) {
    document.querySelector('#onlyCurrentWindow').checked = values.onlyCurrentWindow;
    document.querySelector('#darkTheme').checked = values.darkModeOn;
  }
}

/**
 *  start
 */
optionsHandler.start();