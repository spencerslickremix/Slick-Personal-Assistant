class Popup {
    constructor() {
        this.handleDOMContentLoaded();
        this.settings();
        this.documentTabLinks();
        this.registerDocumentEvents();
    }

    handleDOMContentLoaded() {

        document.addEventListener("DOMContentLoaded", () => {

            window.MyAssistant.updates.checkForUpdates();
            window.MyAssistant.tokenCount.refreshTokenCount();
            window.MyAssistant.promptsMenu.updateCustomContextMenuOptions();

            document.getElementById('shareButtonsToggle').addEventListener('change', (event) => {
                chrome.storage.sync.set({ showShareButtons: event.target.checked });
            });

            chrome.storage.sync.get('showShareButtons', (data) => {
                document.getElementById('shareButtonsToggle').checked = data.showShareButtons;
            });

            document.getElementById("useGithubToggle").addEventListener("change", function () {
                const useGithub = this.checked;
                chrome.storage.sync.set({ useGithub }, function () {
                    console.log("Use GitHub setting saved.");
                });

                // Show or hide the GitHub URL input field based on the toggle state
                // const githubUrlContainer    = document.getElementById("githubUrlContainer");
                const customPromptContainer = document.getElementById("customPromptContainer");
                if (useGithub) {
                    // githubUrlContainer.style.display = "block";
                    customPromptContainer.style.display = "none";
                } else {
                    // githubUrlContainer.style.display = "none";
                    customPromptContainer.style.display = "block";
                }
            });

            document.getElementById("githubUrl").addEventListener("input", function () {
                const githubUrl = this.value;
                chrome.storage.sync.set({ githubUrl }, function () {
                    console.log("GitHub URL saved.");
                });
            });

            // Load the saved settings when the popup is opened
            chrome.storage.sync.get(["useGithub", "githubUrl"], function (result) {
                const useGithubToggle = document.getElementById("useGithubToggle");
                const githubUrl = document.getElementById("githubUrl");
                const githubUrlContainer = document.getElementById("githubUrlContainer");
                const customPromptContainer = document.getElementById("customPromptContainer");

                useGithubToggle.checked = result.useGithub || false;
                githubUrl.value = result.githubUrl || "";

                if (useGithubToggle.checked) {
                    // githubUrlContainer.style.display = "block";
                    customPromptContainer.style.display = "none";
                } else {
                    // githubUrlContainer.style.display = "none";
                    customPromptContainer.style.display = "block";
                }
            });

            // Get the hamburger menu and settings overlay elements
            const hamburgerMenu = document.querySelector(".hamburger-menu");
            const settingsOverlay = document.querySelector(".settings-overlay");
            const settingsMenuItems = document.querySelectorAll(".settings-menu li");

            // Add event listener for the hamburger menu click
            hamburgerMenu.addEventListener("click", () => {
                if (settingsOverlay.classList.contains("visible")) {
                    settingsOverlay.classList.remove("visible");
                } else {
                    settingsOverlay.classList.add("visible");
                }
            });

            // Add event listener for the menu items click
            settingsMenuItems.forEach((menuItem) => {
                menuItem.addEventListener("click", () => {
                    settingsOverlay.classList.remove("visible");
                });
            });

            document.body.addEventListener("contextmenu", function (event) {
                if (event.target.closest('#suggestions-container') || event.target.closest('#custom-context-menu-directions')) {
                    event.preventDefault();

                    showCustomContextMenu();
                }
            });

            // Hide the custom context menu when clicking outside of it
            document.addEventListener('click', (e) => {
                const customContextMenu = document.getElementById('custom-context-menu');
                if (e.target.closest('#custom-context-menu') === null) {
                    customContextMenu.style.display = 'none';
                }
            });

            // load the custom context menu options to the menu.
            chrome.storage.sync.get("customContextMenuPrompts", (result) => {
                const prompts = result.customContextMenuPrompts || [];
                const customContextMenuList = document.querySelector("#custom-context-menu > ul");
                customContextMenuList.innerHTML = "";

                prompts.forEach((prompt, index) => {
                    const listItem = document.createElement("li");
                    listItem.id = `option-${index}`;
                    listItem.textContent = prompt.description;
                    listItem.setAttribute("value", prompt.value);
                    customContextMenuList.appendChild(listItem);
                });
            });


            window.MyAssistant.promptsMenu.promptsSettingsForm();
            window.MyAssistant.promptsMenu.promptsGetMenuPrompts();


            // Define the "adjustTextarea" function to resize the textarea
            const textarea = document.querySelector('#input-text');
            const submitBtn = document.querySelector('#submit-button');

            textarea.addEventListener('input', adjustTextarea);
            submitBtn.addEventListener('click', resetTextareaHeight);
            textarea.addEventListener('focus', adjustTextarea); // Add this line to resize the textarea on focus

            function adjustTextarea() {
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight}px`;
            }

            document.addEventListener('click', function(event) {
                if (event.target !== submitBtn && event.target !== textarea) {
                    resetTextareaHeight();
                }
            });

            function resetTextareaHeight() {
                textarea.style.height = 'auto';
            }

            // Initialize Materialize tooltips
            const tooltips = document.querySelectorAll(".tooltipped");
            M.Tooltip.init(tooltips);

            // Function to show the custom context menu
            function showCustomContextMenu() {
                const customContextMenu = document.getElementById("custom-context-menu");
                customContextMenu.style.display = "block";
                customContextMenu.style.position = "fixed";
                customContextMenu.style.opacity = '0'; // initially hide the menu

                const bodyWidth = document.body.clientWidth;
                const bodyHeight = document.body.clientHeight;
                const menuWidth = customContextMenu.offsetWidth;
                const menuHeight = customContextMenu.offsetHeight;

                // Define the vertical position from the top
                const verticalPosition = 100; // Change this value to adjust the position

                customContextMenu.style.left = `${(bodyWidth - menuWidth) / 2}px`;
                customContextMenu.style.top = `${verticalPosition}px`;

                // delay and fade in
                setTimeout(() => {
                    customContextMenu.style.opacity = '1';
                }, 100); // delay of 100ms, adjust as needed
            }

            window.MyAssistant.customColors.settingsFontSize();
            window.MyAssistant.customColors.settingsPopupSize();
            window.MyAssistant.customColors.settingsCustomColors();
            window.MyAssistant.customColors.settingsButtonColors();

            const inputText = document.getElementById("input-text");

            inputText.addEventListener("input", function () {
                chrome.storage.local.set({ savedText: this.value }, function () {

                    console.log("Text saved.");
                });
            });

            document.getElementById("engineToggle").addEventListener("change", function() {
                chrome.storage.sync.set({ engine: this.checked ? 'gpt4' : 'gpt3' }, function() {
                    console.log("Engine setting saved.");
                });
            });

            // This gets the saved text that might be in the input should the user close the popup and reopen.
            chrome.storage.local.get("savedText", function (data) {
                inputText.value = data.savedText || "";

                // Check if there are any suggestions in the suggestions-container
                const suggestionsContainer = document.getElementById("suggestions-container");
                const hasSuggestions = suggestionsContainer.childElementCount > 0;

                // Check if the input-text field is empty. This only works for text that was pasted into the textarea,
                // and the popup is closed and reponed. It does not work for pre-selected text on the page that gets added to textarea,
                // that is fixed in getSelectedTextFromActiveTab function.
                const inputTextEmpty = !inputText.value || inputText.value.trim() === "";

                if (!hasSuggestions && inputTextEmpty) {
                    showCustomContextMenu();
                } else {
                    const customContextMenu = document.getElementById("custom-context-menu");
                    customContextMenu.style.display = "none";
                }
            });

            // Add event listeners for the tablinks
            document.querySelectorAll(".settings-menu .tablinks").forEach((tab) => {
                tab.addEventListener("click", (event) => {
                    this.openTab(event.target.closest("li").getAttribute("data-tab"));
                    // Remove active class from other tablinks
                    document.querySelectorAll(".settings-menu .tablinks").forEach(t => t.classList.remove("active"));
                    event.target.closest("li").classList.add("active");
                    window.MyAssistant.customColors.addBodyClass();
                });
            });


            var inputs = document.querySelectorAll('input');

            inputs.forEach(function(input) {
                input.addEventListener('focus', function() {
                    var label = document.querySelector('label[for="' + input.id + '"]');
                    if (label) {
                        label.style.color = '#1a73e8'; // Change this to the desired color
                    }
                });

                input.addEventListener('blur', function() {
                    var label = document.querySelector('label[for="' + input.id + '"]');
                    if (label) {
                        label.style.color = ''; // Reset the color to the default
                    }
                });
            });

            // Add a cancel flag
            let cancelRequest = false;

            // Start Suggestions and adding them to storage using my sendMessageToBackground function.
            const submitButton = document.getElementById("submit-button");
            if (submitButton) {
                submitButton.addEventListener("click", async () => {
                    if (submitButton.innerText === "Submit") {
                        const inputText = document.getElementById("input-text").value;
                        if (inputText.trim() === "") {
                            window.MyAssistant.loadingSuggestions.showOverlay("Type text below...");
                            return;
                        }
                        try {
                            const inputTextObj = { text: inputText, isUserInput: true };
                            window.MyAssistant.loadingSuggestions.displaySuggestions(inputTextObj, []);

                            const loadingAnimation = window.MyAssistant.loadingSuggestions.showLoadingAnimation();
                            window.MyAssistant.loadingSuggestions.scrollToLoadingAnimation(loadingAnimation);

                            submitButton.innerText = "Cancel";
                            cancelRequest = false;
                            const engine = document.getElementById("engineToggle").checked ? 'gpt4' : 'gpt3';
                            const response = await this.sendMessageToBackground(inputText, { action: "getSuggestions", engine });

                            if (!cancelRequest) {
                                // If there is no error message, display the suggestions
                                const suggestions = response.suggestions.map(suggestion => ({ text: suggestion, isUserInput: false }));
                                window.MyAssistant.loadingSuggestions.displaySuggestions(null, suggestions);
                            }
                        } catch (error) {
                            console.error("Error:", error.message);
                            const errorMessage = { text: `Error: ${error.message}`, isUserInput: false };
                            window.MyAssistant.loadingSuggestions.displaySuggestions(null, [errorMessage]);

                        } finally {
                            window.MyAssistant.loadingSuggestions.hideLoadingAnimation();
                            submitButton.innerText = "Submit";
                            document.getElementById("input-text").value = "";
                        }
                    } else {
                        cancelRequest = true;
                        submitButton.innerText = "Cancel";
                    }
                });
            } else {
                console.error('submit-button not found');
            }


            // Clear Suggestions from container and storage
            const clearButton = document.getElementById("clear-button");
            if (clearButton) {
                clearButton.addEventListener("click", () => {
                    // Clear the suggestions
                    const suggestionsContainer = document.getElementById("suggestions-container");
                    suggestionsContainer.innerHTML = ""; // Clear the suggestions container

                    // Also clear the saved suggestions in local storage
                    chrome.storage.local.remove('savedSuggestions', function() {
                        console.log('Saved suggestions cleared.');
                    });

                    // Also clear the total token count in local storage
                    chrome.storage.local.remove('totalTokenCount', function() {
                        console.log('Total token count cleared.');
                    });

                    // Clear conversation and reset token count
                    chrome.runtime.sendMessage({ action: 'clearConversationAndTokenCount' }, function(response) {
                        console.log(response.message);
                        window.MyAssistant.tokenCount.refreshTokenCount(); // refresh the token count after it's cleared
                    });

                });
            }



            // Scroll to the bottom of the suggestionsContainer
            setTimeout(() => {
                const suggestionsContainer = document.getElementById("suggestions-container");
                suggestionsContainer.scrollTop = suggestionsContainer.scrollHeight;
            }, 0);



            // Get the active tab
            // Additional Script selected text in a tab and copy/paste it back.
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                const activeTab = tabs[0];

                // Execute the contentScript.js file in the active tab
                chrome.scripting.executeScript(
                    {
                        target: { tabId: activeTab.id },
                        files: ["layout/js/selected-text/contentScript.js"]
                    },
                    function() {
                        window.MyAssistant.selectedText.getSelectedTextFromActiveTab();
                    }
                );
            });

            // Add a message listener to handle the "textCopied" message from the content script
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.action === "textCopied") {
                    adjustTextarea(); // Adjust the textarea height when the "textCopied" message is received
                }
            });



        }); // End addEventListener("DOMContentLoaded")

    }


    async settings() {
        // Wrap the event listener assignment in a DOMContentLoaded event listener
        document.addEventListener("DOMContentLoaded", () => {
            const settingsForm = document.getElementById("settings-form");
            if (settingsForm) {
                settingsForm.addEventListener("submit", (e) => {
                    e.preventDefault();

                    // Save the settings here, for example, using the chrome.storage API
                    const apiKey = document.getElementById("api-key").value;
                    const maxTokens = document.getElementById("max-tokens").value;
                    const n = document.getElementById("n").value;
                    const stop = document.getElementById("stop").value;
                    const temperature = document.getElementById("temperature").value;

                    chrome.storage.sync.set({
                        apiKey: apiKey,
                        maxTokens: maxTokens,
                        n: n,
                        stop: stop,
                        temperature: temperature,
                    }, () => {
                        console.log('Settings saved');
                        window.MyAssistant.loadingSuggestions.showOverlay("Saving...");
                    });
                });
            } else {
                console.error('settings-form not found');
            }
        });

        // Load the settings when the popup is opened, for example, using the chrome.storage API
        chrome.storage.sync.get(['apiKey', 'maxTokens', 'n', 'stop', 'temperature', 'engine'], (result) => {
            document.getElementById("api-key").value = result.apiKey || '';
            document.getElementById("max-tokens").value = result.maxTokens || '';
            document.getElementById("n").value = result.n || '';
            document.getElementById("stop").value = result.stop || '';
            document.getElementById("temperature").value = result.temperature || '';
            document.getElementById("engineToggle").checked = result.engine === 'gpt4';

            // Add your tab selection logic here
            // Remove active class from all tab links
            const tablinks = document.querySelectorAll(".tablinks");
            tablinks.forEach((tab) => {
                tab.classList.remove("active");
            });

            if (!result.apiKey) {
                // If api-key is blank, open settings-tab
                this.openTab("settings-tab");
                document.querySelector('[data-tab="settings-tab"]').classList.add("active");
                window.MyAssistant.customColors.addBodyClass("active-missing-api-key-exception");
            } else {
                // If api-key has some value, open suggestions-tab
                this.openTab("suggestions-tab");
                document.querySelector('[data-tab="suggestions-tab"]').classList.add("active");
            }
        });
    }


    // Copy text to the clipboard
    copyToClipboard(text) {
        const el = document.createElement('textarea');
        el.value = text;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }


    openTab(tabName) {
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        if(tabName){
            document.getElementById(tabName).style.display = "block";
        }
    }


    documentTabLinks(){
        document.querySelectorAll(".tablinks").forEach((tab) => {
            tab.addEventListener("click", (event) => {
                this.openTab(event.target.getAttribute("data-tab"));
            });
        });
    }


    registerDocumentEvents() {
        window.addEventListener('DOMContentLoaded', (event) => {

            const updateNotification = document.getElementsByClassName('clickUpdateNotification');
            const customPromptsLink = document.getElementById('customPromptsLink');
            const suggestionsLink = document.getElementsByClassName('suggestionsLink');
            const settingsLink = document.getElementsByClassName('settingsLink');

            if (updateNotification && updateNotification.length > 0) {
                for (let i = 0; i < updateNotification.length; i++) {
                    updateNotification[i].addEventListener('click', () => {
                        this.openTab("changelog-tab");
                        document.querySelector('[data-tab="changelog-tab"]').classList.add("active");
                        window.MyAssistant.updates.setupNotificationClickListener();
                    });
                }
            }

            if (customPromptsLink) {
                customPromptsLink.addEventListener('click', () => {
                    this.openTab("custom-context-menu-settings-tab");
                    document.querySelector('[data-tab="custom-context-menu-settings-tab"]').classList.add("active");
                    window.MyAssistant.customColors.addBodyClass();
                });
            }

            if (suggestionsLink && suggestionsLink.length > 0) {
                for (let i = 0; i < suggestionsLink.length; i++) {
                    suggestionsLink[i].addEventListener('click', () => {
                        this.openTab("suggestions-tab");
                        document.querySelector('[data-tab="suggestions-tab"]').classList.add("active");
                        window.MyAssistant.customColors.addBodyClass();
                    });
                }
            }

            if (settingsLink && settingsLink.length > 0) {
                for (let i = 0; i < settingsLink.length; i++) {
                    settingsLink[i].addEventListener('click', () => {
                        this.openTab("settings-tab");
                        document.querySelector('[data-tab="settings-tab"]').classList.add("active");
                        window.MyAssistant.customColors.addBodyClass();
                    });
                }
            }

            const savedPromptsHeader = document.getElementById('saved-custom-prompts-header');
            const customContextMenuOption = document.querySelector('.custom-context-menu-option');

            if (savedPromptsHeader && customContextMenuOption) {
                savedPromptsHeader.addEventListener('click', () => {
                    customContextMenuOption.click();
                });
            }

        });
    }


    sendMessageToBackground(text, message, cancelSignal) {
        return new Promise((resolve, reject) => {
            const listener = function (response) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            };

            chrome.runtime.sendMessage({ ...message, text }, listener);

            if (cancelSignal) {
                cancelSignal.addEventListener('cancel', () => {
                    chrome.runtime.onMessage.removeListener(listener);
                    reject(new Error('Request canceled'));
                });
            }
        });
    }

}
window.MyAssistant.popup = new Popup();