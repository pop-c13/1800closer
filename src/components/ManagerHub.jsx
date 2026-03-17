import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye, MessageSquare, Phone, Users, DollarSign, TrendingUp,
  Clock, AlertTriangle, BarChart3, ArrowUpRight, ChevronRight,
  Sun, Moon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mockActiveSessions, mockRecentSessions, mockTeamPerformance, topObjections, teamMembers, completedSessionsWithScorecard } from '../data/sampleData';
import { subscribeToActiveSessions } from '../lib/realtimeSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { getRecentSessions, getTodayTeamStats } from '../lib/sessionDB';
import PostCallScorecard from './PostCallScorecard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatMoney(amount) {
  return '$' + Number(amount).toLocaleString('en-US');
}

const statusColor = {
  live: 'bg-green-500',
  idle: 'bg-yellow-500',
  offline: 'bg-gray-500',
};

const statusRing = {
  live: 'ring-green-500/30',
  idle: 'ring-yellow-500/30',
  offline: 'ring-gray-500/30',
};

const outcomeBadge = {
  closed: { label: 'Closed', icon: '\u2705', bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/20' },
  'follow-up': { label: 'Follow-up', icon: '\uD83D\uDD04', bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  'no-sale': { label: 'No sale', icon: '\u274C', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/20' },
};

// Animation variants
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function ManagerHub() {
  const navigate = useNavigate();
  const { authUser } = useApp();
  const [whisperOpen, setWhisperOpen] = useState(null); // session id or null
  const [whisperText, setWhisperText] = useState('');
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [liveSessions, setLiveSessions] = useState(null); // null = not yet loaded, [] = no sessions
  const [dbRecentSessions, setDbRecentSessions] = useState(null);
  const [dbTeamStats, setDbTeamStats] = useState(null);
  const [scorecardSession, setScorecardSession] = useState(null);
  const [isDark, setIsDark] = useState(true);

  // Theme object
  const t = isDark ? {
    bg: '#0f0f13',
    headerBg: '#18181f',
    cardBg: 'rgba(255,255,255,0.03)',
    cardBorder: 'border-white/10',
    cardHover: 'hover:bg-white/[0.04]',
    text: 'text-white',
    textMuted: 'text-white/70',
    textDim: 'text-white/40',
    textFaint: 'text-white/20',
    borderColor: 'border-white/10',
    inputBg: 'bg-white/5',
    badgeBg: 'bg-white/5',
    sectionBg: 'rgba(255,255,255,0.03)',
    accent: '#F47920',
    progressBg: 'bg-white/10',
    shadow: 'shadow-lg shadow-black/20',
    headerShadow: '',
    rowHover: 'hover:bg-white/[0.04]',
    rowAlt: 'bg-white/[0.015]',
    divider: 'bg-white/10',
    dividerBorder: 'border-white/5',
    statusText: 'text-white/30',
    inputBorder: 'border-white/10',
    inputText: 'text-white',
    inputPlaceholder: 'placeholder-white/30',
  } : {
    bg: '#f8f9fc',
    headerBg: '#ffffff',
    cardBg: '#ffffff',
    cardBorder: 'border-gray-200',
    cardHover: 'hover:bg-gray-50',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    textDim: 'text-gray-400',
    textFaint: 'text-gray-300',
    borderColor: 'border-gray-200',
    inputBg: 'bg-gray-50',
    badgeBg: 'bg-gray-100',
    sectionBg: '#ffffff',
    accent: '#F47920',
    progressBg: 'bg-gray-200',
    shadow: 'shadow-sm shadow-gray-200/60',
    headerShadow: 'shadow-sm shadow-gray-200/50',
    rowHover: 'hover:bg-gray-50',
    rowAlt: 'bg-gray-50/50',
    divider: 'bg-gray-200',
    dividerBorder: 'border-gray-100',
    statusText: 'text-gray-400',
    inputBorder: 'border-gray-200',
    inputText: 'text-gray-900',
    inputPlaceholder: 'placeholder-gray-400',
  };

  // Helper for card background style
  const cardStyle = isDark
    ? { backgroundColor: 'rgba(255,255,255,0.03)' }
    : { backgroundColor: '#ffffff' };

  useEffect(() => {
    async function fetchData() {
      const [recent, stats] = await Promise.all([
        getRecentSessions(null, 8),
        getTodayTeamStats(),
      ]);
      if (recent && recent.length > 0) setDbRecentSessions(recent);
      if (stats) setDbTeamStats(stats);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const subscription = subscribeToActiveSessions((sessions) => {
      setLiveSessions(sessions);
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Use real sessions if Supabase is configured and we have data, otherwise mock
  const activeSessions = (liveSessions !== null && liveSessions.length > 0)
    ? liveSessions.map(s => ({
        id: s.sessionId || s.repId,
        repId: s.repId,
        repName: s.repName,
        status: 'live',
        leadName: s.leadName || 'Unknown Lead',
        businessName: s.businessName || '',
        state: s.state || '',
        leadSource: s.leadSource || '',
        currentSlide: s.currentSlide || 0,
        totalSlides: s.totalSlides || 35,
        slideTitle: s.slideTitle || '',
        duration: s.callDuration || 0,
        computedSavings: s.computedSavings || 0,
        objectionsHandled: s.objectionsCount || 0,
        discoveryProgress: parseInt(s.discoveryProgress) || 0,
        discoveryTotal: 9,
        priceQuoted: null,
      }))
    : mockActiveSessions;

  const liveCount = activeSessions.filter(s => s.status === 'live').length;

  // ---- Critical pacing sessions ----
  const criticalSessions = activeSessions.filter(s => {
    const slideProgress = s.currentSlide / s.totalSlides;
    return slideProgress < 0.5 && s.duration > 1200;
  });

  // ---- Sorting logic for team performance ----
  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const sortedPerformance = [...mockTeamPerformance].sort((a, b) => {
    let aVal = a[sortCol];
    let bVal = b[sortCol];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleWhisper = (sessionId) => {
    if (whisperOpen === sessionId) {
      setWhisperOpen(null);
      setWhisperText('');
    } else {
      setWhisperOpen(sessionId);
      setWhisperText('');
    }
  };

  const displayRecentSessions = dbRecentSessions
    ? dbRecentSessions.map(s => ({
        id: s.id,
        repName: s.rep_name,
        leadName: `${s.lead_first_name || ''} ${s.lead_last_name || ''}`.trim() || 'Unknown',
        businessName: s.business_name || '',
        duration: s.duration_seconds || 0,
        priceQuoted: s.price_quoted ? parseFloat(s.price_quoted) : 0,
        objections: (s.objections_handled || []).length,
        outcome: s.outcome || 'no-sale',
        date: s.created_at?.split('T')[0] || '',
      }))
    : mockRecentSessions;

  // ---- Render ----
  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: t.bg }}>
      {/* ===== TOP BAR ===== */}
      <header className={`sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-3 border-b ${t.borderColor} backdrop-blur-xl ${t.headerShadow} transition-colors duration-300`} style={{ backgroundColor: t.headerBg }}>
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <span className="text-2xl select-none" role="img" aria-label="fire">🔥</span>
          <h1 className="text-xl md:text-2xl font-black tracking-tight select-none">
            <span className={isDark ? 'text-white/60' : 'text-gray-400'}>{`1-800-`}</span>
            <span style={{ color: '#F47920' }}>CLOSER</span>
          </h1>
          <span className={`hidden sm:inline-block ${t.textDim} text-xs font-medium tracking-wide ml-1 mt-0.5`}>Manager Hub</span>
        </div>

        {/* Right: Manager info + Live count + Theme toggle */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className={`${t.text} text-sm font-semibold leading-tight`}>{authUser?.name || 'Alex Rivera'}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full mt-0.5" style={{ backgroundColor: '#F47920', color: '#fff' }}>Manager</span>
          </div>
          <div className={`flex items-center gap-2 ${t.inputBg} border ${t.borderColor} rounded-full px-3 py-1.5`}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className={`${t.text} text-sm font-semibold`}>{liveCount} Live</span>
          </div>
          {isSupabaseConfigured() && liveSessions !== null && (
            <span className="text-[10px] text-green-400/60 font-medium tracking-wider">REALTIME</span>
          )}
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/60' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* ===== SCROLLABLE CONTENT ===== */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-10">

        {/* ────────── CRITICAL PACING ALERTS ────────── */}
        {criticalSessions.length > 0 && (
          <div className="space-y-2 mb-6">
            {criticalSessions.map(s => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/manager/live/${s.id}`)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 cursor-pointer hover:bg-red-500/15 transition-colors"
              >
                <span className="text-red-400 text-sm font-semibold">
                  ⚠️ {s.repName} may run over — {formatDuration(s.duration)} into call, still on slide {s.currentSlide}/{s.totalSlides}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {/* ────────── LIVE NOW ────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-[3px] h-6 rounded-full" style={{ backgroundColor: '#F47920' }} />
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <h2 className={`${t.text} text-lg font-bold tracking-tight`}>LIVE NOW</h2>
            <span className={`${t.textDim} text-sm`}>{activeSessions.length} sessions</span>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {activeSessions.map(session => {
              const progress = session.totalSlides > 0
                ? Math.round((session.currentSlide / session.totalSlides) * 100)
                : 0;

              // Pacing calculation
              const slideProgress = session.currentSlide / session.totalSlides;
              const timeProgress = session.duration / 1800;

              let pacingStatus, pacingLabel, pacingClass, pacingBorderColor;
              if (slideProgress < 0.5 && session.duration > 1200) {
                pacingStatus = 'critical';
                pacingLabel = '🔴 May run over';
                pacingClass = 'bg-red-500/15 text-red-400 border-red-500/20';
                pacingBorderColor = 'border-l-red-500';
              } else if (slideProgress < timeProgress * 0.7) {
                pacingStatus = 'behind';
                pacingLabel = '⚠️ Behind pace';
                pacingClass = 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20';
                pacingBorderColor = 'border-l-yellow-500';
              } else {
                pacingStatus = 'ok';
                pacingLabel = '✅ On pace';
                pacingClass = 'bg-green-500/15 text-green-400 border-green-500/20';
                pacingBorderColor = 'border-l-green-500';
              }

              return (
                <motion.div
                  key={session.id}
                  variants={cardVariants}
                  className={`rounded-2xl border ${t.cardBorder} border-l-4 ${pacingBorderColor} p-5 flex flex-col gap-3 ${t.shadow} transition-all duration-200 hover:-translate-y-0.5 ${t.cardHover}`}
                  style={cardStyle}
                >
                  {/* Rep name + status dot */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ring-4 ${statusColor[session.status]} ${statusRing[session.status]}`} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const member = teamMembers.find(tm => tm.name === session.repName);
                          if (member) navigate(`/manager/rep/${member.id}`);
                        }}
                        className={`${t.text} font-bold text-base hover:text-brand-orange transition-colors underline-offset-2 hover:underline`}
                      >
                        {session.repName}
                      </button>
                    </div>
                    <span className={`${t.statusText} text-xs uppercase tracking-wider font-semibold`}>{session.status}</span>
                  </div>

                  <div className={`h-px ${t.divider}`} />

                  {/* Presenting to */}
                  <div>
                    <span className={`${t.textDim} text-xs uppercase tracking-wider`}>Presenting to</span>
                    <p className={`${t.text} font-semibold text-sm mt-0.5`}>{session.leadName}</p>
                    <p className={`${isDark ? 'text-white/50' : 'text-gray-500'} text-xs`}>{session.businessName}</p>
                  </div>

                  {/* Slide info */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`${t.textDim} text-xs`}>
                        Slide: {session.currentSlide}/{session.totalSlides}
                      </span>
                      <span className={`${t.textMuted} text-xs font-medium`}>{progress}%</span>
                    </div>
                    <p className={`${t.textMuted} text-xs italic mt-0.5`}>"{session.slideTitle}"</p>
                    {/* Progress bar */}
                    <div className={`mt-2 w-full h-2.5 rounded-full ${t.progressBg} overflow-hidden`}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #F47920, #FF9F43)' }}
                      />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 flex-wrap text-xs">
                    <div className={`flex items-center gap-1.5 ${t.textMuted}`}>
                      <Clock size={13} className={t.textDim} />
                      <span>{formatDuration(session.duration)}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${t.textMuted}`}>
                      <DollarSign size={13} className="text-green-400" />
                      <span>{formatMoney(session.computedSavings)}/yr</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${t.textMuted}`}>
                      <AlertTriangle size={13} className="text-yellow-400" />
                      <span>{session.objectionsHandled} objection{session.objectionsHandled !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Pacing badge */}
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${pacingClass}`}>
                    {pacingLabel}
                  </span>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => navigate(`/manager/live/${session.id}`)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg ${t.inputBg} border ${t.borderColor} ${t.textMuted} text-sm font-medium transition-all hover:shadow-md ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} hover:shadow-orange-500/10`}
                      style={{ }}
                    >
                      <Eye size={15} />
                      Listen In
                    </button>
                    <button
                      onClick={() => toggleWhisper(session.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                        whisperOpen === session.id
                          ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300'
                          : `${t.inputBg} border ${t.borderColor} ${t.textMuted} ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`
                      }`}
                    >
                      <MessageSquare size={15} />
                      Whisper
                    </button>
                  </div>

                  {/* Whisper input */}
                  {whisperOpen === session.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={whisperText}
                        onChange={e => setWhisperText(e.target.value)}
                        placeholder="Type a whisper message..."
                        className={`flex-1 ${t.inputBg} border ${t.inputBorder} rounded-lg px-3 py-2 text-sm ${t.inputText} ${t.inputPlaceholder} focus:outline-none focus:ring-1 focus:ring-orange-500/50`}
                      />
                      <button
                        onClick={() => {
                          setWhisperText('');
                          setWhisperOpen(null);
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-lg hover:shadow-orange-500/25"
                        style={{ backgroundColor: '#F47920' }}
                      >
                        Send
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* ────────── TODAY'S SUMMARY ────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-[3px] h-6 rounded-full" style={{ backgroundColor: '#F47920' }} />
            <h2 className={`${t.text} text-lg font-bold tracking-tight`}>TODAY'S SUMMARY</h2>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { label: 'Total Calls', value: dbTeamStats ? String(dbTeamStats.totalCalls) : '12', icon: Phone, color: '#3B82F6', bg: 'bg-blue-500/15', gradient: 'from-blue-500/20 to-blue-600/10' },
              { label: 'Deals Closed', value: dbTeamStats ? String(dbTeamStats.closedToday) : '5', icon: DollarSign, color: '#22C55E', bg: 'bg-green-500/15', gradient: 'from-green-500/20 to-green-600/10' },
              { label: 'Revenue Booked', value: dbTeamStats ? `$${dbTeamStats.revenueBooked.toLocaleString()}` : '$13,695', icon: TrendingUp, color: '#F47920', bg: 'bg-orange-500/15', gradient: 'from-orange-500/20 to-orange-600/10' },
              { label: 'Team Close Rate', value: dbTeamStats ? `${dbTeamStats.closeRate}%` : '58%', icon: BarChart3, color: '#A855F7', bg: 'bg-purple-500/15', gradient: 'from-purple-500/20 to-purple-600/10' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={cardVariants}
                className={`rounded-2xl border ${t.cardBorder} p-5 flex flex-col gap-3 ${t.shadow} transition-all duration-200 hover:-translate-y-0.5 ${t.cardHover}`}
                style={cardStyle}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                  <stat.icon size={20} style={{ color: stat.color }} />
                </div>
                <div>
                  <p className={`${t.text} text-2xl font-bold leading-tight`} style={{ textShadow: isDark ? `0 0 20px ${stat.color}15` : 'none' }}>{stat.value}</p>
                  <p className={`${t.textDim} text-xs mt-0.5`}>{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ────────── RECENT SESSIONS ────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-[3px] h-6 rounded-full" style={{ backgroundColor: '#F47920' }} />
            <h2 className={`${t.text} text-lg font-bold tracking-tight`}>RECENT SESSIONS</h2>
          </div>
          <div className={`rounded-2xl border ${t.cardBorder} overflow-hidden ${t.shadow}`} style={cardStyle}>
            {/* Header row - hidden on mobile */}
            <div className={`hidden md:grid grid-cols-12 gap-2 px-5 py-3 border-b ${t.borderColor} ${t.textDim} text-xs uppercase tracking-wider font-semibold`}>
              <div className="col-span-4">Session</div>
              <div className="col-span-1 text-center">Duration</div>
              <div className="col-span-2 text-center">Price Quoted</div>
              <div className="col-span-1 text-center">Obj.</div>
              <div className="col-span-2 text-center">Outcome</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            {displayRecentSessions.map((session, idx) => {
              const badge = outcomeBadge[session.outcome] || outcomeBadge['no-sale'];
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-2 px-5 py-4 items-center ${
                    idx < displayRecentSessions.length - 1 ? `border-b ${t.dividerBorder}` : ''
                  } ${idx % 2 === 1 ? t.rowAlt : ''} ${t.rowHover} transition-colors duration-150`}
                >
                  {/* Session info */}
                  <div className="md:col-span-4">
                    <p className={`${t.text} text-sm font-semibold`}>
                      <button
                        onClick={() => {
                          const member = teamMembers.find(tm => tm.name === session.repName);
                          if (member) navigate(`/manager/rep/${member.id}`);
                        }}
                        className="hover:text-brand-orange transition-colors underline-offset-2 hover:underline"
                      >
                        {session.repName}
                      </button>
                      <span className={`${t.textFaint} mx-1.5`}>&rarr;</span>
                      <span className={t.textMuted}>{session.leadName}</span>
                    </p>
                    <p className={`${t.textDim} text-xs`}>{session.businessName}</p>
                  </div>

                  {/* Duration */}
                  <div className="md:col-span-1 text-center">
                    <span className={`${t.textMuted} text-sm`}>{formatDuration(session.duration)}</span>
                  </div>

                  {/* Price quoted */}
                  <div className="md:col-span-2 text-center">
                    <span className={`${isDark ? 'text-white/80' : 'text-gray-800'} text-sm font-medium`}>{formatMoney(session.priceQuoted)}</span>
                  </div>

                  {/* Objections */}
                  <div className="md:col-span-1 text-center">
                    <span className={`${t.textMuted} text-sm`}>{session.objections}</span>
                  </div>

                  {/* Outcome */}
                  <div className="md:col-span-2 flex justify-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                      <span>{badge.icon}</span>
                      {badge.label}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      onClick={() => {
                        // Find matching scorecard data or build from session
                        const match = completedSessionsWithScorecard.find(
                          s => s.repName === session.repName && s.outcome === session.outcome
                        );
                        const scData = match || {
                          leadName: session.leadName,
                          businessName: session.businessName,
                          duration: session.duration,
                          outcome: session.outcome,
                          discoveryAnswered: 7,
                          objectionsHandled: session.objections || 0,
                          coachTipsUsed: 3,
                          savingsPresented: 5200,
                          priceQuoted: session.priceQuoted || 0,
                          totalSale: session.priceQuoted || 0,
                          totalSlides: 35,
                          slidesPresented: 30,
                          flowScore: 82,
                          callNotes: '',
                          products: session.outcome === 'closed' ? [
                            { name: 'Core Accounting Package', price: 2949, terms: '2-pay' },
                          ] : [],
                          scorecard: {
                            flowScore: 82,
                            flowChecklist: [
                              { label: 'Followed recommended slide path', status: 'pass' },
                              { label: 'Covered all required sections', status: 'pass' },
                              { label: 'Used the tax calculator', status: 'pass' },
                              { label: 'Completed discovery (7/9 questions)', status: 'warn' },
                              { label: 'Skipped: Loan Agreement (optional)', status: 'skip' },
                            ],
                            slides: {
                              presented: 30, total: 35,
                              longest: { slideNum: 5, title: 'Discovery', time: 262 },
                              fastest: { slideNum: 3, title: 'Trustpilot', time: 18 },
                            },
                            aiSummary: match?.scorecard?.aiSummary || null,
                          },
                        };
                        setScorecardSession(scData);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${t.inputBg} border ${t.borderColor} ${t.textMuted} text-xs font-medium transition-all hover:shadow-sm ${isDark ? 'hover:bg-white/10 hover:text-white/80' : 'hover:bg-gray-100 hover:text-gray-800'}`}
                    >
                      View Summary
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ────────── TEAM PERFORMANCE ────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-[3px] h-6 rounded-full" style={{ backgroundColor: '#F47920' }} />
            <h2 className={`${t.text} text-lg font-bold tracking-tight`}>TEAM PERFORMANCE</h2>
          </div>
          <div className={`rounded-2xl border ${t.cardBorder} overflow-x-auto ${t.shadow}`} style={cardStyle}>
            <table className="w-full min-w-[540px]">
              <thead>
                <tr className={`border-b ${t.borderColor}`}>
                  {[
                    { key: 'name', label: 'Rep Name', align: 'text-left' },
                    { key: 'calls', label: 'Calls', align: 'text-center' },
                    { key: 'closeRate', label: 'Close %', align: 'text-center' },
                    { key: 'avgDuration', label: 'Avg Duration', align: 'text-center' },
                    { key: 'avgSavings', label: 'Avg Savings Quoted', align: 'text-right' },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`px-5 py-3 text-xs uppercase tracking-wider font-semibold cursor-pointer select-none transition-colors ${isDark ? 'hover:text-white/70' : 'hover:text-gray-700'} ${col.align} ${
                        sortCol === col.key ? 'text-orange-400' : t.textDim
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sortCol === col.key && (
                          <span className="text-[10px]">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedPerformance.map((rep, idx) => (
                  <tr
                    key={rep.name}
                    className={`${
                      idx < sortedPerformance.length - 1 ? `border-b ${t.dividerBorder}` : ''
                    } ${idx % 2 === 1 ? t.rowAlt : ''} ${t.rowHover} transition-colors duration-150`}
                  >
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => {
                          const member = teamMembers.find(tm => tm.name === rep.name);
                          if (member) navigate(`/manager/rep/${member.id}`);
                        }}
                        className={`${t.text} text-sm font-semibold hover:text-brand-orange transition-colors underline-offset-2 hover:underline`}
                      >
                        {rep.name}
                      </button>
                    </td>
                    <td className={`px-5 py-3.5 ${t.textMuted} text-sm text-center`}>{rep.calls}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-base font-bold ${
                        rep.closeRate >= 60 ? 'text-green-400' : rep.closeRate >= 50 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {rep.closeRate}%
                      </span>
                    </td>
                    <td className={`px-5 py-3.5 ${t.textMuted} text-sm text-center`}>{formatDuration(rep.avgDuration)}</td>
                    <td className={`px-5 py-3.5 ${isDark ? 'text-white/80' : 'text-gray-800'} text-sm font-medium text-right`}>{formatMoney(rep.avgSavings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ────────── TOP OBJECTIONS THIS WEEK ────────── */}
        <section className="pb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-[3px] h-6 rounded-full" style={{ backgroundColor: '#F47920' }} />
            <h2 className={`${t.text} text-lg font-bold tracking-tight`}>TOP OBJECTIONS THIS WEEK</h2>
          </div>
          <div
            className={`rounded-2xl border ${t.cardBorder} p-5 space-y-4 ${t.shadow}`}
            style={cardStyle}
          >
            {topObjections.map((obj, idx) => (
              <motion.div
                key={obj.text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.35 }}
                className="flex items-center gap-4"
              >
                {/* Label */}
                <span className={`${t.textMuted} text-sm w-52 min-w-[130px] shrink-0 truncate`}>{obj.text}</span>

                {/* Bar */}
                <div className={`flex-1 h-6 rounded-full ${t.inputBg} overflow-hidden relative`}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${obj.percentage}%`,
                      background: 'linear-gradient(90deg, #F47920, #FF9F43)',
                    }}
                  />
                </div>

                {/* Percentage */}
                <span className={`${isDark ? 'text-white/80' : 'text-gray-800'} text-sm font-semibold w-12 text-right shrink-0`}>{obj.percentage}%</span>
              </motion.div>
            ))}
          </div>
        </section>

      </main>

      {/* Scorecard overlay */}
      <PostCallScorecard
        show={!!scorecardSession}
        sessionData={scorecardSession}
        onDone={() => setScorecardSession(null)}
      />
    </div>
  );
}
