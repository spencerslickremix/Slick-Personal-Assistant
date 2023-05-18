async function fetchApiKey() {
    const { apiKey } = await chrome.storage.sync.get("apiKey");
    return apiKey;
}

// This is the proper URL to use.
// https://api.openai.com/v1/engines/text-davinci-002/completions
let conversation = [];  // Create a conversation array to store the conversation history

async function getSuggestionsFromApi(apiKey, prompt, maxTokens, n, stop, temperature, engine) {
    if (!apiKey) {
        throw new Error("API key not provided. Please enter your API key in the settings.");
    }

    const model = engine === 'gpt3' ? 'gpt-3.5-turbo' : 'gpt-4';

    const engineURL = 'https://api.openai.com/v1/chat/completions';

    conversation.push({role: "user", content: prompt});  // Add the user's message to the conversation history

    const response = await fetch(engineURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: conversation,  // Use the conversation history instead of a single prompt
            max_tokens: parseInt(maxTokens) || 250,
            n: parseInt(n) || 1,
            stop: stop || null,
            temperature: parseFloat(temperature) || 0.1
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error && errorData.error.code === "invalid_api_key") {
            throw new Error("Invalid API key provided. Please check your API key.");
        } else {
            throw new Error("Unexpected response from OpenAI API: " + JSON.stringify(errorData));
        }
    }

    const data = await response.json();
    if (data.choices) {
        conversation.push({role: "assistant", content: data.choices[0].message.content.trim()});  // Add the assistant's response to the conversation history
        return data.choices.map((choice) => choice.message.content.trim());
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
                        settings.maxTokens || 50,
                        settings.n || 1,
                        settings.stop || null,
                        settings.temperature || 0.1,
                        settings.engine || 'gpt3'
                    );
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
});