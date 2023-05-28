// Define your token count at the top of the script
let tokenCount = 0;

// 4/25/23: Need to revisit this and dig deeper into seeing
// if we are actually removing suggestion to be able to keep the conversation going.
// at some point the conversation cannot continue if it exceeds 4097 tokens.
// seems like I need to make an option to save the conversation and or something...
// Define the token counting function
function countTokens(text) {
    let wordCount = text.split(' ').length;
    let punctuationCount = (text.match(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g) || []).length;
    return wordCount + punctuationCount;
}

async function fetchApiKey() {
    const { apiKey } = await chrome.storage.sync.get("apiKey");
    return apiKey;
}

// Initialize the conversation in storage
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ conversation: [] });
});

// Update the conversation in the storage whenever it changes
function updateConversation(convo) {
    chrome.storage.sync.set({ conversation: convo });
}

let conversation = [];
chrome.storage.sync.get("conversation", function(data) {
    if (data.conversation !== undefined) {
        conversation = data.conversation;
        tokenCount = conversation.reduce((sum, message) => sum + message.tokens, 0);
    }
});

async function getSuggestionsFromApi(apiKey, prompt, maxTokens, n, stop, temperature, engine) {

    if (!apiKey) {
        throw new Error("API key not provided. To get started please click on the Menu option in the top right corner, click on Settings and then enter your API key.");
    }
    // gpt-3.5-turbo
    const model = engine === 'gpt3' ? 'gpt-3.5-turbo' : 'gpt-4';

    const engineURL = 'https://api.openai.com/v1/chat/completions';

    let promptTokens = countTokens(prompt);
    conversation.push({role: "user", content: prompt, tokens: promptTokens});
    tokenCount += promptTokens;

    while (tokenCount > 4096 && conversation.length > 0) {
        let removedMessage = conversation.shift();
        tokenCount -= removedMessage.tokens;  // Subtract the tokens of the removed message
    }

    if (promptTokens > 4096) {
        throw new Error("Your message is too long! Please limit messages to 4096 tokens.");
    }

    // copy the conversation array and remove tokens property
    const conversationCopy = conversation.map(({ role, content }) => ({ role, content }));

    const response = await fetch(engineURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: conversationCopy,
            max_tokens: parseInt(maxTokens) || 2000,
            n: parseInt(n) || 1,
            stop: stop || null,
            temperature: parseFloat(temperature) || 0.1
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error && errorData.error.code === "invalid_api_key") {
            throw new Error("Invalid API key provided. Please check your API key.");
        }
        else if (errorData.error && errorData.error.message === "The model: `gpt-4` does not exist") {
            //console.log( errorData.error );
            throw new Error("Please choose the GPT-3 Option from the <span class='settingsLink'>Settings</span> page to continue. The OpenAI API Key you entered does not have GPT-4 access yet. <br/><br/>You must have explicitly been granted a GPT-4 API Key from OpenAI for the GPT-4 option to work on our Settings page. You can apply for access here https://openai.com/waitlist/gpt-4-api");
        }
        else{
            throw new Error("Unexpected response from OpenAI API: " + JSON.stringify(errorData));
        }
    }

    const data = await response.json();
    if (data.choices) {
        let suggestionResponses = data.choices.map((choice) => {
            let messageContent = choice.message.content.trim();
            let tokens = countTokens(messageContent);
            conversation.push({role: "assistant", content: messageContent, tokens: tokens});

            // Notify loading-suggestions.js that a new suggestion has been added
            chrome.runtime.sendMessage({ action: "newSuggestionAdded", tokens: tokens });

            return messageContent;
        });
        return suggestionResponses;
    } else {
        console.error("Unexpected response from OpenAI API:", JSON.stringify(data, null, 2));
        return [];
    }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "getSuggestions") {
        if (request.text) {
            fetchApiKey().then(async function (apiKey) {
                const settings = await chrome.storage.sync.get(["prompt", "maxTokens", "n", "stop", "temperature", "engine"]);
                try {
                    const suggestions = await getSuggestionsFromApi(
                        apiKey,
                        request.text,
                        settings.maxTokens || 2000,
                        settings.n || 1,
                        settings.stop || null,
                        settings.temperature || 0.1,
                        settings.engine || 'gpt3'
                    );
                    tokenCount += suggestions.reduce((sum, suggestion) => sum + countTokens(suggestion), 0);
                    sendResponse({ suggestions: suggestions });
                } catch (error) {
                    console.error('Error:', error);
                    sendResponse({ error: error.message });
                }
            }).catch(function (error) {
                console.error("Error fetching API key or settings:", error);
            });
            return true; // Required for async sendResponse
        } else {
            console.error("No text provided.");
        }
    }

    if (request.action === "clearConversationAndTokenCount") {
        conversation = [];  // Clear the conversation array
        tokenCount = 0;     // Clear the token count
        updateConversation(conversation);  // Save the cleared conversation
        sendResponse({ message: "Conversation and token count cleared." });
        return true;
    }

});