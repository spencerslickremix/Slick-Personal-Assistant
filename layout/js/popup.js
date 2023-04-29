document.addEventListener("DOMContentLoaded", function () {

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

    // Initialize Materialize tooltips
    const tooltips = document.querySelectorAll(".tooltipped");
    M.Tooltip.init(tooltips);

    // Add the event listener for the dark mode toggle switch
    document.getElementById("darkModeToggle").addEventListener("change", function() {
        document.body.classList.toggle("dark-mode", this.checked);
    });


    const inputText = document.getElementById("input-text");

    inputText.addEventListener("input", function () {
        chrome.storage.local.set({ savedText: this.value }, function () {
            console.log("Text saved.");
        });
    });

    document.getElementById("engineToggle").addEventListener("change", function() {
        chrome.storage.sync.set({ engine: this.checked ? 'gpt3' : 'gpt4' }, function() {
            console.log("Engine setting saved.");
        });
    });

    chrome.storage.local.get("savedText", function (data) {
        inputText.value = data.savedText || "";
    });

    // Add event listeners for the tablinks
    document.querySelectorAll(".tablinks").forEach((tab) => {
        tab.addEventListener("click", function (event) {
            openTab(event.target.getAttribute("data-tab"));
            // Remove active class from other tablinks
            document.querySelectorAll(".tablinks").forEach(t => t.classList.remove("active"));
            event.target.classList.add("active");
        });
    });

    // Open the Suggestions tab by default
    openTab("suggestions-tab");
    document.querySelector('[data-tab="suggestions-tab"]').classList.add("active");

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

    const submitButton = document.getElementById("submit-button");
    if (submitButton) {
        submitButton.addEventListener("click", async () => {
            if (submitButton.innerText === "Get Suggestions") {

                const inputText = document.getElementById("input-text").value;
                if (inputText.trim() === "") {
                    displaySuggestions(["Add some text above to get a response."]);
                    return;
                }

                try {
                    const inputText = document.getElementById("input-text").value;
                    showLoadingAnimation();
                    submitButton.innerText = "Cancel";
                    cancelRequest = false;
                    const engine = document.getElementById("engineToggle").checked ? 'gpt3' : 'gpt4';
                    const response = await sendMessageToBackground(inputText, { action: "getSuggestions", engine });
                    if (!cancelRequest) {
                        const suggestions = response.suggestions || [];
                        displaySuggestions(suggestions);
                    }
                } catch (error) {
                        console.error("Error:", error.message);
                        displaySuggestions([`Error: ${error.message}`]);
                } finally {
                    hideLoadingAnimation();
                    submitButton.innerText = "Get Suggestions";
                }
            } else {
                cancelRequest = true;
                submitButton.innerText = "Cancel";
            }
        });
    } else {
        console.error('submit-button not found');
    }



    const clearButton = document.getElementById("clear-button");
    if (clearButton) {
        clearButton.addEventListener("click", () => {
            // Clear the suggestions
            displaySuggestions([]);

            // Clear the input field
            const inputText = document.getElementById("input-text");
            inputText.value = "";

            // Clear the savedText in chrome.storage.local
            chrome.storage.local.set({ savedText: "" }, function () {
                console.log("Text cleared.");
            });
        });
    } else {
        console.error('clear-button not found');
    }
});

(async () => {
    // Wrap the event listener assignment in a DOMContentLoaded event listener
    document.addEventListener("DOMContentLoaded", () => {
        const settingsForm = document.getElementById("settings-form");
        if (settingsForm) {
            settingsForm.addEventListener("submit", (e) => {
                e.preventDefault();

                // Show the "Saving" overlay
                const savingOverlay = showSavingOverlay();

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

                    // Remove the "Saving" overlay after a short delay
                    setTimeout(() => {
                        savingOverlay.remove();
                    }, 1000);
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
        document.getElementById("darkModeToggle").checked = result.darkMode || false;
        document.body.classList.toggle("dark-mode", result.darkMode);
        document.getElementById("engineToggle").checked = result.engine === 'gpt3';
    });
})();

chrome.storage.local.get("savedSuggestions", function (data) {
    const suggestions = data.savedSuggestions || [];
    displaySuggestions(suggestions);
});


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

function showCopiedOverlay(target) {
    const overlay = document.createElement('div');
    overlay.classList.add('copied-overlay');
    overlay.textContent = 'Copied';

    // Set position and size of the overlay
    const suggestionRect = target.getBoundingClientRect();

    const containerRect = target.parentElement.getBoundingClientRect();

    overlay.style.position = 'absolute';
    overlay.style.top = (suggestionRect.top - containerRect.top) + 'px';
    overlay.style.left = (suggestionRect.left - containerRect.left) + 'px';
    overlay.style.width = suggestionRect.width + 'px';
    overlay.style.height = suggestionRect.height + 'px';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';

    document.getElementById("suggestions-container").appendChild(overlay);
    setTimeout(() => {
        document.getElementById("suggestions-container").removeChild(overlay);
    }, 1500);
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
    document.getElementById(tabName).style.display = "block";
}

document.querySelectorAll(".tablinks").forEach((tab) => {
    tab.addEventListener("click", function (event) {
        openTab(event.target.getAttribute("data-tab"));
    });
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
            } else {
                // Perform the desired action when there is no selected text, such as displaying a message
                console.log("No selected text on the page.");
            }
        });
    });
}
