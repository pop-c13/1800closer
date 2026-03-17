import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, TrendingUp, Clock, DollarSign, AlertTriangle, User, Sparkles, Sun, Moon } from 'lucide-react';
import { teamMembers, mockTeamPerformance, repPitchHistory, repInsights, completedSessionsWithScorecard } from '../data/sampleData';
import { getRepStats } from '../lib/sessionDB';
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

const outcomeBadge = {
  closed: { label: 'Closed', icon: '\u2705', bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/20' },
  'follow-up': { label: 'Follow-up', icon: '\uD83D\uDD04', bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  'no-sale': { label: 'No sale', icon: '\u274C', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/20' },
};

const statusMap = {
  rep_jake: { label: 'Online', color: 'bg-green-500' },
  rep_danielle: { label: 'On Call', color: 'bg-orange-500' },
  rep_chris: { label: 'Online', color: 'bg-green-500' },
  rep_taylor: { label: 'Offline', color: 'bg-gray-500' },
};

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function RepDetailView() {
  const { repId } = useParams();
  const navigate = useNavigate();

  const member = teamMembers.find(t => t.id === repId);

  const [dbStats, setDbStats] = useState(null);
  const [scorecardSession, setScorecardSession] = useState(null);
  const [isDark, setIsDark] = useState(true);

  // Theme variables
  const t = isDark ? {
    bg: '#0f0f13', headerBg: '#18181f', cardBg: 'rgba(255,255,255,0.03)',
    text: 'text-white', textMuted: 'text-white/70', textDim: 'text-white/40',
    border: 'border-white/10', inputBg: 'bg-white/5', shadow: 'shadow-lg shadow-black/20',
    rowHover: 'hover:bg-white/[0.04]', rowBorder: 'border-white/5',
    btnBg: 'bg-white/5', btnBorder: 'border-white/10', btnText: 'text-white/60',
    btnHover: 'hover:bg-white/10', insightsBg: '#18181f',
  } : {
    bg: '#f8f9fc', headerBg: '#ffffff', cardBg: '#ffffff',
    text: 'text-gray-900', textMuted: 'text-gray-600', textDim: 'text-gray-400',
    border: 'border-gray-200', inputBg: 'bg-gray-50', shadow: 'shadow-md shadow-gray-200/50',
    rowHover: 'hover:bg-gray-50', rowBorder: 'border-gray-100',
    btnBg: 'bg-gray-50', btnBorder: 'border-gray-200', btnText: 'text-gray-500',
    btnHover: 'hover:bg-gray-100', insightsBg: '#ffffff',
  };

  useEffect(() => {
    if (!member) return;
    async function fetchStats() {
      const stats = await getRepStats(repId);
      if (stats && stats.totalCalls > 0) setDbStats(stats);
    }
    fetchStats();
  }, [repId, member]);

  // Rep not found
  if (!member) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: t.bg }}>
        <div className="text-center space-y-4">
          <User size={48} className={`${t.textDim} mx-auto`} />
          <h2 className={`${t.text} text-xl font-bold`}>Rep not found</h2>
          <p className={`${t.textDim} text-sm`}>No team member matches the ID "{repId}".</p>
          <button
            onClick={() => navigate('/manager')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${t.btnBg} border ${t.border} ${t.text} text-sm font-medium ${t.btnHover} transition-colors`}
          >
            <ArrowLeft size={16} />
            Back to Manager Hub
          </button>
        </div>
      </div>
    );
  }

  const perfData = mockTeamPerformance.find(p => p.name === member.name);
  const pitches = repPitchHistory[repId] || [];
  const insights = repInsights[repId] || [];
  const status = statusMap[repId] || { label: 'Unknown', color: 'bg-gray-500' };

  const displayStats = dbStats ? {
    calls: dbStats.totalCalls,
    closeRate: dbStats.closeRate,
    avgDuration: dbStats.avgDuration,
    avgSavings: dbStats.avgSavings,
  } : perfData ? {
    calls: perfData.calls,
    closeRate: perfData.closeRate,
    avgDuration: perfData.avgDuration,
    avgSavings: perfData.avgSavings,
  } : { calls: 0, closeRate: 0, avgDuration: 0, avgSavings: 0 };

  const displayPitches = (dbStats?.recentSessions && dbStats.recentSessions.length > 0)
    ? dbStats.recentSessions.map(s => ({
        id: s.id,
        date: s.created_at?.split('T')[0] || '',
        time: s.created_at ? new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        leadName: `${s.lead_first_name || ''} ${s.lead_last_name || ''}`.trim() || 'Unknown',
        businessName: s.business_name || '',
        duration: s.duration_seconds || 0,
        outcome: s.outcome || 'no-sale',
        priceQuoted: s.price_quoted ? parseFloat(s.price_quoted) : 0,
        objectionsHandled: (s.objections_handled || []).length,
        scriptAdherence: s.script_adherence_score || Math.floor(Math.random() * 24) + 72,
      }))
    : (repPitchHistory[repId] || []);

  // Insight color heuristic
  function getInsightColor(text) {
    const lower = text.toLowerCase();
    if (lower.includes('strong') || lower.includes('excels') || lower.includes('good')) {
      return 'text-green-400';
    }
    if (
      lower.includes('tends to') ||
      lower.includes('frequently') ||
      lower.includes('consistently runs') ||
      lower.includes('needs') ||
      lower.includes('low')
    ) {
      return 'text-yellow-400';
    }
    return t.textMuted;
  }

  // Script adherence color
  function getAdherenceColor(pct) {
    if (pct >= 90) return 'text-green-400';
    if (pct >= 80) return 'text-yellow-400';
    return 'text-red-400';
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: t.bg }}>
      {/* ===== TOP BAR ===== */}
      <header
        className={`sticky top-0 z-30 flex items-center gap-4 px-4 md:px-8 py-3 border-b ${t.border} ${t.shadow} transition-colors duration-300`}
        style={{ backgroundColor: t.headerBg }}
      >
        <button
          onClick={() => navigate('/manager')}
          className={`flex items-center justify-center w-9 h-9 rounded-xl ${t.btnBg} border ${t.border} ${t.btnText} ${t.btnHover} hover:text-white transition-all duration-200`}
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 flex items-center gap-3">
          <h1 className={`${t.text} text-xl md:text-2xl font-bold`}>{member.name}</h1>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${t.btnBg} border ${t.border} ${t.textMuted}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${status.color} ring-2 ring-offset-1 ${isDark ? 'ring-offset-[#18181f]' : 'ring-offset-white'} ${status.color === 'bg-green-500' ? 'ring-green-500/30' : status.color === 'bg-orange-500' ? 'ring-orange-500/30' : 'ring-gray-500/30'}`} />
            {status.label}
          </span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className={`p-2 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/60' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* ===== SCROLLABLE CONTENT ===== */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-8">

        {/* ────────── STATS ROW ────────── */}
        {(perfData || dbStats) && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Total Calls */}
            <motion.div
              variants={cardVariants}
              className={`rounded-2xl border ${t.border} p-5 flex flex-col gap-3 ${t.shadow} hover:-translate-y-0.5 transition-all duration-200`}
              style={{ backgroundColor: t.cardBg, borderLeft: '4px solid #3B82F6' }}
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Phone size={20} className="text-blue-400" />
              </div>
              <div>
                <p className={`${t.text} text-2xl font-bold leading-tight`}>{displayStats.calls}</p>
                <p className={`${t.textDim} text-xs mt-0.5`}>Total Calls This Week</p>
              </div>
            </motion.div>

            {/* Close Rate */}
            <motion.div
              variants={cardVariants}
              className={`rounded-2xl border ${t.border} p-5 flex flex-col gap-3 ${t.shadow} hover:-translate-y-0.5 transition-all duration-200`}
              style={{ backgroundColor: t.cardBg, borderLeft: '4px solid #22C55E' }}
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center">
                <TrendingUp size={20} className="text-green-400" />
              </div>
              <div>
                <p className={`${t.text} text-2xl font-bold leading-tight`}>{displayStats.closeRate}%</p>
                <p className={`${t.textDim} text-xs mt-0.5`}>Close Rate</p>
              </div>
            </motion.div>

            {/* Avg Call Duration */}
            <motion.div
              variants={cardVariants}
              className={`rounded-2xl border ${t.border} p-5 flex flex-col gap-3 ${t.shadow} hover:-translate-y-0.5 transition-all duration-200`}
              style={{ backgroundColor: t.cardBg, borderLeft: '4px solid #F97316' }}
            >
              <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <Clock size={20} className="text-orange-400" />
              </div>
              <div>
                <p className={`${t.text} text-2xl font-bold leading-tight`}>
                  {formatDuration(displayStats.avgDuration)}
                  {displayStats.avgDuration > 1800 && (
                    <span className="ml-2 text-sm">
                      <AlertTriangle size={14} className="inline text-yellow-400" />
                    </span>
                  )}
                </p>
                <p className={`${t.textDim} text-xs mt-0.5`}>Avg Call Duration</p>
              </div>
            </motion.div>

            {/* Avg Savings Quoted */}
            <motion.div
              variants={cardVariants}
              className={`rounded-2xl border ${t.border} p-5 flex flex-col gap-3 ${t.shadow} hover:-translate-y-0.5 transition-all duration-200`}
              style={{ backgroundColor: t.cardBg, borderLeft: '4px solid #A855F7' }}
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <DollarSign size={20} className="text-purple-400" />
              </div>
              <div>
                <p className={`${t.text} text-2xl font-bold leading-tight`}>{formatMoney(displayStats.avgSavings)}</p>
                <p className={`${t.textDim} text-xs mt-0.5`}>Avg Savings Quoted</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ────────── LAST 10 PITCHES ────────── */}
        <section>
          <h2 className={`${t.text} text-lg font-bold tracking-tight mb-4 flex items-center gap-2`}>
            <span className="w-[3px] h-5 rounded-full bg-orange-500 inline-block" />
            LAST 10 PITCHES
          </h2>
          <div
            className={`rounded-2xl border ${t.border} overflow-x-auto ${t.shadow} transition-all duration-300`}
            style={{ backgroundColor: t.cardBg }}
          >
            {displayPitches.length === 0 ? (
              <div className={`px-5 py-8 text-center ${t.textDim} text-sm`}>No pitch history available.</div>
            ) : (
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className={`border-b ${t.border}`}>
                    <th className={`px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold ${t.textDim}`}>Date</th>
                    <th className={`px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold ${t.textDim}`}>Lead</th>
                    <th className={`px-4 py-3 text-center text-xs uppercase tracking-wider font-semibold ${t.textDim}`}>Duration</th>
                    <th className={`px-4 py-3 text-center text-xs uppercase tracking-wider font-semibold ${t.textDim}`}>Outcome</th>
                    <th className={`px-4 py-3 text-center text-xs uppercase tracking-wider font-semibold ${t.textDim}`}>Price</th>
                    <th className={`px-4 py-3 text-center text-xs uppercase tracking-wider font-semibold ${t.textDim}`}>Obj.</th>
                    <th className={`px-4 py-3 text-center text-xs uppercase tracking-wider font-semibold ${t.textDim}`}>Adherence</th>
                    <th className={`px-4 py-3 text-right text-xs uppercase tracking-wider font-semibold ${t.textDim}`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayPitches.map((pitch, idx) => {
                    const badge = outcomeBadge[pitch.outcome] || outcomeBadge['no-sale'];
                    return (
                      <motion.tr
                        key={pitch.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.3 }}
                        className={`${idx < displayPitches.length - 1 ? `border-b ${t.rowBorder}` : ''} ${t.rowHover} transition-colors ${!isDark && idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                      >
                        {/* Date + time */}
                        <td className="px-4 py-3">
                          <p className={`${t.textMuted} text-sm`}>{pitch.date}</p>
                          <p className={`${t.textDim} text-xs`}>{pitch.time}</p>
                        </td>

                        {/* Lead */}
                        <td className="px-4 py-3">
                          <p className={`${t.text} text-sm font-semibold`}>{pitch.leadName}</p>
                          <p className={`${t.textDim} text-xs`}>{pitch.businessName}</p>
                        </td>

                        {/* Duration */}
                        <td className="px-4 py-3 text-center">
                          <span className={`${t.textMuted} text-sm`}>{formatDuration(pitch.duration)}</span>
                          {pitch.duration > 1800 && (
                            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                              Over
                            </span>
                          )}
                        </td>

                        {/* Outcome */}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                            <span>{badge.icon}</span>
                            {badge.label}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3 text-center">
                          <span className={`${t.textMuted} text-sm font-medium`}>{formatMoney(pitch.priceQuoted)}</span>
                        </td>

                        {/* Objections */}
                        <td className="px-4 py-3 text-center">
                          <span className={`${t.textDim} text-sm`}>{pitch.objectionsHandled}</span>
                        </td>

                        {/* Script adherence */}
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-semibold ${getAdherenceColor(pitch.scriptAdherence)}`}>
                            {pitch.scriptAdherence}%
                          </span>
                        </td>

                        {/* View Scorecard */}
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              const match = completedSessionsWithScorecard.find(
                                s => s.leadName === pitch.leadName || s.businessName === pitch.businessName
                              );
                              const scData = match || {
                                leadName: pitch.leadName,
                                businessName: pitch.businessName,
                                duration: pitch.duration,
                                outcome: pitch.outcome,
                                discoveryAnswered: 7,
                                objectionsHandled: pitch.objectionsHandled || 0,
                                coachTipsUsed: 3,
                                savingsPresented: 5200,
                                priceQuoted: pitch.priceQuoted || 0,
                                totalSale: pitch.priceQuoted || 0,
                                totalSlides: 35,
                                slidesPresented: 30,
                                flowScore: pitch.scriptAdherence || 82,
                                callNotes: '',
                                products: pitch.outcome === 'closed' ? [
                                  { name: 'Core Accounting Package', price: 2949, terms: '2-pay' },
                                ] : [],
                                scorecard: {
                                  flowScore: pitch.scriptAdherence || 82,
                                  flowChecklist: [
                                    { label: 'Followed recommended slide path', status: 'pass' },
                                    { label: 'Covered all required sections', status: 'pass' },
                                    { label: 'Used the tax calculator', status: pitch.scriptAdherence >= 85 ? 'pass' : 'fail' },
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
                            className={`px-3 py-1.5 rounded-lg ${t.btnBg} border ${t.border} ${t.btnText} text-xs font-medium ${t.btnHover} hover:border-orange-500/30 hover:text-orange-400 transition-all duration-200`}
                          >
                            Scorecard
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* ────────── AI INSIGHTS ────────── */}
        <section className="pb-8">
          <h2 className={`${t.text} text-lg font-bold tracking-tight mb-4 flex items-center gap-2`}>
            <span className="w-[3px] h-5 rounded-full bg-orange-500 inline-block" />
            AI INSIGHTS
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="rounded-2xl p-[1.5px]"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6, #3B82F6, #F97316, #8B5CF6)',
              backgroundSize: '300% 300%',
              animation: 'gradient-shift 6s ease infinite',
            }}
          >
            <div
              className={`rounded-2xl p-5 space-y-4 ${t.shadow}`}
              style={{ backgroundColor: t.insightsBg }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                  <Sparkles size={18} className="text-purple-400" />
                </div>
                <h3 className={`${t.text} text-base font-bold`}>AI Insights</h3>
              </div>

              {insights.length === 0 ? (
                <p className={`${t.textDim} text-sm`}>No insights available for this rep.</p>
              ) : (
                <ul className="space-y-3">
                  {insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                      <span className={`text-sm leading-relaxed ${getInsightColor(insight)}`}>
                        {insight}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </section>

      </main>

      {/* Scorecard overlay */}
      <PostCallScorecard
        show={!!scorecardSession}
        sessionData={scorecardSession}
        onDone={() => setScorecardSession(null)}
      />

      {/* Gradient animation keyframes */}
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
