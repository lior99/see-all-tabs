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
    const { type: eventType, id }  = event.target;

    switch(eventType) {
      case 'checkbox':
      case 'radio':
        this.handleUserOptionChange();
        break;
    }

    if (event.target.id === 'closeButton') {
      this.onCloseClick();
    }
  },

  onCloseClick() {
    this.unRegisterEvents();
    window.close();
  },

  handleUserOptionChange() {
    const selectedTheme = this.getSelectedTheme();
    const onlyCurrentWindowInput = document.querySelector('#onlyCurrentWindow');

    const data = {
      onlyCurrentWindow: onlyCurrentWindowInput.checked,
      theme: {
        name: selectedTheme
      }
    }

    this.setDataOnStorage(data);
  },
  
  getSelectedTheme() {
    const radioElements = document.querySelectorAll('input[name="theme"]');
    return [...radioElements].find(element => element.checked).value;
  },

  setDataOnStorage(data) {
    chrome.storage.sync.set(data);
  },

  loadSettingsFromStorage() {
    chrome.storage.sync.get({
      onlyCurrentWindow: false,
      theme: { 
        name: 'dark',
      }
    }, (values) => {
      this.setValuesOnPage(values);
    })
  },

  setValuesOnPage(values) {
    document.querySelector('#onlyCurrentWindow').checked = values.onlyCurrentWindow;

    const themeElements = document.querySelectorAll('input[name="theme"');
    [...themeElements].forEach(element => {
      if (element.value === values.theme.name) {
        element.checked = true;
      }
    })
  }
}

/**
 *  start
 */
optionsHandler.start();