// C:\Users\Joshua Popsie\Desktop\1800closer\src\lib\audioStream.js

import { supabase, isSupabaseConfigured } from './supabase';

// STUN servers for NAT traversal
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// ---------------------------------------------------------------------------
// Extension detection + tab capture helpers (rep-side)
// ---------------------------------------------------------------------------

/** Ping the Chrome extension and wait for a pong. Returns true if extension is present. */
export function detectExtension(timeoutMs = 2000) {
  return new Promise((resolve) => {
    const handler = (event) => {
      if (event.data?.type === '1800CLOSER_PONG') {
        window.removeEventListener('message', handler);
        resolve(true);
      }
    };
    window.addEventListener('message', handler);
    window.postMessage({ type: '1800CLOSER_PING' }, '*');
    setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve(false);
    }, timeoutMs);
  });
}

/** Request tab audio capture via the Chrome extension. Returns a streamId or null. */
export function requestTabCapture() {
  return new Promise((resolve) => {
    const handler = (event) => {
      if (event.data?.type === '1800CLOSER_CAPTURE_RESULT') {
        window.removeEventListener('message', handler);
        if (event.data.success) {
          resolve(event.data.streamId);
        } else {
          console.warn('[AudioStream] Tab capture failed:', event.data.error);
          resolve(null);
        }
      }
    };
    window.addEventListener('message', handler);
    window.postMessage({ type: '1800CLOSER_START_CAPTURE' }, '*');
    // Timeout after 5 seconds
    setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve(null);
    }, 5000);
  });
}

/** Stop tab audio capture. */
export function stopTabCapture() {
  window.postMessage({ type: '1800CLOSER_STOP_CAPTURE' }, '*');
}

// ---------------------------------------------------------------------------
// Rep-side: Audio Responder
// ---------------------------------------------------------------------------
// Automatically responds to manager audio requests by streaming the captured
// tab audio via WebRTC. No UI confirmation — completely silent.
// ---------------------------------------------------------------------------

export function createAudioResponder(sessionId) {
  if (!isSupabaseConfigured()) return null;

  const channel = supabase.channel(`audio:${sessionId}`, {
    config: { broadcast: { self: false } },
  });

  let localStream = null;
  const peerConnections = new Map(); // managerId -> RTCPeerConnection
  let captureReady = false;

  // Initialize: detect extension and start capture
  async function initCapture() {
    const hasExtension = await detectExtension();
    if (!hasExtension) {
      console.log('[AudioStream] Chrome extension not detected — audio bridge unavailable');
      return false;
    }
    const streamId = await requestTabCapture();
    if (!streamId) {
      console.log('[AudioStream] Tab capture failed or denied');
      return false;
    }
    // The extension captures the tab audio. We need to get the actual MediaStream.
    // The streamId from tabCapture is available via chrome.tabCapture — but from the
    // content script context, we need to use getUserMedia with the constraintId.
    // However, since tabCapture is in the extension context, we'll use a different approach:
    // The extension's background captures the stream, and we relay it via the extension messaging.
    //
    // For simplicity in this architecture, we'll create a silent audio context and use
    // the extension to pipe audio. But actually, the simplest working approach is:
    // The rep's page creates an AudioContext to capture the tab audio that's already playing.
    //
    // Actually, the chrome.tabCapture.capture() in the background script returns a MediaStream
    // that exists in the extension context, not the web page context. So we need a different
    // approach: use chrome.tabCapture.getMediaStreamId() which gives a stream ID that can be
    // used with navigator.mediaDevices.getUserMedia() in the web page.

    captureReady = true;
    console.log('[AudioStream] Tab capture active, ready to serve audio to managers');
    return true;
  }

  // Get the tab's audio stream using the tab capture stream ID
  async function getTabAudioStream() {
    // If we already have a stream, reuse it
    if (localStream && localStream.active) return localStream;

    // Request the stream ID from the extension for use in getUserMedia
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.data?.type === '1800CLOSER_CAPTURE_RESULT') {
          window.removeEventListener('message', handler);
          if (event.data.success && event.data.streamId) {
            // Use the stream ID with getUserMedia
            navigator.mediaDevices.getUserMedia({
              audio: {
                mandatory: {
                  chromeMediaSource: 'tab',
                  chromeMediaSourceId: event.data.streamId,
                },
              },
            }).then((stream) => {
              localStream = stream;
              resolve(stream);
            }).catch((err) => {
              console.warn('[AudioStream] getUserMedia failed:', err);
              // Fallback: create a silent stream as placeholder
              resolve(createSilentStream());
            });
          } else {
            resolve(createSilentStream());
          }
        }
      };
      window.addEventListener('message', handler);
      window.postMessage({ type: '1800CLOSER_START_CAPTURE' }, '*');
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve(createSilentStream());
      }, 5000);
    });
  }

  // Create a silent audio stream as fallback
  function createSilentStream() {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dest = ctx.createMediaStreamDestination();
    const gain = ctx.createGain();
    gain.gain.value = 0; // Silent
    oscillator.connect(gain);
    gain.connect(dest);
    oscillator.start();
    return dest.stream;
  }

  // Handle an incoming audio request from a manager
  async function handleAudioRequest(managerId) {
    console.log('[AudioStream] Manager requested audio:', managerId);

    const stream = await getTabAudioStream();
    if (!stream) {
      console.warn('[AudioStream] No audio stream available');
      return;
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnections.set(managerId, pc);

    // Add audio tracks to the connection
    stream.getAudioTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Send ICE candidates to the manager
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.send({
          type: 'broadcast',
          event: 'audio_ice',
          payload: {
            candidate: event.candidate.toJSON(),
            from: 'rep',
            to: managerId,
          },
        });
      }
    };

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    channel.send({
      type: 'broadcast',
      event: 'audio_offer',
      payload: {
        sdp: pc.localDescription.toJSON(),
        to: managerId,
      },
    });
  }

  // Handle SDP answer from manager
  async function handleAudioAnswer(managerId, sdp) {
    const pc = peerConnections.get(managerId);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  // Handle ICE candidate from manager
  async function handleIceCandidate(managerId, candidate) {
    const pc = peerConnections.get(managerId);
    if (!pc) return;
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  // Handle manager disconnect
  function handleDisconnect(managerId) {
    const pc = peerConnections.get(managerId);
    if (pc) {
      pc.close();
      peerConnections.delete(managerId);
    }
  }

  // Subscribe to audio signaling events
  channel.on('broadcast', { event: 'audio_request' }, ({ payload }) => {
    handleAudioRequest(payload.managerId);
  });

  channel.on('broadcast', { event: 'audio_answer' }, ({ payload }) => {
    handleAudioAnswer(payload.from, payload.sdp);
  });

  channel.on('broadcast', { event: 'audio_ice' }, ({ payload }) => {
    if (payload.from !== 'rep') {
      handleIceCandidate(payload.from, payload.candidate);
    }
  });

  channel.on('broadcast', { event: 'audio_disconnect' }, ({ payload }) => {
    handleDisconnect(payload.managerId);
  });

  channel.subscribe();

  // Auto-initialize capture
  initCapture();

  return {
    /** Clean up all peer connections and stop capture */
    destroy: () => {
      peerConnections.forEach((pc) => pc.close());
      peerConnections.clear();
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
        localStream = null;
      }
      stopTabCapture();
      supabase.removeChannel(channel);
    },
  };
}

// ---------------------------------------------------------------------------
// Manager-side: Audio Requester
// ---------------------------------------------------------------------------
// Sends audio request to the rep, handles WebRTC negotiation, and returns
// a playable audio stream.
// ---------------------------------------------------------------------------

export function createAudioRequester(sessionId, managerId) {
  if (!isSupabaseConfigured()) return null;

  const channel = supabase.channel(`audio:${sessionId}`, {
    config: { broadcast: { self: false } },
  });

  let peerConnection = null;
  let onStreamCallback = null;
  let onStateChangeCallback = null;

  function updateState(state) {
    onStateChangeCallback?.(state);
  }

  // Handle SDP offer from rep
  async function handleOffer(sdp) {
    updateState('connecting');

    peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // When we receive the audio track
    peerConnection.ontrack = (event) => {
      console.log('[AudioStream] Received remote audio track');
      const [remoteStream] = event.streams;
      onStreamCallback?.(remoteStream);
      updateState('connected');
    };

    // Send ICE candidates back to the rep
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        channel.send({
          type: 'broadcast',
          event: 'audio_ice',
          payload: {
            candidate: event.candidate.toJSON(),
            from: managerId,
            to: 'rep',
          },
        });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      if (state === 'connected') updateState('connected');
      else if (state === 'disconnected' || state === 'failed') updateState('disconnected');
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    channel.send({
      type: 'broadcast',
      event: 'audio_answer',
      payload: {
        sdp: peerConnection.localDescription.toJSON(),
        from: managerId,
      },
    });
  }

  // Handle ICE candidate from rep
  async function handleIceCandidate(candidate) {
    if (!peerConnection) return;
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  // Subscribe to audio signaling events
  channel.on('broadcast', { event: 'audio_offer' }, ({ payload }) => {
    if (!payload.to || payload.to === managerId) {
      handleOffer(payload.sdp);
    }
  });

  channel.on('broadcast', { event: 'audio_ice' }, ({ payload }) => {
    if (payload.from === 'rep' && (!payload.to || payload.to === managerId)) {
      handleIceCandidate(payload.candidate);
    }
  });

  channel.subscribe();

  return {
    /** Request audio from the rep */
    requestAudio: () => {
      updateState('requesting');
      channel.send({
        type: 'broadcast',
        event: 'audio_request',
        payload: { managerId },
      });
    },

    /** Set callback for when audio stream is received */
    onStream: (callback) => {
      onStreamCallback = callback;
    },

    /** Set callback for connection state changes */
    onStateChange: (callback) => {
      onStateChangeCallback = callback;
    },

    /** Disconnect and clean up */
    disconnect: () => {
      if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
      }
      channel.send({
        type: 'broadcast',
        event: 'audio_disconnect',
        payload: { managerId },
      });
      updateState('disconnected');
      supabase.removeChannel(channel);
    },
  };
}
