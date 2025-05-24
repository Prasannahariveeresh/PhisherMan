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
    .loading-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      z-index: 100000;
      display: none;
      align-items: center;
      justify-content: center;
    }
    .loading-modal-backdrop.show {
      display: flex;
    }
    .loading-indicator {
      background: white;
      padding: 24px 32px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      gap: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 16px;
      font-weight: 500;
      color: #333;
      min-width: 280px;
    }
    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 3px solid #e3e3e3;
      border-top: 3px solid #4a90e2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

// Enhanced loading indicator element - now a modal
let loadingBackdrop = document.getElementById('my-loading-backdrop');
if (!loadingBackdrop) {
  loadingBackdrop = document.createElement('div');
  loadingBackdrop.id = 'my-loading-backdrop';
  loadingBackdrop.className = 'loading-modal-backdrop';

  const loadingModal = document.createElement('div');
  loadingModal.className = 'loading-indicator';
  loadingModal.innerHTML = `
    <div class="loading-spinner"></div>
    <span>Checking links for safety...</span>
  `;

  loadingBackdrop.appendChild(loadingModal);
  document.body.appendChild(loadingBackdrop);
}

function showLoading() {
  console.log('Showing loading modal...');
  loadingBackdrop.classList.add('show');
}

function hideLoading() {
  console.log('Hiding loading modal...');
  loadingBackdrop.classList.remove('show');
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

// Main function that runs on page load
(function () {
  const anchors = Array.from(document.querySelectorAll("a[href]"));
  const urls = anchors.map(a => a.href);

  // If no links found, don't show loader
  if (urls.length === 0) {
    console.log('No links found on page');
    return;
  }

  console.log(`Found ${urls.length} links, starting safety check...`);

  // Show loading indicator before starting fetch
  showLoading();

  // Add a minimum loading time to ensure user sees the indicator
  const minLoadingTime = 500; // 500ms minimum
  const startTime = Date.now();

  fetch('http://127.0.0.1:5000/api/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ links: urls })
  })
    .then(response => {
      console.log(`Fetch response status: ${response.status}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      console.log('Received data:', data);
      const blockedUrls = new Set(data.blocked_urls || []);
      let processedCount = 0;

      anchors.forEach(link => {
        if (blockedUrls.has(link.href)) {
          processedCount++;
          link.classList.add('danger-link');

          // Wrap link inside a span for relative positioning
          const wrapper = document.createElement('span');
          wrapper.style.position = 'relative';
          wrapper.style.display = 'inline-block';
          link.parentNode.insertBefore(wrapper, link);
          wrapper.appendChild(link);

          // Show popup on hover
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

          // Intercept clicks
          link.addEventListener('click', e => {
            e.preventDefault();
            showDangerModal(link.href);
          });
        }
      });

      console.log(`Processed ${processedCount} dangerous links out of ${urls.length} total links`);
    })
    .catch(error => {
      console.error("Fetch error:", error);
      // Update loading modal to show error state briefly
      const loadingModal = loadingBackdrop.querySelector('.loading-indicator');
      const originalText = loadingModal.querySelector('span').textContent;
      loadingModal.querySelector('span').textContent = 'Error checking link safety';
      setTimeout(() => {
        loadingModal.querySelector('span').textContent = originalText;
      }, 2000);
    })
    .finally(() => {
      // Ensure minimum loading time has passed before hiding
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      setTimeout(() => {
        hideLoading();
        console.log('Link safety check completed');
      }, remainingTime);
    });
})();