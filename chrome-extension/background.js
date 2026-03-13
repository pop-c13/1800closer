// ============================================================
// 1-800-CLOSER Audio Bridge — Background Service Worker
// ============================================================

let activeStream = null;
let activeTabId = null;

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_CAPTURE') {
    handleStartCapture(message, sender)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }

  if (message.type === 'STOP_CAPTURE') {
    handleStopCapture();
    sendResponse({ success: true });
    return false;
  }

  if (message.type === 'GET_STATUS') {
    sendResponse({
      capturing: !!activeStream,
      tabId: activeTabId,
    });
    return false;
  }

  if (message.type === 'PING') {
    sendResponse({ type: 'PONG', version: '1.0.0' });
    return false;
  }
});

async function handleStartCapture(message, sender) {
  // Stop any existing capture first
  if (activeStream) {
    handleStopCapture();
  }

  const tabId = message.tabId || sender.tab?.id;

  if (!tabId) {
    throw new Error('No tab ID provided for capture');
  }

  return new Promise((resolve, reject) => {
    chrome.tabCapture.capture(
      {
        audio: true,
        video: false,
        audioConstraints: {
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: null,
          },
        },
      },
      (stream) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!stream) {
          reject(new Error('Failed to capture tab audio — no stream returned'));
          return;
        }

        activeStream = stream;
        activeTabId = tabId;

        // Listen for stream ending (e.g., tab closed)
        stream.getAudioTracks().forEach(track => {
          track.onended = () => {
            activeStream = null;
            activeTabId = null;
            // Notify content script that capture ended
            chrome.tabs.sendMessage(tabId, { type: 'CAPTURE_ENDED' }).catch(() => {});
          };
        });

        resolve({
          success: true,
          streamId: stream.id,
        });
      }
    );
  });
}

function handleStopCapture() {
  if (activeStream) {
    activeStream.getTracks().forEach(track => track.stop());
    activeStream = null;
  }
  if (activeTabId) {
    chrome.tabs.sendMessage(activeTabId, { type: 'CAPTURE_ENDED' }).catch(() => {});
    activeTabId = null;
  }
}

// Clean up on extension unload
self.addEventListener('unload', () => {
  handleStopCapture();
});
