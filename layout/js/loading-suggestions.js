function createSuggestionElement(text) {
    const suggestion = document.createElement("div");
    suggestion.classList.add("suggestion");
    suggestion.textContent = text;

    // Add an event listener to the suggestion element
    suggestion.addEventListener('click', (e) => {
        copyToClipboard(text);
        showCopiedOverlay(e.target);
    });

    const shareButtons = createShareButtons([text]); // Wrap the text in an array
    suggestion.appendChild(shareButtons);

    return suggestion;
}

function displaySuggestions(suggestions) {
    const suggestionsContainer = document.getElementById("suggestions-container");
    suggestionsContainer.innerHTML = "";

    for (const suggestion of suggestions) {
        const suggestionElement = createSuggestionElement(suggestion);
        suggestionsContainer.appendChild(suggestionElement);
    }

    // Save the suggestions to local storage
    chrome.storage.local.set({ savedSuggestions: suggestions }, function () {
        console.log("Suggestions saved.");
    });

    // Show or hide the "Clear" button
    const clearButton = document.getElementById("clear-button");
    if (clearButton) {
        if (suggestions.length > 0) {
            clearButton.style.display = "inline-block";
        } else {
            clearButton.style.display = "none";
        }
    }
}


function showLoadingAnimation() {
    const suggestionsContainer = document.getElementById("suggestions-container");
    suggestionsContainer.innerHTML = ""; // Clear the suggestions container

    const loadingAnimation = document.createElement("div");
    loadingAnimation.classList.add("loading-animation");

    for (let i = 0; i < 3; i++) {
        const dot = document.createElement("div");
        dot.classList.add("dot");
        loadingAnimation.appendChild(dot);
    }

    suggestionsContainer.appendChild(loadingAnimation);
}

function hideLoadingAnimation() {
    const loadingAnimation = document.querySelector(".loading-animation");
    if (loadingAnimation) {
        document.getElementById("suggestions-container").removeChild(loadingAnimation);
    }
}

function showSavingOverlay() {
    const settingsContent = document.getElementById("settings-tab");
    const savingOverlay = document.createElement("div");
    savingOverlay.classList.add("saving-overlay");
    savingOverlay.textContent = "Saving...";

    savingOverlay.style.position = "absolute";
    savingOverlay.style.top = "0";
    savingOverlay.style.left = "0";
    savingOverlay.style.width = "100%";
    savingOverlay.style.height = "100%";
    savingOverlay.style.display = "flex";
    savingOverlay.style.justifyContent = "center";
    savingOverlay.style.alignItems = "center";
    savingOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    savingOverlay.style.color = "white";
    savingOverlay.style.zIndex = "10";

    settingsContent.appendChild(savingOverlay);

    return savingOverlay;
}