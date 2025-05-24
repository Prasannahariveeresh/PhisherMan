// Add styles only once
if (!document.getElementById('danger-link-style')) {
  const style = document.createElement('style');
  style.id = 'danger-link-style';
  style.textContent = `
    .danger-link {
      text-decoration: line-through;
      color: red !important;
      cursor: pointer;
    }
    .danger-popup {
      position: fixed;
      background: #b22222;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      pointer-events: none;
      user-select: none;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 99999;
      white-space: nowrap;
    }
    .danger-modal-backdrop {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.4);
      z-index: 99998;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .danger-modal {
      background: white;
      padding: 20px 24px;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      text-align: center;
      font-family: sans-serif;
      max-width: 400px;
    }
    .danger-modal h3 {
      margin: 0 0 10px;
      font-size: 18px;
      color: #b22222;
    }
    .danger-modal button {
      margin: 10px 6px 0;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }
    .danger-modal .cancel-btn {
      background: #ccc;
      color: #333;
    }
    .danger-modal .proceed-btn {
      background: #b22222;
      color: white;
    }
    .loading-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.5);
      z-index: 99997;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .loading-spinner {
      background: white;
      padding: 20px 30px;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      text-align: center;
      font-family: sans-serif;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

// Tooltip popup
let popup = document.querySelector('.danger-popup');
if (!popup) {
  popup = document.createElement('div');
  popup.className = 'danger-popup';
  popup.textContent = '⚠️ Possible phishing link';
  document.body.appendChild(popup);
  popup.style.opacity = '0';

  window._moveDangerPopup = (x, y) => {
    const padding = 10;
    const rect = popup.getBoundingClientRect();
    let left = x + padding;
    let top = y + padding;
    if (left + rect.width > window.innerWidth) left = x - rect.width - padding;
    if (top + rect.height > window.innerHeight) top = y - rect.height - padding;
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
  };
}

// Modal dialog
function showDangerModal(url) {
  if (document.querySelector('.danger-modal-backdrop')) return;

  const backdrop = document.createElement('div');
  backdrop.className = 'danger-modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'danger-modal';
  modal.innerHTML = `
    <h3>Warning: Unsafe Link</h3>
    <p>This link may be harmful. Do you want to proceed?</p>
    <button class="cancel-btn">Cancel</button>
    <button class="proceed-btn">Proceed</button>
  `;

  modal.querySelector('.cancel-btn').onclick = () => backdrop.remove();
  modal.querySelector('.proceed-btn').onclick = () => {
    window.open(url, '_blank');
    backdrop.remove();
  };

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

// Loading overlay functions
function showLoading() {
  if (document.querySelector('.loading-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';

  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  spinner.innerHTML = `
    <div class="spinner"></div>
    <div>Checking links for safety...</div>
  `;

  overlay.appendChild(spinner);
  document.body.appendChild(overlay);
}

function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// Main logic
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getUrls") {
    const anchors = Array.from(document.querySelectorAll("a[href]"));
    const urls = anchors.map(a => a.href);

    // Show loading before making the request
    showLoading();

    fetch('http://127.0.0.1:5000/api/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ links: urls })
    })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        // Hide loading after receiving response
        hideLoading();

        const blockedUrls = new Set(data.blocked_urls || []);

        anchors.forEach(link => {
          if (blockedUrls.has(link.href)) {
            link.classList.add('danger-link');

            // Wrap with span
            const wrapper = document.createElement('span');
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            link.parentNode.insertBefore(wrapper, link);
            wrapper.appendChild(link);

            // Hover popup
            wrapper.addEventListener('mouseenter', e => {
              popup.style.opacity = '1';
              window._moveDangerPopup(e.clientX, e.clientY);
            });
            wrapper.addEventListener('mousemove', e => {
              window._moveDangerPopup(e.clientX, e.clientY);
            });
            wrapper.addEventListener('mouseleave', () => {
              popup.style.opacity = '0';
            });

            // Custom click behavior
            link.addEventListener('click', e => {
              e.preventDefault();
              showDangerModal(link.href);
            });
          }
        });

        sendResponse({ status: 'done', blocked: Array.from(blockedUrls) });
      })
      .catch(error => {
        // Hide loading on error as well
        hideLoading();
        console.error("Fetch error:", error);
        sendResponse({ status: 'error', error: error.message });
      });

    return true; // Keep the message channel open
  }
});