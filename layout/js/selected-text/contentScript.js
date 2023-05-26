// This script is to allow us to get selected text on the webpage
// and then copy it to our input field for a quicker user experience.
if (!window.hasRunContentScript) {
    window.hasRunContentScript = true;

    console.log('contentScript.js is loading ok.');

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

        if (request.action === "getSelectedText") {
            const selectedText = window.getSelection().toString();

            //console.log('Runtime.onMessage get selected text' );
            //console.log( selectedText );

            chrome.runtime.sendMessage({ action: "textCopied" });

            sendResponse(selectedText);

        } else if (request.action === 'replaceSelectedText') {
            const replaced = replaceSelectedText(request.replacementText);
            sendResponse({ success: true, replaced });
        }
    });

    let isReplacing = false;

    function replaceSelectedText(replacementText) {
        if (isReplacing) {
            return false; // Prevent multiple calls during the same event
        }

        isReplacing = true;

        const activeElement = document.activeElement;
        const isContentEditable = activeElement.getAttribute("contentEditable") === "true";
        const selection = window.getSelection();
        let replaced = false;

        if (activeElement.tagName.toLowerCase() === 'textarea' || activeElement.tagName.toLowerCase() === 'input') {
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            activeElement.setRangeText(replacementText, start, end, 'select');
            activeElement.focus();
            replaced = true;
        } else if (isContentEditable) {
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                const textNode = document.createTextNode(replacementText);
                range.insertNode(textNode);

                // Move the caret to the end of the inserted text
                range.setStartAfter(textNode);
                range.setEndAfter(textNode);
                range.collapse(false);

                selection.removeAllRanges();
                selection.addRange(range);
                activeElement.focus();
                replaced = true;
            }
        } else {
            console.log('Cannot replace selected text: active element is not an input, textarea, or contentEditable element');
        }

        isReplacing = false; // Reset the flag after the function has finished
        return replaced;
    }
}
