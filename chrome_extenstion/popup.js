document.addEventListener("DOMContentLoaded", () => {
  const fetchBtn = document.getElementById("fetchBtn");
  const urlList = document.getElementById("urlList");

  fetchBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "fetchUrls" }, (response) => {
      urlList.innerHTML = "";

      if (chrome.runtime.lastError) {
        const li = document.createElement("li");
        li.textContent = "Error: " + chrome.runtime.lastError.message;
        urlList.appendChild(li);
        return;
      }

      if (response && response.urls && response.urls.length > 0) {
        response.urls.forEach(url => {
          const li = document.createElement("li");
          li.textContent = url;
          urlList.appendChild(li);
        });
      } else {
        const li = document.createElement("li");
        li.textContent = "No URLs found.";
        urlList.appendChild(li);
      }
    });
  });
});
