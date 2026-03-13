// ============================================================
// 1-800-CLOSER Audio Bridge — Content Script (meet.google.com)
// ============================================================
// Bridges messages between the 1-800-CLOSER app page and the
// Chrome extension background service worker.
// ============================================================

let isCapturing = false;

// ── Listen for messages from the 1-800-CLOSER app via window.postMessage ──
window.addEventListener('message', async (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;
  const msg = event.data;
  if (!msg || typeof msg !== 'object') return;

  // Ping/pong for extension detection
  if (msg.type === '1800CLOSER_PING') {
    window.postMessage({ type: '1800CLOSER_PONG', version: '1.0.0' }, '*');
    return;
  }

  // Start audio capture request (from rep's 1-800-CLOSER page via postMessage relay)
  if (msg.type === '1800CLOSER_START_CAPTURE') {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'START_CAPTURE',
        tabId: msg.tabId,
      });

      isCapturing = response?.success || false;

      window.postMessage({
        type: '1800CLOSER_CAPTURE_RESULT',
        success: response?.success || false,
        streamId: response?.streamId || null,
        error: response?.error || null,
      }, '*');
    } catch (err) {
      window.postMessage({
        type: '1800CLOSER_CAPTURE_RESULT',
        success: false,
        error: err.message,
      }, '*');
    }
    return;
  }

  // Stop capture
  if (msg.type === '1800CLOSER_STOP_CAPTURE') {
    try {
      await chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' });
      isCapturing = false;
      window.postMessage({ type: '1800CLOSER_CAPTURE_STOPPED' }, '*');
    } catch (err) {
      // Ignore errors on stop
    }
    return;
  }
});

// ── Listen for messages from the background script ──
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'CAPTURE_ENDED') {
    isCapturing = false;
    window.postMessage({ type: '1800CLOSER_CAPTURE_ENDED' }, '*');
  }
});

// ── Detect if a Google Meet call is active ──
function isMeetCallActive() {
  // Check for common Meet call UI indicators
  const callUI = document.querySelector('[data-meeting-title]')
    || document.querySelector('[data-call-id]')
    || document.querySelector('div[jscontroller][data-is-muted]')
    || document.querySelector('.google-material-icons');
  return !!callUI;
}

// ── Broadcast Meet status periodically ──
function broadcastMeetStatus() {
  window.postMessage({
    type: '1800CLOSER_MEET_STATUS',
    active: isMeetCallActive(),
    capturing: isCapturing,
    url: window.location.href,
  }, '*');
}

// Check Meet status every 5 seconds
setInterval(broadcastMeetStatus, 5000);

// Initial broadcast
setTimeout(broadcastMeetStatus, 2000);

// Notify that extension content script is loaded
window.postMessage({
  type: '1800CLOSER_EXTENSION_LOADED',
  version: '1.0.0',
}, '*');

console.log('[1-800-CLOSER] Audio Bridge extension loaded on Google Meet');
