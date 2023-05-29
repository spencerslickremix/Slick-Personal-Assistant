class CustomColors {
    constructor() {
        // Initialize the darker(black) theme and button color
        this.currentTheme = "darker";
        this.currentButtonColor = "blue";
        this.addBodyClass();
    }
    settingsCustomColors() {
        var themeOptions = document.getElementsByClassName('theme-option');

        for (var i = 0; i < themeOptions.length; i++) {
            themeOptions[i].addEventListener('click', function() {
                // Remove active class from all theme options
                for (var j = 0; j < themeOptions.length; j++) {
                    themeOptions[j].classList.remove('active');
                }

                // Add active class to selected theme option
                this.classList.add('active');

                var theme = this.id;
                chrome.storage.sync.set({theme: theme}, function() {
                    console.log('Theme is ' + theme);
                    window.MyAssistant.customColors.applyTheme(theme);
                });
            });
        }

        var self = this;
        chrome.storage.sync.get('theme', function(data) {
            var themeOption;
            if (data.theme) {
                self.applyTheme(data.theme);
                themeOption = document.getElementById(data.theme);
            } else {
                self.applyTheme(self.currentTheme);
                themeOption = document.getElementById(self.currentTheme);
            }

            // Add active class to the selected theme option
            if (themeOption) {
                themeOption.classList.add('active');
            }
        });
    }

    applyTheme(theme) {
        var oldLink = document.getElementById('theme-style');
        var link = document.createElement('link');
        link.id = 'theme-style';
        link.rel = 'stylesheet';
        link.href = 'layout/css/custom/background/' + theme + '.css';
        if (oldLink) {
            document.head.removeChild(oldLink);
        }
        document.head.appendChild(link);

        // Remove previous theme class if exists
        let previousTheme = this.currentTheme;
        if (previousTheme) {
            document.body.classList.remove(previousTheme + "-mode");
        }

        // Apply new theme class
        document.body.classList.add(theme + "-mode");
        this.currentTheme = theme;
    }


    settingsButtonColors() {
        var buttonColorOptions = document.getElementsByClassName('button-color-option');

        for (var i = 0; i < buttonColorOptions.length; i++) {
            buttonColorOptions[i].addEventListener('click', function() {
                // Remove active class from all button color options
                for (var j = 0; j < buttonColorOptions.length; j++) {
                    buttonColorOptions[j].classList.remove('active');
                }

                // Add active class to selected button color option
                this.classList.add('active');

                var buttonColor = this.id;
                chrome.storage.sync.set({buttonColor: buttonColor}, function() {
                    console.log('Button color is ' + buttonColor);
                    window.MyAssistant.customColors.applyButtonTheme(buttonColor);
                });
            });
        }

        var self = this;
        chrome.storage.sync.get('buttonColor', function(data) {
            var buttonColorOption;
            if (data.buttonColor) {
                self.applyButtonTheme(data.buttonColor);
                buttonColorOption = document.getElementById(data.buttonColor);
            } else {
                self.applyButtonTheme(self.currentButtonColor);
                buttonColorOption = document.getElementById(self.currentButtonColor);
            }

            // Add active class to the selected button color option
            if (buttonColorOption) {
                buttonColorOption.classList.add('active');
            }
        });
    }

    applyButtonTheme(buttonColor) {
        var oldLink = document.getElementById('button-color-style');
        var link = document.createElement('link');
        link.id = 'button-color-style';
        link.rel = 'stylesheet';
        link.href = 'layout/css/custom/color/' + buttonColor + '.css';
        if (oldLink) {
            document.head.removeChild(oldLink);
        }
        document.head.appendChild(link);

        // Remove previous button color class if exists
        let previousButtonColor = this.currentButtonColor;
        if (previousButtonColor) {
            document.body.classList.remove(previousButtonColor + "-color");
        }

        // Apply new button color class
        document.body.classList.add(buttonColor + "-color");
        this.currentButtonColor = buttonColor;
    }


    settingsFontSize() {
        var fontSizeSlider = document.getElementById('font-size');
        var fontSizeSpan = document.getElementById('font-size-span');

        // Event listener for when the slider is being moved
        fontSizeSlider.addEventListener('input', function() {
            var fontSize = this.value;
            fontSizeSpan.textContent = fontSize; // Update display as slider is moved
        });

        // Event listener for when the slider is released
        fontSizeSlider.addEventListener('mouseup', function() {
            var fontSize = this.value;
            chrome.storage.sync.set({fontSize: fontSize}, function() {
                console.log('Font size is ' + fontSize);
                window.MyAssistant.customColors.applyFontSize(fontSize);
            });
        });

        chrome.storage.sync.get('fontSize', function(data) {
            if (data.fontSize) {
                window.MyAssistant.customColors.applyFontSize(data.fontSize);
                fontSizeSlider.value = data.fontSize;
                fontSizeSpan.textContent = data.fontSize; // Add size to font-size-span div when loading stored value
            }
        });
    }

    applyFontSize(fontSize) {
        document.documentElement.style.setProperty('--font-size', fontSize + "%");
    }



    settingsPopupSize() {
        var popupSizeSlider = document.getElementById('popup-size');
        var popupWidthSpan = document.getElementById('popup-width-span');

        // Event listener for when the slider is being moved
        popupSizeSlider.addEventListener('input', function() {
            var popupSize = this.value;
            popupWidthSpan.textContent = popupSize; // Update the display as the slider is being moved
        });

        // Event listener for when the slider is released
        popupSizeSlider.addEventListener('mouseup', function() {
            var popupSize = this.value;
            chrome.storage.sync.set({popupSize: popupSize}, function() {
                console.log('Popup size is ' + popupSize);
                window.MyAssistant.customColors.applyPopupSize(popupSize);
            });
        });

        chrome.storage.sync.get('popupSize', function(data) {
            if (data.popupSize) {
                window.MyAssistant.customColors.applyPopupSize(data.popupSize);
                popupSizeSlider.value = data.popupSize;
                popupWidthSpan.textContent = data.popupSize;
            }
        });
    }

    applyPopupSize(popupSize) {
        document.body.style.setProperty('width', popupSize + "px");
    }

    addBodyClass(apiKeyException){
            const activeTabLink = document.querySelector('.settings-menu-option.tablinks.active');

            if (activeTabLink || apiKeyException === "active-missing-api-key-exception") {
                let apiKeyExceptionCheck =  apiKeyException === "active-missing-api-key-exception" ? 1000 : 0;
                setTimeout(function() {
                    document.body.classList.add('settings-options');
                }, apiKeyExceptionCheck); // Time is in milliseconds, so 5000 ms equals 5 seconds


            } else {
                document.body.classList.remove('settings-options');
            }
    }

}
window.MyAssistant.customColors = new CustomColors();
