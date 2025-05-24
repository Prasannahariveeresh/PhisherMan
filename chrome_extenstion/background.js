chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchUrls") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;

      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          files: ["content.js"]
        },
        () => {
          chrome.tabs.sendMessage(tabId, { action: "getUrls" }, (response) => {
            sendResponse(response);
          });
        }
      );
    });

    return true; // Keeps the message channel open
  }
});
