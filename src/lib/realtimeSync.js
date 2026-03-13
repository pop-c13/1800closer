import { supabase, isSupabaseConfigured } from './supabase';

// ---------------------------------------------------------------------------
// Rep-side: broadcast session state to a Supabase Realtime channel
// ---------------------------------------------------------------------------
export function createSessionBroadcaster(sessionId) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured — using local BroadcastChannel only');
    return null;
  }

  const channel = supabase.channel(`session:${sessionId}`, {
    config: { broadcast: { self: false } },
  });

  channel.subscribe();

  return {
    broadcastState: (state) => {
      channel.send({
        type: 'broadcast',
        event: 'state_update',
        payload: state,
      });
    },

    broadcastTranscript: (text, timestamp) => {
      channel.send({
        type: 'broadcast',
        event: 'transcript_update',
        payload: { text, timestamp },
      });
    },

    onWhisper: (callback) => {
      channel.on('broadcast', { event: 'whisper' }, ({ payload }) => {
        callback(payload);
      });
    },

    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

// ---------------------------------------------------------------------------
// Manager-side: subscribe to a specific session channel
// ---------------------------------------------------------------------------
export function createManagerSubscriber(sessionId, callbacks) {
  if (!isSupabaseConfigured()) return null;

  const channel = supabase.channel(`session:${sessionId}`);

  channel.on('broadcast', { event: 'state_update' }, ({ payload }) => {
    callbacks.onStateUpdate?.(payload);
  });

  channel.on('broadcast', { event: 'transcript_update' }, ({ payload }) => {
    callbacks.onTranscript?.(payload);
  });

  channel.subscribe();

  return {
    sendWhisper: (message, fromName, quickType = null) => {
      channel.send({
        type: 'broadcast',
        event: 'whisper',
        payload: { message, from: fromName, quickType, timestamp: Date.now() },
      });
    },

    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

// ---------------------------------------------------------------------------
// Presence channel — reps track themselves so the Manager Hub sees all active
// ---------------------------------------------------------------------------
export function createPresenceTracker(repId, repName, sessionData) {
  if (!isSupabaseConfigured()) return null;

  const channel = supabase.channel('active-sessions', {
    config: { presence: { key: repId } },
  });

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        repId,
        repName,
        ...sessionData,
        lastUpdate: Date.now(),
      });
    }
  });

  return {
    updatePresence: async (data) => {
      await channel.track({
        repId,
        repName,
        ...data,
        lastUpdate: Date.now(),
      });
    },

    unsubscribe: () => {
      channel.untrack();
      supabase.removeChannel(channel);
    },
  };
}

// ---------------------------------------------------------------------------
// Manager Hub — subscribe to presence of all active sessions
// ---------------------------------------------------------------------------
export function subscribeToActiveSessions(callback) {
  if (!isSupabaseConfigured()) return null;

  const channel = supabase.channel('active-sessions');

  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    const sessions = Object.entries(state).map(([key, presences]) => ({
      repId: key,
      ...presences[0],
    }));
    callback(sessions);
  });

  channel.subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}
