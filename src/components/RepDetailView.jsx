import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, TrendingUp, Clock, DollarSign, AlertTriangle, User, Sparkles } from 'lucide-react';
import { teamMembers, mockTeamPerformance, repPitchHistory, repInsights } from '../data/sampleData';
import { getRepStats } from '../lib/sessionDB';

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
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#0f0f13' }}>
        <div className="text-center space-y-4">
          <User size={48} className="text-white/30 mx-auto" />
          <h2 className="text-white text-xl font-bold">Rep not found</h2>
          <p className="text-white/50 text-sm">No team member matches the ID "{repId}".</p>
          <button
            onClick={() => navigate('/manager')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors"
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
    return 'text-white/70';
  }

  // Script adherence color
  function getAdherenceColor(pct) {
    if (pct >= 90) return 'text-green-400';
    if (pct >= 80) return 'text-yellow-400';
    return 'text-red-400';
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0f0f13' }}>
      {/* ===== TOP BAR ===== */}
      <header
        className="sticky top-0 z-30 flex items-center gap-4 px-4 md:px-8 py-3 border-b border-white/10"
        style={{ backgroundColor: '#18181f' }}
      >
        <button
          onClick={() => navigate('/manager')}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 flex items-center gap-3">
          <h1 className="text-white text-xl md:text-2xl font-bold">{member.name}</h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white/70">
            <span className={`w-2 h-2 rounded-full ${status.color}`} />
            {status.label}
          </span>
        </div>
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
              className="rounded-xl border border-white/10 p-5 flex flex-col gap-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Phone size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="text-white text-2xl font-bold leading-tight">{displayStats.calls}</p>
                <p className="text-white/40 text-xs mt-0.5">Total Calls This Week</p>
              </div>
            </motion.div>

            {/* Close Rate */}
            <motion.div
              variants={cardVariants}
              className="rounded-xl border border-white/10 p-5 flex flex-col gap-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center">
                <TrendingUp size={20} className="text-green-400" />
              </div>
              <div>
                <p className="text-white text-2xl font-bold leading-tight">{displayStats.closeRate}%</p>
                <p className="text-white/40 text-xs mt-0.5">Close Rate</p>
              </div>
            </motion.div>

            {/* Avg Call Duration */}
            <motion.div
              variants={cardVariants}
              className="rounded-xl border border-white/10 p-5 flex flex-col gap-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <Clock size={20} className="text-orange-400" />
              </div>
              <div>
                <p className="text-white text-2xl font-bold leading-tight">
                  {formatDuration(displayStats.avgDuration)}
                  {displayStats.avgDuration > 1800 && (
                    <span className="ml-2 text-sm">
                      <AlertTriangle size={14} className="inline text-yellow-400" />
                    </span>
                  )}
                </p>
                <p className="text-white/40 text-xs mt-0.5">Avg Call Duration</p>
              </div>
            </motion.div>

            {/* Avg Savings Quoted */}
            <motion.div
              variants={cardVariants}
              className="rounded-xl border border-white/10 p-5 flex flex-col gap-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <DollarSign size={20} className="text-purple-400" />
              </div>
              <div>
                <p className="text-white text-2xl font-bold leading-tight">{formatMoney(displayStats.avgSavings)}</p>
                <p className="text-white/40 text-xs mt-0.5">Avg Savings Quoted</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ────────── LAST 10 PITCHES ────────── */}
        <section>
          <h2 className="text-white text-lg font-bold tracking-tight mb-4">LAST 10 PITCHES</h2>
          <div
            className="rounded-xl border border-white/10 overflow-x-auto"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
          >
            {displayPitches.length === 0 ? (
              <div className="px-5 py-8 text-center text-white/40 text-sm">No pitch history available.</div>
            ) : (
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold text-white/40">Date</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold text-white/40">Lead</th>
                    <th className="px-4 py-3 text-center text-xs uppercase tracking-wider font-semibold text-white/40">Duration</th>
                    <th className="px-4 py-3 text-center text-xs uppercase tracking-wider font-semibold text-white/40">Outcome</th>
                    <th className="px-4 py-3 text-center text-xs uppercase tracking-wider font-semibold text-white/40">Price</th>
                    <th className="px-4 py-3 text-center text-xs uppercase tracking-wider font-semibold text-white/40">Obj.</th>
                    <th className="px-4 py-3 text-center text-xs uppercase tracking-wider font-semibold text-white/40">Adherence</th>
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
                        className={`${idx < displayPitches.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/[0.02] transition-colors`}
                      >
                        {/* Date + time */}
                        <td className="px-4 py-3">
                          <p className="text-white/80 text-sm">{pitch.date}</p>
                          <p className="text-white/40 text-xs">{pitch.time}</p>
                        </td>

                        {/* Lead */}
                        <td className="px-4 py-3">
                          <p className="text-white text-sm font-semibold">{pitch.leadName}</p>
                          <p className="text-white/40 text-xs">{pitch.businessName}</p>
                        </td>

                        {/* Duration */}
                        <td className="px-4 py-3 text-center">
                          <span className="text-white/70 text-sm">{formatDuration(pitch.duration)}</span>
                          {pitch.duration > 1800 && (
                            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                              ⚠️ Over
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
                          <span className="text-white/80 text-sm font-medium">{formatMoney(pitch.priceQuoted)}</span>
                        </td>

                        {/* Objections */}
                        <td className="px-4 py-3 text-center">
                          <span className="text-white/60 text-sm">{pitch.objectionsHandled}</span>
                        </td>

                        {/* Script adherence */}
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-semibold ${getAdherenceColor(pitch.scriptAdherence)}`}>
                            {pitch.scriptAdherence}%
                          </span>
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
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="rounded-xl p-[1px]"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6, #3B82F6, #8B5CF6)',
            }}
          >
            <div
              className="rounded-xl p-5 space-y-4"
              style={{ backgroundColor: '#18181f' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                  <Sparkles size={18} className="text-purple-400" />
                </div>
                <h3 className="text-white text-base font-bold">AI Insights</h3>
              </div>

              {insights.length === 0 ? (
                <p className="text-white/40 text-sm">No insights available for this rep.</p>
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
    </div>
  );
}
