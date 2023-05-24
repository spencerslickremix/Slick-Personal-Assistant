// Update the token count in the storage whenever it changes
// Define a function to refresh the token count display
function refreshTokenCount() {
    chrome.runtime.sendMessage({action: 'getTokenCount'}, function(response) {
        document.getElementById("token-count").innerText = "Token count: " + response.tokenCount;
    });
}