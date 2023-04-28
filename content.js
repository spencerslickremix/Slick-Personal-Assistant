chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "replaceSelectedText") {
        port.onMessage.addListener((request) => {
            if (request.action === 'replaceSelectedText') {
                const selectedText = window.getSelection();
                const activeElement = document.activeElement;

                if (activeElement.tagName.toLowerCase() === 'textarea' && selectedText.toString().length > 0) {
                    const newText = activeElement.value.substring(0, activeElement.selectionStart) + request.replacementText + activeElement.value.substring(activeElement.selectionEnd);
                    activeElement.value = newText;
                    port.postMessage({ success: true });
                } else {
                    port.postMessage({ success: false, message: 'No text is selected in a textarea.' });
                }
            }
        });
    }
});
