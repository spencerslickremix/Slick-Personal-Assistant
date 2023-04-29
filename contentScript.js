console.log('contentScript.js is loading ok.');
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.action === "getSelectedText") {
        const selectedText = window.getSelection().toString();

        console.log('Runtime.onMessage get selected text' );
        console.log( selectedText );

        sendResponse(selectedText);
    }
});