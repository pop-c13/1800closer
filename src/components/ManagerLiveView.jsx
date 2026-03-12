import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye, MessageSquare, Send, Volume2, VolumeX, ArrowLeft,
  Check, AlertTriangle, Clock, Users, DollarSign, ChevronRight
} from 'lucide-react';
import { mockActiveSessions } from '../data/sampleData';
import slides from '../data/slides';
import SlideRenderer from './SlideRenderer';

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
  const channelRef = useRef(null);
  const chatEndRef = useRef(null);

  // Look up the current slide from the slides array
  const currentSlide = session ? slides.find((s) => s.id === session.currentSlide) : null;

  // BroadcastChannel for sending whispers to the rep
  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel('sales-presenter-sync');
    } catch (e) {}
    return () => {
      if (channelRef.current) channelRef.current.close();
    };
  }, []);

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

  // ── Session not found ────────────────────────────────────────────────────
  if (!session) {
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
              {session.repName} <span className="text-white/40 mx-1">&rarr;</span> {session.leadName}
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
              {currentSlide ? (
                <SlideRenderer slide={currentSlide} />
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
                Slide {session.currentSlide}
              </span>
              <span className="text-white/60 text-sm truncate">
                {currentSlide?.title || session.slideTitle}
              </span>
            </div>
            <span className="text-white/30 text-xs shrink-0">
              {session.currentSlide}/{session.totalSlides}
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
            {renderNotes(currentSlide?.notes)}
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
              <span className="text-base">&#127911;</span>
              <h3 className="text-sm font-semibold text-white tracking-wide">AUDIO</h3>
              <span className="ml-auto px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-400 text-[10px] font-bold uppercase tracking-wider">
                Phase 2
              </span>
            </div>

            <p className="text-white/40 text-xs mb-3 italic">
              Live audio streaming &mdash; available with Chrome extension (Phase 2)
            </p>

            {/* Mock audio player */}
            <div className="flex items-center gap-3">
              <button className="p-1.5 rounded-lg bg-white/5 text-white/30 cursor-not-allowed">
                <VolumeX size={16} />
              </button>

              {/* Progress bar */}
              <div className="flex-1 h-1.5 rounded-full bg-white/10 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-0 bg-white/20 rounded-full" />
              </div>

              {/* Volume slider */}
              <div className="flex items-center gap-2 w-24">
                <Volume2 size={14} className="text-white/20 shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  disabled
                  className="w-full h-1 rounded-full appearance-none bg-white/10 cursor-not-allowed opacity-40"
                />
              </div>
            </div>
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
                  No messages yet. Send a coaching tip to {session.repName}.
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
                  {session.discoveryProgress}/{session.discoveryTotal} answered
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(session.discoveryProgress / session.discoveryTotal) * 100}%`,
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
                ${Number(session.computedSavings).toLocaleString()}/yr
              </span>
            </div>

            {/* Objections */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Objections
              </span>
              <span className="text-sm font-medium text-white/60">
                {session.objectionsHandled} handled
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
            <span className="text-white/70 font-medium">{session.leadName}</span>
            <span className="text-white/30">|</span>
            <span>{session.businessName}</span>
            <span className="text-white/30">|</span>
            <span>{session.state}</span>
            <span className="text-white/30">|</span>
            <span>{session.leadSource}</span>
          </span>
        </div>

        {/* Right: Session stats */}
        <div className="flex items-center gap-4 text-white/50">
          <span className="flex items-center gap-1.5">
            <Clock size={12} className="text-white/30" />
            {formatDuration(session.duration)}
          </span>
          <span className="text-white/20">|</span>
          <span>
            Slide: {session.currentSlide}/{session.totalSlides}
          </span>
          <span className="text-white/20">|</span>
          <span className="flex items-center gap-1.5">
            <DollarSign size={12} className="text-white/30" />
            {session.priceQuoted
              ? `$${Number(session.priceQuoted).toLocaleString()}`
              : 'Not quoted yet'}
          </span>
        </div>
      </motion.footer>
    </div>
  );
}
