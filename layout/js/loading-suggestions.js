function createSuggestionElement(text) {
    const suggestion = document.createElement("div");
    suggestion.classList.add("suggestion");
    suggestion.textContent = text;

    // Add an event listener to the suggestion element
    suggestion.addEventListener('click', (e) => {

        replaceSelectedTextOnActiveTab(text);
        // need to make option to copy to clip board if the option is not a input textarea of contenteditable div.
        // copyToClipboard(text);
        showCopiedOverlay(e.target);
    });

    const shareButtons = createShareButtons([text]); // Wrap the text in an array
    suggestion.appendChild(shareButtons);

    return suggestion;
}

function displaySuggestions(suggestions) {
    const suggestionsContainer = document.getElementById("suggestions-container");
    // suggestionsContainer.innerHTML = "";

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
    // suggestionsContainer.innerHTML = ""; // Clear the suggestions container

    const loadingAnimation = document.createElement("div");
    loadingAnimation.classList.add("loading-animation");

    for (let i = 0; i < 3; i++) {
        const dot = document.createElement("div");
        dot.classList.add("dot");
        loadingAnimation.appendChild(dot);
    }

    suggestionsContainer.appendChild(loadingAnimation);
    return loadingAnimation; // Add this line
}

function scrollToLoadingAnimation(loadingAnimation) {
    const container = document.getElementById("suggestions-container");
    const loadingAnimationOffset = loadingAnimation.offsetTop - 140;
    container.scrollTo({
        top: loadingAnimationOffset,
        behavior: 'smooth'
    });
}


function hideLoadingAnimation() {
    const loadingAnimation = document.querySelector(".loading-animation");
    if (loadingAnimation) {
        document.getElementById("suggestions-container").removeChild(loadingAnimation);
    }
}

// For Get Suggestions specifically
function showCopiedOverlay(target) {
    const overlay = document.createElement('div');
    overlay.classList.add('copied-overlay');
    overlay.textContent = 'Copied';

    // Set position and size of the overlay
    const suggestionRect = target.getBoundingClientRect();

    overlay.style.position = 'fixed';
    overlay.style.top = suggestionRect.top + 'px';
    overlay.style.left = suggestionRect.left + 'px';
    overlay.style.width = suggestionRect.width + 'px';
    overlay.style.height = suggestionRect.height + 'px';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';

    document.body.appendChild(overlay);
    setTimeout(() => {
        document.body.removeChild(overlay);
    }, 1500);
}


// For Saving
function showOverlay(text) {
    const targetElement = document.body;
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.textContent = text;

    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.backgroundColor = "rgba(0, 0, 0, .8)";
    overlay.style.color = "white";
    overlay.style.zIndex = "10";

    targetElement.appendChild(overlay);

    setTimeout(() => {
        document.body.removeChild(overlay);
    }, 1500);

   // return overlay;
}
