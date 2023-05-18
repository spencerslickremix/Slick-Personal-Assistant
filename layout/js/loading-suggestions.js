function urlify(text) {
    let urlRegex = /(https?:\/\/[^\s]+)/g;
    let twitterHandleRegex = /(@[a-zA-Z0-9_]{1,15})/g;
    let twitterHashtagRegex = /(#[a-zA-Z0-9_]+)/g;

    text = text.replace(urlRegex, function(url) {
        return '<a href="' + url + '" target="_blank">' + url + '</a>';
    });

    text = text.replace(twitterHandleRegex, function(handle) {
        let handleWithoutAt = handle.substring(1);
        return '<a href="https://twitter.com/' + handleWithoutAt + '" target="_blank">' + handle + '</a>';
    });

    text = text.replace(twitterHashtagRegex, function(hashtag) {
        let hashtagWithoutHash = encodeURIComponent(hashtag.substring(1));
        return '<a href="https://twitter.com/hashtag/' + hashtagWithoutHash + '" target="_blank">' + hashtag + '</a>';
    });

    let codeBlockRegex = /(```[\s\S]*?```)/g;
    text = text.replace(codeBlockRegex, function(code) {
        // Convert markdown to HTML
        let html = new showdown.Converter({backslashEscapesHTMLTags: true}).makeHtml(code);

        return html;
    });

    return text;
}

function createSuggestionElement(suggestionObj) {
    const suggestion = document.createElement("div");
    suggestion.classList.add("suggestion");

    if (suggestionObj.isUserInput) {
        suggestion.classList.add("user-input");
    }

    suggestion.innerHTML = urlify(suggestionObj.text);

    // Add an event listener to the suggestion element
    suggestion.addEventListener('click', (e) => {
        replaceSelectedTextOnActiveTab(suggestionObj.text);
        showCopiedOverlay(e.target);
    });

    const shareButtons = createShareButtons([suggestionObj.text]);

    chrome.storage.sync.get('showShareButtons', (data) => {
        if (data.showShareButtons) {
            const shareButtons = createShareButtons([suggestionObj.text]);
            suggestion.appendChild(shareButtons);
        }
    });

    return suggestion;
}



function displaySuggestions(inputTextObj, suggestions) {
    const suggestionsContainer = document.getElementById("suggestions-container");

    if (inputTextObj) {
        const inputTextElement = createSuggestionElement(inputTextObj);
        suggestionsContainer.appendChild(inputTextElement);
    }

    for (const suggestionObj of suggestions) {
        const suggestionElement = createSuggestionElement(suggestionObj);
        suggestionsContainer.appendChild(suggestionElement);
    }

    // Call Prism.highlightAll() after the content has been added to the DOM
    Prism.highlightAll();

    chrome.storage.local.get(['savedSuggestions'], function(result) {
        let existingSuggestions = result.savedSuggestions;
        if (existingSuggestions === undefined) {
            existingSuggestions = [];
        }

        // Add input text to existingSuggestions
        if (inputTextObj) {
            existingSuggestions.push(inputTextObj);
        }

        // Add all new suggestions to existingSuggestions
        suggestions.forEach(suggestionObj => {
            existingSuggestions.push(suggestionObj);
        });

        // Save the updated list back to storage
        chrome.storage.local.set({ savedSuggestions: existingSuggestions }, function () {
            console.log("Suggestions saved.");
        });
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
    // this will clear the suggestions if you click the Get Suggestions button.
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
