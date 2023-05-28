class SelectedText {

    getSelectedTextFromActiveTab() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, { action: "getSelectedText" }, (response) => {
                // Check if response exists before trying to trim it
                if (response && response.trim() !== "") {
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
                }
            });
        });
    }

    replaceSelectedTextOnActiveTab(replacementText) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, { action: 'replaceSelectedText', replacementText }, (response) => {
                if (!response.replaced) {
                    window.MyAssistant.popup.copyToClipboard(replacementText);
                }
            });
        });
    }
}
window.MyAssistant.selectedText = new SelectedText();