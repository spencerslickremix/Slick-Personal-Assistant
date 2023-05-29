class Updates {
    checkForUpdates() {
        // Fetch the last notified version and last clicked version from storage
        chrome.storage.sync.get(['lastNotifiedVersion', 'lastClickedVersion'], ({ lastNotifiedVersion, lastClickedVersion }) => {
            // Fetch the current version from the extension's manifest
            const currentVersion = chrome.runtime.getManifest().version;

            // If the current version doesn't match the last notified version or the last clicked version, show the update notification
            if (!lastNotifiedVersion || currentVersion !== lastNotifiedVersion || currentVersion !== lastClickedVersion) {
                document.getElementById('updateNotification').style.opacity = '1';
                console.log( currentVersion );
                console.log( lastClickedVersion );
            } else {
                // If the versions match, hide the update notification
                document.getElementById('updateNotification').style.opacity = '0';
                document.getElementById('updateNotification').style.pointerEvents = 'none';
            }
        });
    }

    setupNotificationClickListener() {
        // When the notification is clicked, update the last clicked version to the current version
        const currentVersion = chrome.runtime.getManifest().version;
        chrome.storage.sync.set({ lastClickedVersion: currentVersion }, () => {
            // Hide the notification
            document.getElementById('updateNotification').style.opacity = '0';
            document.getElementById('updateNotification').style.pointerEvents = 'none';

            // Request the changelog from the background script
            this.fetchChangeLog();
        });
    }



    fetchChangeLog() {
        const changelogContainer = document.getElementById("changelog-container");

        // Create and display loading animation
        const loadingAnimation = document.createElement("div");
        loadingAnimation.classList.add("loading-animation");
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement("div");
            dot.classList.add("dot");
            loadingAnimation.appendChild(dot);
        }
        changelogContainer.appendChild(loadingAnimation);

        // Request the changelog from the background script
        chrome.runtime.sendMessage({action: "fetchChangelog"}, response => {
            // Remove loading animation
            changelogContainer.removeChild(loadingAnimation);

            // Handle fetch failure
            if (response.error) {
                changelogContainer.textContent = "Failed to load the changelog. <strong class='clickUpdateNotification'>Please try again</strong>.";
                return;
            }

            // Display and fade in changelog text
            changelogContainer.textContent = response.changelog;
            changelogContainer.classList.add("changelog-fade-in");
        });
    }

}
window.MyAssistant.updates = new Updates();