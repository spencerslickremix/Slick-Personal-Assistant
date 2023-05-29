class LoadingSuggestions {
    constructor() {
        this.getSavedSuggestions();
    }
    urlify(text) {

        // Here are a few examples of the URLs that this regex would capture:
        // https://www.example.com
        // http://www.example.com
        // https://www.example.com/path/to/resource
        // https://www.example.com?query=string
        // https://www.example.com#fragment
        // https://sub-domain.example.com
        //And here are a few examples of strings that this regex would not consider to be URLs:
        // https://www.example.com.
        // https://www.example.com!
        // https://www.example.com,
        // https://www.example.com...
        // https://www..example.com
        let urlRegex = /(https?:\/\/[^\s\/)]+(\/[^\s)]*)?)/g;

        text = text.replace(urlRegex, function(url) {
            return '<a href="' + url + '" target="_blank">' + url + '</a>';
        });

        let twitterHandleRegex = /(@[a-zA-Z0-9_]{1,15})/g;
        text = text.replace(twitterHandleRegex, function(handle) {
            let handleWithoutAt = handle.substring(1);
            return '<a href="https://twitter.com/' + handleWithoutAt + '" target="_blank">' + handle + '</a>';
        });

        let twitterHashtagRegex = /(#[a-zA-Z0-9_]+)/g;
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

    createSuggestionElement(suggestionObj) {
        const suggestion = document.createElement("div");
        suggestion.classList.add("suggestion");

        if (suggestionObj.isUserInput) {
            suggestion.classList.add("user-input");
        }

        suggestion.innerHTML = this.urlify(suggestionObj.text);

        // Add an event listener to the suggestion element
        suggestion.addEventListener('click', (e) => {

            let selectedText = window.getSelection().toString();

            // If user selected some text, copy that
            if (selectedText.length > 0) {
                window.MyAssistant.selectedText.replaceSelectedTextOnActiveTab(selectedText);
            }
            // If no text is selected, copy all the text within the div
            else {
                window.MyAssistant.selectedText.replaceSelectedTextOnActiveTab(suggestionObj.text);
            }
            this.showCopiedOverlay(e.target);
        });

        const shareButtons = window.MyAssistant.share.createShareButtons([suggestionObj.text]);

        chrome.storage.sync.get('showShareButtons', (data) => {
            if (data.showShareButtons) {
                const shareButtons = window.MyAssistant.share.createShareButtons([suggestionObj.text]);
                suggestion.appendChild(shareButtons);
            }
        });

        return suggestion;
    }

    // This needs to be out of the addEventListener("DOMContentLoaded") so the
    // custom context menu will not load if there are suggestions in the local storage
    // that need to be loaded.
    // Get Saved Suggestions from local storage if there before anything else.
    getSavedSuggestions() {

        chrome.storage.local.get("savedSuggestions", (data) => {

            console.log(data);
            const suggestions = data.savedSuggestions || [];
            let totalTokenCount = 0;
            const suggestionsContainer = document.getElementById("suggestions-container");
            suggestions.forEach(suggestionObj => {
                const suggestionElement = this.createSuggestionElement(suggestionObj);
                suggestionsContainer.appendChild(suggestionElement);
                // Call Prism.highlightAll() after the content has been added to the DOM
                Prism.highlightAll();

                console.log("Current suggestion tokens: ", suggestionObj.tokens);

                // Add the token count of the current suggestion to the total token count
                totalTokenCount += suggestionObj.tokens;
            });
            // Now totalTokenCount contains the sum of tokens of all saved suggestions
            console.log(totalTokenCount);
            // Find the HTML element where the total token count will be displayed
            const totalTokenCountElement = document.getElementById("token-count");

            // Update its text content
            totalTokenCountElement.textContent = `Total Tokens: ${totalTokenCount}`;
        });
    }

    displaySuggestions(inputTextObj, suggestions) {
        const suggestionsContainer = document.getElementById("suggestions-container");

        let totalTokenCount = 0; // Initialize total token count

        if (inputTextObj) {
            const inputTextElement = this.createSuggestionElement(inputTextObj);
            suggestionsContainer.appendChild(inputTextElement);
            totalTokenCount += inputTextObj.tokens; // Add the token count of the inputTextObj to the total token count
        }

        for (const suggestionObj of suggestions) {
            const suggestionElement = this.createSuggestionElement(suggestionObj);
            suggestionsContainer.appendChild(suggestionElement);
            totalTokenCount += suggestionObj.tokens; // Add the token count of the suggestionObj to the total token count
        }

        // Save total token count to local storage
        chrome.storage.local.set({ totalTokenCount: totalTokenCount }, function() {

            // Testing
            // console.log("Total token count saved to local storage: " + totalTokenCount);

            window.MyAssistant.tokenCount.refreshTokenCount();  // Move the call to refreshTokenCount here

            if (chrome.runtime.lastError) {
                console.log("Runtime error: ", chrome.runtime.lastError);
            } else {
                // Testing
                // console.log("Total token count saved to local storage: " + totalTokenCount);
            }
        });

        // Call Prism.highlightAll() after the content has been added to the DOM
        Prism.highlightAll();

        chrome.storage.local.get(['savedSuggestions'], function(result) {
            let existingSuggestions = result.savedSuggestions;
            if (existingSuggestions === undefined) {
                existingSuggestions = [];
            }

            // Add input text to existingSuggestions
            if (inputTextObj) {
                inputTextObj.tokens = inputTextObj.text.split(" ").length;
                existingSuggestions.push(inputTextObj);
            }

            // Add all new suggestions to existingSuggestions
            suggestions.forEach(suggestionObj => {
                suggestionObj.tokens = suggestionObj.text.split(" ").length;
                existingSuggestions.push(suggestionObj);
            });

            // Save the updated list back to storage
            chrome.storage.local.set({ savedSuggestions: existingSuggestions }, function () {
                console.log("Suggestions saved.");
                // Update total token count
                let totalTokenCount = 0;
                existingSuggestions.forEach(suggestionObj => {
                    totalTokenCount += suggestionObj.tokens;
                });
                // Save the total token count in the local storage
                chrome.storage.local.set({ totalTokenCount: totalTokenCount }, function() {
                    // Testing
                    // console.log("Total token count saved to local storage: " + totalTokenCount);
                    window.MyAssistant.tokenCount.refreshTokenCount(); // Refresh the count after it's saved
                });
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

    showLoadingAnimation() {
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

    scrollToLoadingAnimation(loadingAnimation) {
        const container = document.getElementById("suggestions-container");
        const loadingAnimationOffset = loadingAnimation.offsetTop - 140;
        container.scrollTo({
            top: loadingAnimationOffset,
            behavior: 'smooth'
        });
    }


    hideLoadingAnimation() {
        const loadingAnimation = document.querySelector(".loading-animation");
        if (loadingAnimation) {
            document.getElementById("suggestions-container").removeChild(loadingAnimation);
        }
    }

// For Get Suggestions specifically
    showCopiedOverlay(target) {
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
    showOverlay(text) {
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
}
window.MyAssistant.loadingSuggestions = new LoadingSuggestions();