class Updates {
    updateExtension() {
        const version = '1.0.0'; // Your current extension version
        const repo = 'https://raw.githubusercontent.com/<username>/<repo>/main/'; // Replace <username> and <repo> with your details

        setInterval(() => {
            fetch(repo + 'manifest.json')
                .then(response => response.json())
                .then(data => {
                    if (data.version !== version) {
                        // If the versions don't match, set the badge
                        chrome.browserAction.setBadgeText({ text: '1' });
                    }
                })
                .catch(console.error);
        }, 60000); // Run every 60 seconds

        // Listener for a click on the browser action (extension icon)
        chrome.browserAction.onClicked.addListener(() => {
            fetch(repo + 'CHANGELOG.md')
                .then(response => response.text())
                .then(data => {
                    // Now we need to display this data in a modal
                    // This should be handled in a content script
                    chrome.tabs.executeScript({
                        code: `showChangelog(${JSON.stringify(data)});`
                    });
                })
                .catch(console.error);
        });

    }
}
window.MyAssistant.updates = new Updates();