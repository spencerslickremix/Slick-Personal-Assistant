class TokenCount {
    refreshTokenCount() {
        // Retrieve total token count from local storage
        chrome.storage.local.get("totalTokenCount", function(data) {
            let totalTokenCount = data.totalTokenCount || 0; // If there's no value in the local storage, default to 0

            // Find the HTML element where the total token count will be displayed
            const totalTokenCountElement = document.getElementById("token-count");

            // Used for testing. This will return NAN if using the clear button, be best to set an option to
            // not run it in the future.
            // console.log("Total token count loaded from local storage: " + data.totalTokenCount);

            // Update its text content
            totalTokenCountElement.textContent = `Total Tokens: ${totalTokenCount}`;
        });
    }
}
window.MyAssistant.tokenCount = new TokenCount();