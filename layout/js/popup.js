// Wrap the entire code block with an IIFE to avoid conflicts and isolate the scope
// This is for the custom context menu items.
(function () {
    // Declare the customContextMenu variable and assign the element reference
    const customContextMenu = document.querySelector('#custom-context-menu');

    const onClickHandler = (event) => {
        const target = event.target;

        if (target.tagName.toLowerCase() === 'li') {
            event.stopPropagation(); // Prevent event bubbling

            // Replace the "STOP:" text with the selected prompt
            const selectedPrompt = target.getAttribute("value");
            const textarea = document.getElementById('input-text');
            const stopIndex = textarea.value.indexOf('STOP:');

            if (stopIndex !== -1) {
                // Replace "STOP:" with the selected prompt
                textarea.setRangeText(selectedPrompt, stopIndex, stopIndex + 5, 'select');
            } else {
                // Insert the selected prompt after a line break
                const insertionIndex = textarea.value.length;
                // textarea.setRangeText('\n' + selectedPrompt, insertionIndex, insertionIndex, 'select');
                textarea.setRangeText( selectedPrompt, insertionIndex, insertionIndex, 'select');
            }
            document.getElementById('submit-button').click();
        }
    };

    if (customContextMenu) {
        customContextMenu.removeEventListener('click', onClickHandler);
        customContextMenu.addEventListener('click', onClickHandler);
    }
})();

function convertRepoUrlToApiUrl(repoUrl) {
    // Remove trailing slash if present
    if (repoUrl.endsWith('/')) {
        repoUrl = repoUrl.slice(0, -1);
    }

    // Extract the username and repository name from the URL
    const repoPath = new URL(repoUrl).pathname;
    const [username, repoName] = repoPath.split('/').filter(Boolean);

    // Construct and return the GitHub API URL for the README.md file
    return `https://api.github.com/repos/${username}/${repoName}/contents/README.md`;
}

function updateCustomContextMenuOptions() {
    chrome.storage.sync.get(["useGithub", "githubUrl"], async (result) => {
        const useGithub = result.useGithub || false;
        const githubUrl = result.githubUrl || "";
        let prompts = [];

        const customContextMenuList = document.querySelector("#custom-context-menu > ul");
        const customContextMenu = document.querySelector("#custom-context-menu");
        customContextMenu.style.opacity = '0'; // hide the list initially

        if (useGithub && githubUrl) {
            const apiUrl = convertRepoUrlToApiUrl(githubUrl);
            try {
                const readmeContent = await fetchReadmeFromRepo(apiUrl);
                prompts = parseReadmeContent(readmeContent);
            } catch (error) {
                console.error("Error fetching prompts from the repo:", error.message);
                prompts = await loadPromptsFromChromeStorage();
            }
        } else {
            prompts = await loadPromptsFromChromeStorage();
        }

        // Filter out empty prompts
        const promptsCheck = prompts.filter(prompt => prompt.description !== "" && prompt.value !== "");

        // Debugging alert to display the value of prompts
        // alert('Value of prompts: ' + JSON.stringify(prompts));

        // If there are no prompts, return from the function early
        if ( promptsCheck.length === 0) {
            // alert('No prompts found'); // Debugging alert
            // Do not show the conte
            customContextMenu.style.display = "none";
            return;
        }

        const savedPromptsList = document.querySelector(".saved-prompts-list");

        // Check if there's already an a element in savedPromptsList, if not create one.
        let linkElement = savedPromptsList.querySelector("a");
        if (!linkElement) {
            linkElement = document.createElement("a");
            savedPromptsList.appendChild(linkElement);
        }

        // Set properties of the link element
        linkElement.textContent = "Saved GitHub Prompts";
        linkElement.style.display = useGithub ? "block" : "none";  // display only when useGithub is true
        if (useGithub) {
            linkElement.href = githubUrl;

            const savedCustomPromptsHeader = document.getElementById("saved-custom-prompts-header");
            savedCustomPromptsHeader.style.display = "none";
        }
        else {
            const savedCustomPromptsHeader = document.getElementById("saved-custom-prompts-header");
            savedCustomPromptsHeader.style.display = "block";
        }

        linkElement.target = "_blank"; // to open in a new tab

        customContextMenuList.innerHTML = "";

        prompts.forEach((prompt, index) => {
            const listItem = document.createElement("li");
            listItem.id = `option-${index}`;
            listItem.textContent = prompt.description;
            listItem.setAttribute("value", prompt.value);
            customContextMenuList.appendChild(listItem);
        });

        setTimeout(() => {
            customContextMenu.style.opacity = '1'; // fade the menu in after a delay
        }, 200); // adjust delay as needed
    });
}

// https://docs.github.com/en/rest/guides/getting-started-with-the-rest-api?apiVersion=2022-11-28
async function fetchReadmeFromRepo(repoUrl) {
    const response = await fetch(repoUrl);
    const data = await response.json();
    // Decode the base64 encoded content
    return atob(data.content);
}

function parseReadmeContent(content) {
    const lines = content.split('\n');
    const prompts = [];
    let startParsing = false;  // flag to indicate when to start parsing

    lines.forEach(line => {
        // check if the current line starts with a dash (-)
        if (line.trim().startsWith('-')) {
            startParsing = true;  // start parsing from the current line
        }

        // if startParsing is true, parse the line
        if (startParsing) {
            const match = line.match(/^\-\s(.+):\s(.+)$/);
            if (match) {
                prompts.push({ description: match[1], value: match[2] });
            }
        }
    });

    return prompts;
}


function loadPromptsFromChromeStorage() {
    return new Promise((resolve) => {
        chrome.storage.sync.get("customContextMenuPrompts", (result) => {
            const prompts = result.customContextMenuPrompts || [];
            resolve(prompts);
        });
    });
}

document.addEventListener("DOMContentLoaded", function () {

    updateCustomContextMenuOptions();

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
        const githubUrlContainer    = document.getElementById("githubUrlContainer");
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


    // Add this code in the DOMContentLoaded event listener in popup.js
    const customContextMenuSettingsForm = document.getElementById("custom-context-menu-settings-tab");
    if (customContextMenuSettingsForm) {
        customContextMenuSettingsForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const prompts = [];
            for (let i = 1; i <= 5; i++) {
                const promptDescriptionInput = document.getElementById(`prompt-${i}-description`);
                const promptValueInput = document.getElementById(`prompt-${i}-value`);
                if (promptDescriptionInput && promptValueInput) {
                    prompts.push({
                        description: promptDescriptionInput.value,
                        value: promptValueInput.value
                    });
                }
            }

            chrome.storage.sync.set({ customContextMenuPrompts: prompts }, () => {
                console.log("Custom context menu prompts saved.");
                showOverlay("Saving...");
                updateCustomContextMenuOptions(); // Call the function to update the custom context menu options
            });
        });
    } else {
        console.error("Custom context menu settings form not found");
    }

    // Load the custom context menu settings when the popup is opened
    chrome.storage.sync.get("customContextMenuPrompts", (result) => {
        const prompts = result.customContextMenuPrompts || [];
        for (let i = 1; i <= 5; i++) {
            const promptDescriptionInput = document.getElementById(`prompt-${i}-description`);
            const promptValueInput = document.getElementById(`prompt-${i}-value`);
            if (promptDescriptionInput && promptValueInput) {
                promptDescriptionInput.value = prompts[i - 1]?.description || "";
                promptValueInput.value = prompts[i - 1]?.value || "";
            }
        }
    });

    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const activeTab = tabs[0];

        // Execute the contentScript.js file in the active tab
        chrome.scripting.executeScript(
            {
                target: { tabId: activeTab.id },
                files: ["contentScript.js"]
            },
            function() {
                getSelectedTextFromActiveTab();
            }
        );
    });

    // Add a message listener to handle the "textCopied" message from the content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "textCopied") {
            adjustTextarea(); // Adjust the textarea height when the "textCopied" message is received
        }
    });


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

    function resetTextareaHeight() {
        textarea.style.height = 'auto';
    }

    // Initialize Materialize tooltips
    const tooltips = document.querySelectorAll(".tooltipped");
    M.Tooltip.init(tooltips);

    // Add the event listener for the dark mode toggle switch
    document.getElementById("darkModeToggle").addEventListener("change", function() {
        document.body.classList.toggle("dark-mode", this.checked);
    });

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
        tab.addEventListener("click", function (event) {
            openTab(event.target.closest("li").getAttribute("data-tab"));
            // Remove active class from other tablinks
            document.querySelectorAll(".settings-menu .tablinks").forEach(t => t.classList.remove("active"));
            event.target.closest("li").classList.add("active");
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
            if (submitButton.innerText === "Get Suggestions") {

                const inputText = document.getElementById("input-text").value;
                if (inputText.trim() === "") {
                    showOverlay("Type text below...");
                    return;
                }
                try {
                    // Display the input text as a suggestion right away
                    const inputTextObj = { text: inputText, isUserInput: true };
                    displaySuggestions(inputTextObj, []);

                    const loadingAnimation = showLoadingAnimation();
                    scrollToLoadingAnimation(loadingAnimation);

                    submitButton.innerText = "Cancel";
                    cancelRequest = false;
                    const engine = document.getElementById("engineToggle").checked ? 'gpt4' : 'gpt3';
                    const response = await sendMessageToBackground(inputText, { action: "getSuggestions", engine });
                    if (!cancelRequest) {
                        const suggestions = response.suggestions.map(suggestion => ({ text: suggestion, isUserInput: false }));
                        displaySuggestions(null, suggestions);
                    }
                } catch (error) {
                    console.error("Error:", error.message);
                    displaySuggestions(`Error: ${error.message}`, []);
                } finally {
                    hideLoadingAnimation();
                    submitButton.innerText = "Get Suggestions";
                    // Clear the input-text field
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

            // Not using but keeping because I might possible create another option to clear this field
            // or remove all together because I'm going to make the suggestions add the text entered like a real chat.
            // Clear the input field
            /*const inputText = document.getElementById("input-text");
            inputText.value = "";*/

            // Clear the savedText in chrome.storage.local
            /*chrome.storage.local.set({ savedText: "" }, function () {
                console.log("Text cleared.");
            });*/

        });


        // Scroll to the bottom of the suggestionsContainer
        setTimeout(() => {
            const suggestionsContainer = document.getElementById("suggestions-container");
            suggestionsContainer.scrollTop = suggestionsContainer.scrollHeight;
        }, 0);

    } else {
        console.error('clear-button not found');
    }

}); // End addEventListener("DOMContentLoaded")


// This needs to be out of the addEventListener("DOMContentLoaded") so the
// custom context menu will not load if there are suggestions in the local storage
// that need to be loaded.
// Get Saved Suggestions from local storage if there before anything else.
chrome.storage.local.get("savedSuggestions", function (data) {
    console.log(data);
    const suggestions = data.savedSuggestions || [];
    const suggestionsContainer = document.getElementById("suggestions-container");
    suggestions.forEach(suggestionObj => {
        const suggestionElement = createSuggestionElement(suggestionObj);
        suggestionsContainer.appendChild(suggestionElement);
        // Call Prism.highlightAll() after the content has been added to the DOM
        Prism.highlightAll();
    });

});

(async () => {
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
                const darkMode = document.getElementById("darkModeToggle").checked;

                chrome.storage.sync.set({
                    apiKey: apiKey,
                    maxTokens: maxTokens,
                    n: n,
                    stop: stop,
                    temperature: temperature,
                    darkMode: darkMode
                }, () => {
                    console.log('Settings saved');
                    showOverlay("Saving...");
                });
            });
        } else {
            console.error('settings-form not found');
        }
    });


    // Load the settings when the popup is opened, for example, using the chrome.storage API
    chrome.storage.sync.get(['apiKey', 'maxTokens', 'n', 'stop', 'temperature', 'darkMode', 'engine'], (result) => {
        document.getElementById("api-key").value = result.apiKey || '';
        document.getElementById("max-tokens").value = result.maxTokens || '';
        document.getElementById("n").value = result.n || '';
        document.getElementById("stop").value = result.stop || '';
        document.getElementById("temperature").value = result.temperature || '';

        document.getElementById("darkModeToggle").checked = result.darkMode || true;
        if (result.darkMode === false) {
            document.body.classList.remove("dark-mode");
        }
        document.getElementById("engineToggle").checked = result.engine === 'gpt4';

        // Add your tab selection logic here
        // Remove active class from all tab links
        const tablinks = document.querySelectorAll(".tablinks");
        tablinks.forEach((tab) => {
            tab.classList.remove("active");
        });

        if (!result.apiKey) {
            // If api-key is blank, open settings-tab
            openTab("settings-tab");
            document.querySelector('[data-tab="settings-tab"]').classList.add("active");
        } else {
            // If api-key has some value, open suggestions-tab
            openTab("suggestions-tab");
            document.querySelector('[data-tab="suggestions-tab"]').classList.add("active");
        }
    });

})();



// Add this function to copy text to the clipboard
function copyToClipboard(text) {
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


function openTab(tabName) {
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

document.querySelectorAll(".tablinks").forEach((tab) => {
    tab.addEventListener("click", function (event) {
        openTab(event.target.getAttribute("data-tab"));
    });
});

window.addEventListener('DOMContentLoaded', (event) => {

    const customPromptsLink = document.getElementById('customPromptsLink');
    const suggestionsLink = document.getElementById('suggestionsLink');

    if (customPromptsLink) {
        customPromptsLink.addEventListener('click', () => {
            openTab("custom-context-menu-settings-tab");
            document.querySelector('[data-tab="custom-context-menu-settings-tab"]').classList.add("active");
        });
    } else {
        console.error('customPromptsLink not found');
    }

    if (suggestionsLink) {
        suggestionsLink.addEventListener('click', () => {
            openTab("suggestions-tab");
            document.querySelector('[data-tab="suggestions-tab"]').classList.add("active");
        });
    } else {
        console.error('suggestionsLink not found');
    }

    const savedPromptsHeader = document.getElementById('saved-custom-prompts-header');
    const customContextMenuOption = document.querySelector('.custom-context-menu-option');

    if (savedPromptsHeader && customContextMenuOption) {
        savedPromptsHeader.addEventListener('click', () => {
            customContextMenuOption.click();
        });
    } else {
        console.error('Cannot find elements to add event listeners to');
    }
});


function sendMessageToBackground(text, message, cancelSignal) {
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

function getSelectedTextFromActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, { action: "getSelectedText" }, (response) => {
            if (response.trim() !== "") {
                const inputText = document.getElementById("input-text");
                inputText.value = response + '\n\n' + 'STOP: ';

                // Check if there are any suggestions in the suggestions-container
                const suggestionsContainer = document.getElementById("suggestions-container");
                const hasSuggestions = suggestionsContainer.childElementCount > 0;

                // Check if the input-text field is empty
                const inputTextEmpty = !inputText.value || inputText.value.trim() === "";

                if (!hasSuggestions && inputTextEmpty) {
                    showCustomContextMenu();
                } else {
                    const customContextMenu = document.getElementById("custom-context-menu");
                    customContextMenu.style.display = "none";
                }
            } else {
                // Perform the desired action when there is no selected text, such as displaying a message
                console.log("No selected text on the page.");
            }
        });
    });
}


function replaceSelectedTextOnActiveTab(replacementText) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, { action: 'replaceSelectedText', replacementText }, (response) => {
            if (!response.replaced) {
                copyToClipboard(replacementText);
            }
        });
    });
}