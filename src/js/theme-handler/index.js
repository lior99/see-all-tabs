function setTheme(selectedTheme) {
    switch (selectedTheme) {
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
        default:
            document.body.classList.add('dark-theme');
            document.body.classList.remove('black-theme');
            document.body.classList.remove('light-theme');
            break;
    }
}

export {
    setTheme
}