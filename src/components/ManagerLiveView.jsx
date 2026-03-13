import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye, MessageSquare, Send, Volume2, VolumeX, ArrowLeft,
  Check, AlertTriangle, Clock, Users, DollarSign, ChevronRight,
  Headphones, Radio
} from 'lucide-react';
import { mockActiveSessions } from '../data/sampleData';
import slides from '../data/slides';
import SlideRenderer from './SlideRenderer';
import { createManagerSubscriber } from '../lib/realtimeSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { createAudioRequester } from '../lib/audioStream';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Format the speaker notes with visual styling
function renderNotes(notesText) {
  if (!notesText) return <p className="text-white/40 italic text-sm">No notes for this slide.</p>;

  const lines = notesText.split('\n');

  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-3" />;

    // Lines containing "(pause" → orange italic
    if (trimmed.toLowerCase().includes('(pause')) {
      return (
        <p key={i} className="text-orange-400 italic text-sm leading-relaxed py-0.5">
          {trimmed}
        </p>
      );
    }

    // Lines with emoji → blue highlight
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FA9F}\u{1FAA0}-\u{1FAFF}\u{231A}\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}\u{26AB}\u{26BD}\u{26BE}\u{26C4}\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}\u{2935}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/u;
    if (emojiRegex.test(trimmed)) {
      return (
        <p key={i} className="text-blue-300 bg-blue-500/10 rounded px-2 py-1 text-sm leading-relaxed my-0.5">
          {trimmed}
        </p>
      );
    }

    // Numbered lines (e.g., "1.", "2.", "3.") → white with orange left border
    if (/^\d+[\.\)\:]/.test(trimmed)) {
      return (
        <p key={i} className="text-white border-l-2 border-orange-500 pl-3 text-sm leading-relaxed py-0.5 my-0.5">
          {trimmed}
        </p>
      );
    }

    // Everything else → white/70
    return (
      <p key={i} className="text-white/70 text-sm leading-relaxed py-0.5">
        {trimmed}
      </p>
    );
  });
}

// ---------------------------------------------------------------------------
// Quick whisper presets
// ---------------------------------------------------------------------------
const QUICK_WHISPERS = [
  'Slow down',
  'Ask a question',
  'Skip to pricing',
  'Great job!',
  'Mention 75-day',
  'Go for the close',
];

// ---------------------------------------------------------------------------
// Mock AI coach activity feed
// ---------------------------------------------------------------------------
const MOCK_COACH_ACTIVITY = [
  { type: 'check', text: 'Covered startup costs' },
  { type: 'warning', text: 'Skipped loan agreement slide' },
  { type: 'check', text: 'Good pacing (1:45/slide)' },
  { type: 'next', text: 'Next: ask about vehicle usage' },
];

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function ManagerLiveView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const session = mockActiveSessions.find((s) => s.id === id);

  const [whisperText, setWhisperText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [volume, setVolume] = useState(40);
  const [liveSlide, setLiveSlide] = useState(null);
  const [liveLeadData, setLiveLeadData] = useState(null);
  const [liveDuration, setLiveDuration] = useState(null);
  const [liveComputedSavings, setLiveComputedSavings] = useState(null);
  const [liveTotalSlides, setLiveTotalSlides] = useState(null);
  const [liveSlideTitle, setLiveSlideTitle] = useState(null);
  const channelRef = useRef(null);
  const chatEndRef = useRef(null);
  const subscriberRef = useRef(null);

  const [audioState, setAudioState] = useState('idle'); // idle | requesting | connecting | connected | disconnected | error
  const [isMuted, setIsMuted] = useState(false);
  const audioRequesterRef = useRef(null);
  const audioElementRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const managerIdRef = useRef(`mgr_${Date.now()}`);

  // Look up the current slide from the slides array
  const currentSlide = session ? slides.find((s) => s.id === displayCurrentSlideNum) : null;

  // BroadcastChannel for sending whispers to the rep
  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel('sales-presenter-sync');
    } catch (e) {}
    return () => {
      if (channelRef.current) channelRef.current.close();
    };
  }, []);

  // Supabase real-time subscription for remote manager viewing
  useEffect(() => {
    if (!isSupabaseConfigured() || !id) return;

    const subscriber = createManagerSubscriber(id, {
      onStateUpdate: (payload) => {
        if (payload.slideData) {
          setLiveSlide(payload.slideData);
        }
        if (payload.leadData) {
          setLiveLeadData(payload.leadData);
        }
        if (payload.callDuration != null) {
          setLiveDuration(payload.callDuration);
        }
        if (payload.computedSavings) {
          setLiveComputedSavings(payload.computedSavings);
        }
        if (payload.totalSlides != null) {
          setLiveTotalSlides(payload.totalSlides);
        }
        if (payload.slideTitle) {
          setLiveSlideTitle(payload.slideTitle);
        }
      },
      onTranscript: (payload) => {
        // Future: handle transcript updates
      },
    });

    subscriberRef.current = subscriber;

    return () => {
      if (subscriberRef.current) {
        subscriberRef.current.unsubscribe();
        subscriberRef.current = null;
      }
    };
  }, [id]);

  // Prefer live Supabase data, fall back to mock session data
  const displaySlide = liveSlide
    ? slides.find(s => s.id === liveSlide.id) || liveSlide
    : currentSlide;
  const displayDuration = liveDuration != null ? liveDuration : (session?.duration || 0);
  const displayTotalSlides = liveTotalSlides != null ? liveTotalSlides : (session?.totalSlides || 35);
  const displayCurrentSlideNum = liveSlide?.id || session?.currentSlide || 0;
  const displaySlideTitle = liveSlideTitle || displaySlide?.title || session?.slideTitle || '';
  const displayLeadName = liveLeadData ? `${liveLeadData.firstName} ${liveLeadData.lastName}` : (session?.leadName || '');
  const displayBusinessName = liveLeadData?.businessName || session?.businessName || '';
  const displaySavings = liveComputedSavings?.annualSavings || session?.computedSavings || 0;

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // ── Handle whisper send ──────────────────────────────────────────────────
  const handleSendWhisper = (text) => {
    const msg = text || whisperText.trim();
    if (!msg) return;

    // Send via BroadcastChannel to the rep's presenter
    if (channelRef.current) {
      try {
        channelRef.current.postMessage({
          type: 'WHISPER',
          payload: { message: msg, managerName: 'Manager' },
        });
      } catch (e) {}
    }

    // Also send via Supabase for remote rep
    if (subscriberRef.current) {
      subscriberRef.current.sendWhisper(msg, 'Manager');
    }

    // Add to local chat history
    setChatHistory(prev => [...prev, { id: Date.now(), text: msg, timestamp: new Date() }]);
    setWhisperText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWhisper();
    }
  };

  // ── Audio connection ──
  const handleConnectAudio = useCallback(() => {
    if (!id) return;

    const requester = createAudioRequester(id, managerIdRef.current);
    if (!requester) {
      setAudioState('error');
      return;
    }

    audioRequesterRef.current = requester;

    requester.onStateChange((state) => {
      setAudioState(state);
    });

    requester.onStream((stream) => {
      remoteStreamRef.current = stream;
      // Create or reuse audio element for playback
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio();
        audioElementRef.current.autoplay = true;
      }
      audioElementRef.current.srcObject = stream;
      audioElementRef.current.volume = volume / 100;
      audioElementRef.current.play().catch(() => {});
    });

    requester.requestAudio();
  }, [id, volume]);

  const handleDisconnectAudio = useCallback(() => {
    if (audioRequesterRef.current) {
      audioRequesterRef.current.disconnect();
      audioRequesterRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
    }
    remoteStreamRef.current = null;
    setAudioState('idle');
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (audioElementRef.current) {
        audioElementRef.current.muted = next;
      }
      return next;
    });
  }, []);

  // Sync volume slider with audio element
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRequesterRef.current) {
        audioRequesterRef.current.disconnect();
      }
      if (audioElementRef.current) {
        audioElementRef.current.srcObject = null;
      }
    };
  }, []);

  // ── Session not found ────────────────────────────────────────────────────
  if (!session && !isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#0f0f13' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <Eye size={28} className="text-white/30" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Session not found</h1>
          <p className="text-white/50 mb-8 text-sm">
            The session you're looking for doesn't exist or has ended.
          </p>
          <button
            onClick={() => navigate('/manager')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all active:scale-95"
          >
            <ArrowLeft size={16} />
            Back to Manager Hub
          </button>
        </motion.div>
      </div>
    );
  }

  if (!session && !liveSlide) {
    // Show a loading state for Supabase sessions
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#0f0f13' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <Eye size={28} className="text-white/30 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Connecting to session...</h1>
          <p className="text-white/50 mb-8 text-sm">Waiting for real-time data from the rep.</p>
          <button
            onClick={() => navigate('/manager')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all"
          >
            <ArrowLeft size={16} />
            Back to Manager Hub
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0f0f13' }}>
      {/* ===== TOP BAR ===== */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/10"
        style={{ backgroundColor: '#18181f' }}
      >
        {/* Left: Back + listening label */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/manager')}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <span className="live-pulse inline-block w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0" />
            <span className="text-white font-semibold text-sm md:text-base">
              <span className="hidden sm:inline">&#128065; LISTENING: </span>
              {session?.repName || 'Rep'} <span className="text-white/40 mx-1">&rarr;</span> {displayLeadName || 'Lead'}
            </span>
          </div>
        </div>

        {/* Right: End Listen */}
        <button
          onClick={() => navigate('/manager')}
          className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 text-sm font-semibold border border-red-500/20 transition-all active:scale-95"
        >
          End Listen
        </button>
      </header>

      {/* ===== MAIN 2x2 GRID ===== */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 md:p-6"
      >
        {/* ─── TOP-LEFT: SLIDE PREVIEW ─── */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border border-white/10 bg-white/5 overflow-hidden flex flex-col"
        >
          {/* Slide render area */}
          <div className="flex-1 min-h-[280px] relative">
            <div className="absolute inset-0">
              {displaySlide ? (
                <SlideRenderer slide={displaySlide} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <p className="text-white/30 text-sm">No slide data</p>
                </div>
              )}
            </div>
          </div>

          {/* Slide info bar */}
          <div className="px-4 py-3 border-t border-white/10 bg-white/[0.03] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded bg-brand-orange/20 text-brand-orange text-xs font-bold shrink-0">
                Slide {displayCurrentSlideNum}
              </span>
              <span className="text-white/60 text-sm truncate">
                {displaySlideTitle}
              </span>
            </div>
            <span className="text-white/30 text-xs shrink-0">
              {displayCurrentSlideNum}/{displayTotalSlides}
            </span>
          </div>
        </motion.div>

        {/* ─── TOP-RIGHT: REP'S SCRIPT NOTES ─── */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border border-white/10 bg-white/5 flex flex-col min-h-[320px] max-h-[480px]"
        >
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            <MessageSquare size={14} className="text-brand-orange" />
            <h3 className="text-sm font-semibold text-white tracking-wide">REP'S SCRIPT NOTES</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {renderNotes(displaySlide?.notes)}
          </div>
        </motion.div>

        {/* ─── BOTTOM-LEFT: AUDIO + WHISPER ─── */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border border-white/10 bg-white/5 flex flex-col"
        >
          {/* Audio Section */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Headphones size={16} className="text-brand-orange" />
              <h3 className="text-sm font-semibold text-white tracking-wide">LIVE AUDIO</h3>
              {audioState === 'connected' && (
                <span className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-[10px] font-bold uppercase tracking-wider">Live</span>
                </span>
              )}
              {audioState === 'requesting' || audioState === 'connecting' ? (
                <span className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-yellow-400 text-[10px] font-bold uppercase tracking-wider">Connecting</span>
                </span>
              ) : null}
            </div>

            {audioState === 'idle' || audioState === 'disconnected' || audioState === 'error' ? (
              <div className="flex flex-col items-center py-3">
                <button
                  onClick={handleConnectAudio}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-orange/15 hover:bg-brand-orange/25 border border-brand-orange/25 hover:border-brand-orange/40 text-brand-orange hover:text-orange-300 text-sm font-semibold transition-all active:scale-95"
                >
                  <Radio size={16} />
                  Listen In with Audio
                </button>
                {audioState === 'error' && (
                  <p className="text-red-400/70 text-xs mt-2">Connection failed — extension may not be active</p>
                )}
                {audioState === 'disconnected' && (
                  <p className="text-white/30 text-xs mt-2">Audio disconnected</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Audio controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleMute}
                    className={`p-2 rounded-lg transition-all active:scale-95 ${
                      isMuted
                        ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>

                  {/* Volume slider */}
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer accent-brand-orange"
                    />
                    <span className="text-white/40 text-xs w-8 text-right">{volume}%</span>
                  </div>
                </div>

                {/* Disconnect button */}
                <button
                  onClick={handleDisconnectAudio}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 hover:border-red-500/25 text-red-400 hover:text-red-300 text-xs font-medium transition-all active:scale-95"
                >
                  <VolumeX size={14} />
                  Disconnect Audio
                </button>
              </div>
            )}
          </div>

          {/* Whisper Chat Section */}
          <div className="flex-1 px-4 py-3 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} className="text-brand-blue" />
              <h3 className="text-sm font-semibold text-white tracking-wide">COACH CHAT</h3>
              <span className="text-[10px] text-white/30 ml-auto">Only the rep sees these</span>
            </div>

            {/* Quick whisper buttons */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {QUICK_WHISPERS.map((text) => (
                <button
                  key={text}
                  onClick={() => handleSendWhisper(text)}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-brand-blue/15 border border-white/10 hover:border-brand-blue/30 text-white/60 hover:text-brand-blue text-xs font-medium transition-all active:scale-95"
                >
                  {text}
                </button>
              ))}
            </div>

            {/* Chat history */}
            <div className="flex-1 overflow-y-auto mb-3 space-y-2 max-h-[200px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {chatHistory.length === 0 && (
                <p className="text-white/20 text-xs italic text-center py-4">
                  No messages yet. Send a coaching tip to {session?.repName || 'the rep'}.
                </p>
              )}
              {chatHistory.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div className="max-w-[85%] bg-brand-blue/15 border border-brand-blue/20 rounded-xl rounded-br-sm px-3 py-2">
                    <p className="text-white/90 text-sm leading-relaxed">{msg.text}</p>
                    <p className="text-white/30 text-[10px] mt-1 text-right">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Whisper input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={whisperText}
                onChange={(e) => setWhisperText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a coaching message..."
                className="flex-1 text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/20 transition-all"
              />
              <button
                onClick={() => handleSendWhisper()}
                disabled={!whisperText.trim()}
                className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-brand-blue/80 hover:bg-brand-blue text-white text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* ─── BOTTOM-RIGHT: AI COACH ACTIVITY ─── */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border border-white/10 bg-white/5 flex flex-col"
        >
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            <div className="p-1 rounded-md bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <Eye size={14} className="text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-white tracking-wide">AI COACH ACTIVITY</h3>
          </div>

          <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
            {/* Activity feed */}
            <div className="space-y-2">
              {MOCK_COACH_ACTIVITY.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-2.5"
                >
                  {item.type === 'check' && (
                    <Check size={14} className="text-green-400 mt-0.5 shrink-0" />
                  )}
                  {item.type === 'warning' && (
                    <AlertTriangle size={14} className="text-yellow-400 mt-0.5 shrink-0" />
                  )}
                  {item.type === 'next' && (
                    <ChevronRight size={14} className="text-blue-400 mt-0.5 shrink-0" />
                  )}
                  <span
                    className={`text-sm leading-relaxed ${
                      item.type === 'check'
                        ? 'text-green-300/80'
                        : item.type === 'warning'
                        ? 'text-yellow-300/80'
                        : 'text-blue-300/80'
                    }`}
                  >
                    {item.text}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5 my-1" />

            {/* Discovery Progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Discovery
                </span>
                <span className="text-xs text-white/60 font-semibold">
                  {session?.discoveryProgress || 0}/{session?.discoveryTotal || 9} answered
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(session?.discoveryTotal || 9) > 0 ? ((session?.discoveryProgress || 0) / (session?.discoveryTotal || 9)) * 100 : 0}%`,
                  }}
                  transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-brand-blue to-blue-400"
                />
              </div>
            </div>

            {/* Savings */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/15">
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-400/70">
                Savings
              </span>
              <span className="text-sm font-bold text-green-400">
                ${Number(displaySavings).toLocaleString()}/yr
              </span>
            </div>

            {/* Objections */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Objections
              </span>
              <span className="text-sm font-medium text-white/60">
                {session?.objectionsHandled || 0} handled
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ===== CALL INFO BAR (bottom) ===== */}
      <motion.footer
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="border-t border-white/10 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs"
        style={{ backgroundColor: '#18181f' }}
      >
        {/* Left: Lead info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/50">
          <span className="flex items-center gap-1.5">
            <Users size={12} className="text-white/30" />
            <span className="text-white/70 font-medium">{displayLeadName || 'Unknown'}</span>
            <span className="text-white/30">|</span>
            <span>{displayBusinessName || 'N/A'}</span>
            <span className="text-white/30">|</span>
            <span>{session?.state || liveLeadData?.state || ''}</span>
            <span className="text-white/30">|</span>
            <span>{session?.leadSource || liveLeadData?.leadSource || ''}</span>
          </span>
        </div>

        {/* Right: Session stats */}
        <div className="flex items-center gap-4 text-white/50">
          <span className="flex items-center gap-1.5">
            <Clock size={12} className="text-white/30" />
            {formatDuration(displayDuration)}
          </span>
          <span className="text-white/20">|</span>
          <span>
            Slide: {displayCurrentSlideNum}/{displayTotalSlides}
          </span>
          <span className="text-white/20">|</span>
          <span className="flex items-center gap-1.5">
            <DollarSign size={12} className="text-white/30" />
            {session?.priceQuoted
              ? `$${Number(session?.priceQuoted).toLocaleString()}`
              : displaySavings
              ? `$${Number(displaySavings).toLocaleString()}/yr savings`
              : 'Not quoted yet'}
          </span>
        </div>
      </motion.footer>
    </div>
  );
}
