// Wrap the entire code block with an IIFE to avoid conflicts and isolate the scope
// This is for the custom context menu items.
(function () {
    // Declare the customContextMenu variable and assign the element reference
    const customContextMenu = document.querySelector('#custom-context-menu');

    const onClickHandler = (event) => {
        const target = event.target;

        if (target.tagName.toLowerCase() === 'li') {
            event.stopPropagation(); // Prevent event bubbling

            // Replace the "STOP:" text with the selected prompt
            const selectedPrompt = target.getAttribute("value");
            const textarea = document.getElementById('input-text');
            const stopIndex = textarea.value.indexOf('STOP:');

            if (stopIndex !== -1) {
                // Replace "STOP:" with the selected prompt
                textarea.setRangeText(selectedPrompt, stopIndex, stopIndex + 5, 'select');
            } else {
                // Insert the selected prompt after a line break
                const insertionIndex = textarea.value.length;
                // textarea.setRangeText('\n' + selectedPrompt, insertionIndex, insertionIndex, 'select');
                textarea.setRangeText( selectedPrompt, insertionIndex, insertionIndex, 'select');
            }
            document.getElementById('submit-button').click();
        }
    };

    if (customContextMenu) {
        customContextMenu.removeEventListener('click', onClickHandler);
        customContextMenu.addEventListener('click', onClickHandler);
    }
})();

function convertRepoUrlToApiUrl(repoUrl) {
    // Remove trailing slash if present
    if (repoUrl.endsWith('/')) {
        repoUrl = repoUrl.slice(0, -1);
    }

    // Extract the username and repository name from the URL
    const repoPath = new URL(repoUrl).pathname;
    const [username, repoName] = repoPath.split('/').filter(Boolean);

    // Construct and return the GitHub API URL for the README.md file
    return `https://api.github.com/repos/${username}/${repoName}/contents/README.md`;
}

function updateCustomContextMenuOptions() {
    chrome.storage.sync.get(["useGithub", "githubUrl"], async (result) => {
        const useGithub = result.useGithub || false;
        const githubUrl = result.githubUrl || "";
        let prompts = [];

        const customContextMenuList = document.querySelector("#custom-context-menu > ul");
        const customContextMenu = document.querySelector("#custom-context-menu");
        customContextMenu.style.opacity = '0'; // hide the list initially

        if (useGithub && githubUrl) {
            const apiUrl = convertRepoUrlToApiUrl(githubUrl);
            try {
                const readmeContent = await fetchReadmeFromRepo(apiUrl);
                prompts = parseReadmeContent(readmeContent);
            } catch (error) {
                console.error("Error fetching prompts from the repo:", error.message);
                prompts = await loadPromptsFromChromeStorage();
            }
        } else {
            prompts = await loadPromptsFromChromeStorage();
        }

        // Filter out empty prompts
        const promptsCheck = prompts.filter(prompt => prompt.description !== "" && prompt.value !== "");

        // Debugging alert to display the value of prompts
        // alert('Value of prompts: ' + JSON.stringify(prompts));

        // If there are no prompts, return from the function early
        if ( promptsCheck.length === 0) {
            // alert('No prompts found'); // Debugging alert
            // Do not show the conte
            customContextMenu.style.display = "none";
            return;
        }

        const savedPromptsList = document.querySelector(".saved-prompts-list");

        // Check if there's already an a element in savedPromptsList, if not create one.
        let linkElement = savedPromptsList.querySelector("a");
        if (!linkElement) {
            linkElement = document.createElement("a");
            savedPromptsList.appendChild(linkElement);
        }

        // Set properties of the link element
        linkElement.textContent = "Saved Prompts";
        linkElement.style.display = useGithub ? "block" : "none";  // display only when useGithub is true
        if (useGithub) {
            linkElement.href = githubUrl;

            const savedCustomPromptsHeader = document.getElementById("saved-custom-prompts-header");
            savedCustomPromptsHeader.style.display = "none";
        }
        else {
            const savedCustomPromptsHeader = document.getElementById("saved-custom-prompts-header");
            savedCustomPromptsHeader.style.display = "block";
        }

        linkElement.target = "_blank"; // to open in a new tab

        customContextMenuList.innerHTML = "";

        prompts.forEach((prompt, index) => {
            const listItem = document.createElement("li");
            listItem.id = `option-${index}`;
            listItem.textContent = prompt.description;
            listItem.setAttribute("value", prompt.value);
            customContextMenuList.appendChild(listItem);
        });

        setTimeout(() => {
            customContextMenu.style.opacity = '1'; // fade the menu in after a delay
        }, 200); // adjust delay as needed
    });
}

// https://docs.github.com/en/rest/guides/getting-started-with-the-rest-api?apiVersion=2022-11-28
async function fetchReadmeFromRepo(repoUrl) {
    const response = await fetch(repoUrl);
    const data = await response.json();
    // Decode the base64 encoded content
    return atob(data.content);
}

function parseReadmeContent(content) {
    const lines = content.split('\n');
    const prompts = [];
    let startParsing = false;  // flag to indicate when to start parsing

    lines.forEach(line => {
        // check if the current line starts with a dash (-)
        if (line.trim().startsWith('-')) {
            startParsing = true;  // start parsing from the current line
        }

        // if startParsing is true, parse the line
        if (startParsing) {
            const match = line.match(/^\-\s(.+):\s(.+)$/);
            if (match) {
                prompts.push({ description: match[1], value: match[2] });
            }
        }
    });

    return prompts;
}

function loadPromptsFromChromeStorage() {
    return new Promise((resolve) => {
        chrome.storage.sync.get("customContextMenuPrompts", (result) => {
            const prompts = result.customContextMenuPrompts || [];
            resolve(prompts);
        });
    });
}