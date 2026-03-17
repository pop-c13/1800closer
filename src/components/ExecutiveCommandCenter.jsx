import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUp, ArrowDown, Users, DollarSign, Clock, TrendingUp,
  AlertTriangle, Check, Activity, Brain, ChevronRight, Minus,
  Sun, Moon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  managers, allReps, completedSessionsWithScorecard,
  liveFeedEvents, revenueData, floorStatus, aiDailyBriefing,
} from '../data/sampleData';
import { getConversionFunnel, getObjectionBreakdown } from '../lib/analytics';

// ---------------------------------------------------------------------------
// Theme System
// ---------------------------------------------------------------------------
function useTheme(isDark) {
  return isDark ? {
    bg: '#0a0a0f',
    cardBg: '#12121a',
    headerBg: '#0a0a0f',
    text: 'text-white',
    textMuted: 'text-white/70',
    textDim: 'text-white/40',
    textFaint: 'text-white/20',
    border: 'border-white/5',
    borderMed: 'border-white/10',
    cardShadow: 'shadow-xl shadow-black/30',
    hoverBg: 'hover:bg-white/5',
    inputBg: 'bg-white/10',
    progressBg: 'bg-white/5',
    tooltipBg: 'bg-[#1a1a24]',
  } : {
    bg: '#f4f5f9',
    cardBg: '#ffffff',
    headerBg: '#ffffff',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    textDim: 'text-gray-400',
    textFaint: 'text-gray-300',
    border: 'border-gray-200',
    borderMed: 'border-gray-200',
    cardShadow: 'shadow-md shadow-gray-200/50',
    hoverBg: 'hover:bg-gray-50',
    inputBg: 'bg-gray-100',
    progressBg: 'bg-gray-200',
    tooltipBg: 'bg-white',
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCurrency(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function formatFullCurrency(n) {
  return `$${n.toLocaleString()}`;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TrendArrow({ value, isDark }) {
  const t = useTheme(isDark);
  if (value > 0) {
    return (
      <span className="flex items-center gap-0.5 text-emerald-400 font-mono text-sm">
        <ArrowUp size={14} />+{value}%
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="flex items-center gap-0.5 text-red-400 font-mono text-sm">
        <ArrowDown size={14} />{value}%
      </span>
    );
  }
  return (
    <span className={`flex items-center gap-0.5 ${t.textDim} font-mono text-sm`}>
      <Minus size={14} />0%
    </span>
  );
}

// ---------------------------------------------------------------------------
// Shimmer animation CSS (injected once)
// ---------------------------------------------------------------------------
const shimmerStyle = `
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes feedSlideIn {
  from { opacity: 0; transform: translateX(12px); }
  to { opacity: 1; transform: translateX(0); }
}
.shimmer-bar {
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: shimmer 2.5s ease-in-out infinite;
}
.shimmer-bar-light {
  background: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.04) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: shimmer 2.5s ease-in-out infinite;
}
.ai-label-shimmer {
  background: linear-gradient(90deg, #a78bfa, #818cf8, #a78bfa);
  background-size: 200% 100%;
  animation: gradientShift 3s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.feed-enter {
  animation: feedSlideIn 0.3s ease-out forwards;
}
input[type="range"].custom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #f97316;
  border: 2px solid #fff;
  box-shadow: 0 0 8px rgba(249,115,22,0.5);
  cursor: pointer;
  margin-top: -5px;
}
input[type="range"].custom-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #f97316;
  border: 2px solid #fff;
  box-shadow: 0 0 8px rgba(249,115,22,0.5);
  cursor: pointer;
}
input[type="range"].custom-slider::-webkit-slider-runnable-track {
  height: 8px;
  border-radius: 9999px;
}
input[type="range"].custom-slider::-moz-range-track {
  height: 8px;
  border-radius: 9999px;
}
`;

// ---------------------------------------------------------------------------
// Section A: Live Floor Status Bar
// ---------------------------------------------------------------------------
function FloorStatusBar({ isDark }) {
  const t = useTheme(isDark);
  const { repsOnCalls, totalReps, byStage } = floorStatus;
  return (
    <div
      className={`w-full px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 transition-colors duration-200`}
      style={{ backgroundColor: t.cardBg }}
    >
      <div className="flex items-center gap-3">
        <Activity size={16} className="text-emerald-400" />
        <span className={`${t.textDim} text-sm font-medium`}>
          <span className="text-emerald-400 font-mono text-2xl font-bold mr-1">{repsOnCalls}</span>
          <span className={t.textDim}>reps on calls</span>
          <span className={`${t.textFaint} mx-2`}>/</span>
          <span className={`${t.textFaint} font-mono`}>{totalReps}</span>
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(byStage).map(([stage, count]) => (
          <span
            key={stage}
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${t.borderMed} ${t.textDim}`}
          >
            <span className={`${t.textMuted} font-mono mr-1`}>{count}</span>
            {stage}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section B: Daily Pacing Widgets
// ---------------------------------------------------------------------------
function DailyPacingWidgets({ isDark }) {
  const t = useTheme(isDark);
  const { completed, total, noShows, projected, startHour, endHour, currentHour } = floorStatus.dailyPacing;
  const remaining = total - completed - noShows;
  const completedPct = Math.round((completed / total) * 100);
  const noShowPct = ((noShows / total) * 100).toFixed(1);
  const projectedPct = ((projected / total) * 100).toFixed(1);
  const totalHours = endHour - startHour;
  const elapsedPct = Math.min(((currentHour - startHour) / totalHours) * 100, 100);

  // Hour labels for the timeline
  const hours = [];
  for (let h = startHour; h <= endHour; h += 2) {
    const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
    hours.push({ h, label, pct: ((h - startHour) / totalHours) * 100 });
  }

  const widgets = [
    { label: 'Completed', value: completed.toLocaleString(), sub: `of ${total.toLocaleString()}`, pct: completedPct, color: '#10b981', ring: 'border-emerald-500/30', borderLight: '#10b981' },
    { label: 'Remaining', value: remaining.toLocaleString(), sub: 'appointments', pct: Math.round((remaining / total) * 100), color: '#3b82f6', ring: 'border-blue-500/30', borderLight: '#3b82f6' },
    { label: 'No-Shows', value: noShows.toString(), sub: `${noShowPct}%`, pct: parseFloat(noShowPct), color: '#f59e0b', ring: 'border-amber-500/30', borderLight: '#f59e0b' },
    { label: 'Projected EOD', value: projected.toLocaleString(), sub: `${projectedPct}% completion`, pct: parseFloat(projectedPct), color: '#8b5cf6', ring: 'border-purple-500/30', borderLight: '#8b5cf6' },
  ];

  return (
    <div className="px-4 sm:px-6 py-4 space-y-4">
      {/* Widget cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {widgets.map((w, i) => (
          <motion.div
            key={w.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className={`${isDark ? `border ${w.ring}` : 'border'} rounded-2xl p-4 relative overflow-hidden transition-colors duration-200 ${isDark ? 'backdrop-blur-sm' : ''} ${t.cardShadow}`}
            style={{
              backgroundColor: isDark ? 'rgba(18,18,26,0.8)' : '#ffffff',
              borderLeftColor: isDark ? undefined : w.borderLight,
              borderLeftWidth: isDark ? undefined : '3px',
            }}
          >
            {/* Background arc */}
            <div className="absolute top-0 right-0 w-16 h-16 opacity-10" style={{
              background: `conic-gradient(${w.color} ${Math.min(w.pct, 100) * 3.6}deg, transparent 0deg)`,
              borderRadius: '0 8px 0 50%',
            }} />
            <div className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: `${w.color}99` }}>
              {w.label}
            </div>
            <div className={`text-2xl font-black font-mono ${t.text} leading-none`}>{w.value}</div>
            <div className={`text-[11px] ${t.textFaint} mt-1`}>{w.sub}</div>
            {/* Mini progress bar */}
            <div className={`w-full h-1 rounded-full ${t.progressBg} mt-2 overflow-hidden`}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(w.pct, 100)}%`, backgroundColor: w.color }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Timeline bar */}
      <div>
        <div className={`relative w-full h-5 rounded ${t.progressBg} overflow-hidden`}>
          <div
            className="absolute top-0 left-0 h-full rounded-l transition-all duration-700"
            style={{ width: `${completedPct}%`, background: 'linear-gradient(90deg, #059669, #10b981)' }}
          />
          <div
            className={`absolute top-0 h-full w-0.5 ${isDark ? 'bg-white/60' : 'bg-gray-700'} z-10`}
            style={{ left: `${elapsedPct}%` }}
          >
            <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] ${t.textDim} font-mono whitespace-nowrap`}>NOW</div>
          </div>
        </div>
        <div className="relative w-full h-4 mt-0.5">
          {hours.map(({ h, label, pct }) => (
            <span key={h} className={`absolute text-[10px] ${t.textFaint} font-mono -translate-x-1/2`} style={{ left: `${pct}%` }}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section C: Revenue Scoreboard
// ---------------------------------------------------------------------------
function RevenueScoreboard({ isDark }) {
  const t = useTheme(isDark);
  const periods = [
    { key: 'today', label: 'TODAY', accent: '#10b981' },
    { key: 'week', label: 'THIS WEEK', accent: '#3b82f6' },
    { key: 'month', label: 'THIS MONTH', accent: '#f59e0b' },
    { key: 'quarter', label: 'THIS QUARTER', accent: '#8b5cf6' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 sm:px-6">
      {periods.map(({ key, label, accent }) => {
        const d = revenueData[key];
        const hasTarget = !!d.target;
        const progressPct = hasTarget ? Math.round((d.amount / d.target) * 100) : null;
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: periods.findIndex(p => p.key === key) * 0.08 }}
            className={`${t.border} ${t.cardShadow} rounded-2xl p-4 relative overflow-hidden transition-colors duration-200`}
            style={{ backgroundColor: t.cardBg }}
          >
            {/* Top gradient border accent */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: isDark
                  ? `linear-gradient(90deg, transparent, ${accent}, transparent)`
                  : accent,
              }}
            />
            <div className={`text-[10px] uppercase tracking-widest ${t.textFaint} font-bold mb-2`}>
              {label}
            </div>
            <div className={`text-2xl sm:text-3xl font-black font-mono ${t.text} leading-none mb-1`}>
              {formatFullCurrency(d.amount)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${t.textDim} font-mono`}>{d.deals} deals</span>
              <TrendArrow value={d.trend} isDark={isDark} />
            </div>
            {hasTarget && (
              <div className="mt-3">
                <div className={`flex items-center justify-between text-[10px] ${t.textFaint} mb-1`}>
                  <span>{progressPct}% to {formatCurrency(d.target)}</span>
                </div>
                <div className={`w-full h-1.5 rounded-full ${t.progressBg} overflow-hidden`}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(progressPct, 100)}%`,
                      background: progressPct >= 80 ? '#10b981' : progressPct >= 60 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section D: Floor Map
// ---------------------------------------------------------------------------
function FloorMap({ isDark }) {
  const t = useTheme(isDark);
  const navigate = useNavigate();
  const [hoveredRep, setHoveredRep] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  function getDotColor(rep) {
    if (rep.status === 'just_closed') return 'bg-blue-400 animate-pulse';
    if (rep.status === 'on_call') {
      if (rep.pacing === 'critical' || (rep.callDuration && rep.callDuration > 1800)) return 'bg-red-500';
      if (rep.pacing === 'behind') return 'bg-amber-400';
      return 'bg-emerald-400';
    }
    return isDark ? 'bg-white/15' : 'bg-gray-300';
  }

  function getDotGlow(rep) {
    if (rep.status === 'just_closed') return '0 0 6px rgba(96,165,250,0.4)';
    if (rep.status === 'on_call') {
      if (rep.pacing === 'critical' || (rep.callDuration && rep.callDuration > 1800)) return '0 0 6px rgba(239,68,68,0.4)';
      if (rep.pacing === 'behind') return '0 0 6px rgba(245,158,11,0.4)';
      return '0 0 6px rgba(16,185,129,0.4)';
    }
    return 'none';
  }

  function handleMouseEnter(e, rep) {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
    setHoveredRep(rep);
  }

  return (
    <div className="relative">
      <div className={`text-[10px] uppercase tracking-widest ${t.textFaint} font-bold mb-3`}>
        Floor Map <span className={`${t.textFaint} ml-2`}>170 reps</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {allReps.map((rep) => (
          <div
            key={rep.id}
            className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-200 hover:scale-150 hover:ring-1 ${isDark ? 'hover:ring-white/30' : 'hover:ring-gray-400'} ${getDotColor(rep)}`}
            style={{ boxShadow: getDotGlow(rep) }}
            onMouseEnter={(e) => handleMouseEnter(e, rep)}
            onMouseLeave={() => setHoveredRep(null)}
            onClick={() => navigate(`/manager/live/${rep.id}`)}
          />
        ))}
      </div>
      {/* Legend */}
      <div className={`flex items-center gap-4 mt-3 text-[10px] ${t.textFaint}`}>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.4)' }} /> On pace</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" style={{ boxShadow: '0 0 6px rgba(245,158,11,0.4)' }} /> Behind</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" style={{ boxShadow: '0 0 6px rgba(239,68,68,0.4)' }} /> Critical</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" style={{ boxShadow: '0 0 6px rgba(96,165,250,0.4)' }} /> Just closed</span>
        <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${isDark ? 'bg-white/15' : 'bg-gray-300'} inline-block`} /> Idle</span>
      </div>

      {/* Tooltip */}
      {hoveredRep && (
        <div
          className={`fixed z-50 pointer-events-none ${t.tooltipBg} border ${t.borderMed} rounded-2xl px-3 py-2 text-xs ${t.cardShadow}`}
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className={`${t.text} font-semibold`}>{hoveredRep.name}</div>
          {hoveredRep.status === 'on_call' && (
            <>
              <div className={`${t.textDim} mt-0.5`}>{hoveredRep.leadName}</div>
              <div className={`${t.textFaint} mt-0.5`}>
                Slide {hoveredRep.currentSlide}/{hoveredRep.totalSlides} &middot; {formatDuration(hoveredRep.callDuration)}
              </div>
              <div className={t.textFaint}>{hoveredRep.stage}</div>
            </>
          )}
          {hoveredRep.status === 'just_closed' && (
            <div className="text-emerald-400 mt-0.5">
              Closed {hoveredRep.lastClose} &mdash; {formatFullCurrency(hoveredRep.closedAmount)}
            </div>
          )}
          {hoveredRep.status === 'idle' && (
            <div className={`${t.textFaint} mt-0.5`}>Idle</div>
          )}
          {hoveredRep.status === 'break' && (
            <div className={`${t.textFaint} mt-0.5`}>On break</div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section E, Column 1: Manager Leaderboard
// ---------------------------------------------------------------------------
function ManagerLeaderboard({ isDark }) {
  const t = useTheme(isDark);
  const navigate = useNavigate();
  const sorted = useMemo(() =>
    [...managers].sort((a, b) => b.revenue - a.revenue),
    []
  );

  const rankBadge = (i) => {
    const badges = [
      { bg: 'bg-amber-400/20', text: 'text-amber-400', border: 'border-amber-400/30', icon: '🥇' },
      { bg: 'bg-gray-300/20', text: 'text-gray-400', border: 'border-gray-400/30', icon: '🥈' },
      { bg: 'bg-orange-400/20', text: 'text-orange-400', border: 'border-orange-400/30', icon: '🥉' },
    ];
    if (i < 3) return badges[i];
    return null;
  };

  return (
    <div>
      <div className={`text-[10px] uppercase tracking-widest ${t.textFaint} font-bold mb-3`}>
        Manager Leaderboard
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className={`${t.textFaint} text-[10px] uppercase tracking-wider`}>
              <th className="text-left pb-2 pr-2">#</th>
              <th className="text-left pb-2 pr-2">Manager</th>
              <th className="text-right pb-2 pr-2">Reps</th>
              <th className="text-right pb-2 pr-2">Active</th>
              <th className="text-right pb-2 pr-2">Closed</th>
              <th className="text-right pb-2 pr-2">Close%</th>
              <th className="text-right pb-2 pr-2">Revenue</th>
              <th className="text-right pb-2">Appts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((mgr, i) => {
              const badge = rankBadge(i);
              return (
                <tr
                  key={mgr.id}
                  className={`border-t ${t.border} ${t.hoverBg} cursor-pointer transition-colors duration-200`}
                  style={{
                    backgroundColor: !isDark && i % 2 === 1 ? '#f9fafb' : undefined,
                  }}
                  onClick={() => navigate(`/manager/rep/${mgr.id}`)}
                >
                  <td className="py-1.5 pr-2 font-mono">
                    {badge ? (
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text} border ${badge.border}`}>
                        {i + 1}
                      </span>
                    ) : (
                      <span className={t.textFaint}>{i + 1}</span>
                    )}
                  </td>
                  <td className={`py-1.5 pr-2 ${t.textMuted} font-medium truncate max-w-[110px]`}>{mgr.name}</td>
                  <td className={`py-1.5 pr-2 text-right ${t.textDim} font-mono`}>{mgr.reps}</td>
                  <td className={`py-1.5 pr-2 text-right ${t.textDim} font-mono`}>{mgr.activeCalls}</td>
                  <td className="py-1.5 pr-2 text-right text-emerald-400 font-mono">{mgr.closedToday}</td>
                  <td className="py-1.5 pr-2 text-right font-mono" style={{ color: mgr.closeRate >= 35 ? '#10b981' : mgr.closeRate >= 30 ? '#f59e0b' : '#ef4444' }}>
                    {mgr.closeRate}%
                  </td>
                  <td className={`py-1.5 pr-2 text-right ${t.textMuted} font-mono`}>{formatFullCurrency(mgr.revenue)}</td>
                  <td className={`py-1.5 text-right ${t.textDim} font-mono`}>
                    {mgr.appointmentsDone}/{mgr.appointmentsTotal}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section E, Column 2: Conversion Funnel
// ---------------------------------------------------------------------------
function ConversionFunnel({ isDark }) {
  const t = useTheme(isDark);
  const [funnel, setFunnel] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await getConversionFunnel();
      setFunnel(data);
    }
    load();
  }, []);

  if (!funnel) return null;

  const stages = funnel.stages || [
    { name: 'Discovery', pct: 100 },
    { name: 'Deductions', pct: 94 },
    { name: 'Structure', pct: 89 },
    { name: 'Pricing', pct: 76 },
    { name: 'Close', pct: 36 },
  ];

  return (
    <div>
      <div className={`text-[10px] uppercase tracking-widest ${t.textFaint} font-bold mb-3`}>
        Where We Lose Them
      </div>
      <div className="space-y-2.5">
        {stages.map((stage, i) => {
          const prev = i > 0 ? stages[i - 1].pct : 100;
          const drop = prev - stage.pct;
          const isLargeDrop = drop > 10;

          return (
            <div key={stage.name}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{stage.name}</span>
                <span className={`text-xs font-mono ${isLargeDrop ? 'text-red-400' : t.textDim}`}>
                  {stage.pct}%
                  {drop > 0 && (
                    <span className={`ml-1.5 text-[10px] ${isLargeDrop ? 'text-red-400' : t.textFaint}`}>
                      (-{drop})
                    </span>
                  )}
                </span>
              </div>
              <div className={`w-full h-3 rounded-full ${t.progressBg} overflow-hidden relative`}>
                <div
                  className="h-full rounded-full transition-all duration-700 relative"
                  style={{
                    width: `${stage.pct}%`,
                    background: isLargeDrop
                      ? 'linear-gradient(90deg, #ef4444, #f87171)'
                      : stage.pct <= 40
                      ? '#ef4444'
                      : 'linear-gradient(90deg, #059669, #10b981)',
                  }}
                >
                  {/* Shimmer overlay */}
                  <div className={`absolute inset-0 rounded-full ${isDark ? 'shimmer-bar' : 'shimmer-bar-light'}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className={`mt-4 p-3 rounded-2xl border border-amber-500/20 ${isDark ? 'bg-amber-500/5' : 'bg-amber-50'}`}>
        <div className="flex items-start gap-2">
          <Brain size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className={`text-[11px] ${isDark ? 'text-amber-200/70' : 'text-amber-700'} leading-relaxed`}>
            <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>INSIGHT:</span> Reps who use the calculator before pricing convert at <span className={`font-mono ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>44%</span>. Reps who skip it convert at <span className={`font-mono ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>22%</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section E, Column 3: Rest-of-Day Simulator
// ---------------------------------------------------------------------------
function RestOfDaySimulator({ isDark }) {
  const t = useTheme(isDark);
  const [simCloseRate, setSimCloseRate] = useState(36);

  // Baseline from today's actual data
  const { completed, total, noShows } = floorStatus.dailyPacing;
  const remaining = total - completed - noShows;
  const todayCloses = revenueData.today.deals; // 15
  const todayRevenue = revenueData.today.amount; // $37,485
  const avgDeal = todayCloses > 0 ? Math.round(todayRevenue / todayCloses) : 2497;
  const currentCloseRate = completed > 0 ? Math.round((todayCloses / completed) * 100) : 36;

  // "Current pace" projection
  const currentPaceCloses = Math.round(remaining * (currentCloseRate / 100));
  const currentPaceRevenue = currentPaceCloses * avgDeal;
  const currentPaceEOD = todayRevenue + currentPaceRevenue;
  const currentPaceTotalCloses = todayCloses + currentPaceCloses;

  // "Simulated rate" projection
  const simCloses = Math.round(remaining * (simCloseRate / 100));
  const simRevenue = simCloses * avgDeal;
  const simEOD = todayRevenue + simRevenue;
  const simTotalCloses = todayCloses + simCloses;

  // Delta
  const revenueDelta = simEOD - currentPaceEOD;
  const closesDelta = simTotalCloses - currentPaceTotalCloses;

  return (
    <div>
      <div className={`text-[10px] uppercase tracking-widest ${t.textFaint} font-bold mb-3`}>
        Rest-of-Day Simulator
      </div>

      {/* Current pace snapshot — muted */}
      <div className={`p-3 rounded-2xl border ${t.border} mb-4 transition-colors duration-200`} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb' }}>
        <div className={`text-[10px] uppercase tracking-wider ${t.textFaint} font-bold mb-2`}>At Current Pace ({currentCloseRate}%)</div>
        <div className="flex items-baseline justify-between">
          <span className={`${t.textDim} text-xs`}>End-of-day revenue</span>
          <span className={`${t.textMuted} font-mono text-lg font-bold`}>{formatFullCurrency(currentPaceEOD)}</span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className={`${t.textDim} text-xs`}>Total closes</span>
          <span className={`${t.textDim} font-mono`}>{currentPaceTotalCloses}</span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className={`${t.textDim} text-xs`}>Remaining appointments</span>
          <span className={`${t.textFaint} font-mono`}>{remaining}</span>
        </div>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className={`text-xs ${t.textDim}`}>What if we close at...</label>
          <span className="text-sm font-mono text-brand-orange font-bold">{simCloseRate}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={60}
          value={simCloseRate}
          onChange={(e) => setSimCloseRate(Number(e.target.value))}
          className={`w-full h-2 rounded-full appearance-none cursor-pointer custom-slider ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}
          style={{ accentColor: '#f97316' }}
        />
        <div className={`flex justify-between text-[10px] ${t.textFaint} font-mono mt-0.5`}>
          <span>10%</span>
          <span>60%</span>
        </div>
      </div>

      {/* Simulated outcome — vibrant */}
      <div className="p-3 rounded-2xl border border-brand-orange/30 relative overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(249,115,22,0.08)' : '#fff7ed' }}>
        {/* Vibrant top accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #f97316, #f59e0b)' }} />
        <div className={`text-[10px] uppercase tracking-wider font-bold mb-2 ${isDark ? 'text-brand-orange/70' : 'text-orange-600'}`}>
          Closing at {simCloseRate}% for the rest of the day
        </div>
        <div className="flex items-baseline justify-between">
          <span className={`${isDark ? 'text-white/60' : 'text-gray-600'} text-xs`}>End-of-day revenue</span>
          <span className={`${t.text} font-mono text-xl font-black`}>{formatFullCurrency(simEOD)}</span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className={`${isDark ? 'text-white/60' : 'text-gray-600'} text-xs`}>Total closes</span>
          <span className={`${t.textMuted} font-mono font-semibold`}>{simTotalCloses}</span>
        </div>
      </div>

      {/* Delta */}
      {simCloseRate !== currentCloseRate && (
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className={t.textFaint}>vs. current pace</span>
          <span className={`font-mono font-bold ${revenueDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {revenueDelta >= 0 ? '+' : ''}{formatFullCurrency(revenueDelta)} · {closesDelta >= 0 ? '+' : ''}{closesDelta} closes
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section F: Live Feed
// ---------------------------------------------------------------------------
function LiveFeed({ isDark }) {
  const t = useTheme(isDark);

  const eventConfig = {
    close: { icon: DollarSign, color: 'text-emerald-400', bg: isDark ? 'bg-emerald-400/10' : 'bg-emerald-50', barColor: '#10b981' },
    warning: { icon: AlertTriangle, color: 'text-amber-400', bg: isDark ? 'bg-amber-400/10' : 'bg-amber-50', barColor: '#f59e0b' },
    progress: { icon: ChevronRight, color: 'text-blue-400', bg: isDark ? 'bg-blue-400/10' : 'bg-blue-50', barColor: '#3b82f6' },
    new: { icon: Users, color: isDark ? 'text-white/60' : 'text-gray-500', bg: isDark ? 'bg-white/5' : 'bg-gray-100', barColor: isDark ? '#6b7280' : '#9ca3af' },
    insight: { icon: Brain, color: 'text-purple-400', bg: isDark ? 'bg-purple-400/10' : 'bg-purple-50', barColor: '#a855f7' },
  };

  return (
    <div>
      <div className={`text-[10px] uppercase tracking-widest ${t.textFaint} font-bold mb-3`}>
        Live Feed
      </div>
      <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
        {liveFeedEvents.map((event, i) => {
          const cfg = eventConfig[event.type] || eventConfig.new;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              className={`flex items-start gap-2 py-1.5 px-2 rounded-xl ${t.hoverBg} transition-colors duration-200 relative overflow-hidden`}
            >
              {/* Left color bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
                style={{ backgroundColor: cfg.barColor }}
              />
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ml-1.5 ${cfg.bg}`}>
                <Icon size={11} className={cfg.color} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] ${isDark ? 'text-white/60' : 'text-gray-600'} leading-snug`}>{event.text}</p>
                <span className={`text-[10px] ${t.textFaint} font-mono`}>{event.time}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section G: AI Daily Briefing
// ---------------------------------------------------------------------------
function AIDailyBriefing({ isDark }) {
  const t = useTheme(isDark);
  return (
    <div className="px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className={`rounded-2xl p-5 relative overflow-hidden ${t.cardShadow}`}
        style={{
          backgroundColor: t.cardBg,
          border: '1px solid transparent',
          backgroundClip: 'padding-box',
        }}
      >
        {/* Premium gradient border effect */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            padding: '1px',
            background: 'linear-gradient(135deg, #a855f7, #3b82f6, #a855f7)',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
          }}
        />
        <div className="flex items-start gap-3 relative z-10">
          <div className={`w-8 h-8 rounded-xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'} flex items-center justify-center flex-shrink-0`}>
            <Brain size={18} className="text-purple-400" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold mb-1.5 ai-label-shimmer">
              AI Daily Briefing
            </div>
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'} leading-relaxed`}>
              {aiDailyBriefing}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component: Executive Command Center
// ---------------------------------------------------------------------------
export default function ExecutiveCommandCenter() {
  const navigate = useNavigate();
  const { authUser } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDark, setIsDark] = useState(true);
  const t = useTheme(isDark);

  // Tick clock every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: t.bg }}>
      {/* Inject shimmer / custom styles */}
      <style>{shimmerStyle}</style>

      {/* ===== TOP HEADER ===== */}
      <div className={`w-full px-4 sm:px-6 py-3 flex items-center justify-between border-b ${t.border} transition-colors duration-200`} style={{ backgroundColor: t.headerBg }}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black tracking-tight select-none">
            <span className={isDark ? 'text-white/50' : 'text-gray-400'}>1-800-</span>
            <span style={{ color: '#F47920' }}>CLOSER</span>
          </h1>
          <span className={`text-[10px] uppercase tracking-widest ${t.textFaint} font-bold ml-2 hidden sm:inline`}>
            Executive Command Center
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-xs ${t.textFaint}`}>{authUser?.name || 'Ryan Torres'}</span>
          <span className={`text-xs ${t.textFaint} font-mono`}>
            {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </span>
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/60' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => navigate('/home')}
            className={`text-xs ${isDark ? 'text-white/30 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'} transition-colors duration-200`}
          >
            Exit
          </button>
        </div>
      </div>

      {/* ===== SECTION A: FLOOR STATUS BAR ===== */}
      <FloorStatusBar isDark={isDark} />

      {/* ===== AI BRIEFING (TOP) ===== */}
      <div className="mt-3 mb-3">
        <AIDailyBriefing isDark={isDark} />
      </div>

      {/* ===== DAILY PACING WIDGETS ===== */}
      <DailyPacingWidgets isDark={isDark} />

      {/* ===== REVENUE SCOREBOARD ===== */}
      <div className="mb-5">
        <RevenueScoreboard isDark={isDark} />
      </div>

      {/* ===== THREE COLUMNS: LEADERBOARD + FUNNEL + SIMULATOR ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 px-4 sm:px-6 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={`${t.border} ${t.cardShadow} rounded-2xl p-4 transition-colors duration-200`}
          style={{ backgroundColor: t.cardBg }}
        >
          <ManagerLeaderboard isDark={isDark} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className={`${t.border} ${t.cardShadow} rounded-2xl p-4 transition-colors duration-200`}
          style={{ backgroundColor: t.cardBg }}
        >
          <ConversionFunnel isDark={isDark} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className={`${t.border} ${t.cardShadow} rounded-2xl p-4 transition-colors duration-200`}
          style={{ backgroundColor: t.cardBg }}
        >
          <RestOfDaySimulator isDark={isDark} />
        </motion.div>
      </div>

      {/* ===== FLOOR MAP + LIVE FEED (BOTTOM) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 px-4 sm:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className={`lg:col-span-2 ${t.border} ${t.cardShadow} rounded-2xl p-4 transition-colors duration-200`}
          style={{ backgroundColor: t.cardBg }}
        >
          <FloorMap isDark={isDark} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className={`${t.border} ${t.cardShadow} rounded-2xl p-4 transition-colors duration-200`}
          style={{ backgroundColor: t.cardBg }}
        >
          <LiveFeed isDark={isDark} />
        </motion.div>
      </div>

      {/* Footer */}
      <p className={`text-center ${t.textFaint} text-xs pb-6`}>
        1-800Accountant &middot; Executive Dashboard &middot; Internal Use Only
      </p>
    </div>
  );
}
