import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUp, ArrowDown, Users, DollarSign, Clock, TrendingUp,
  AlertTriangle, Check, Activity, Brain, ChevronRight, Minus,
} from 'lucide-react';
import {
  managers, allReps, completedSessionsWithScorecard,
  liveFeedEvents, revenueData, floorStatus, aiDailyBriefing,
} from '../data/sampleData';
import { getConversionFunnel, getObjectionBreakdown } from '../lib/analytics';

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

function TrendArrow({ value }) {
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
    <span className="flex items-center gap-0.5 text-white/40 font-mono text-sm">
      <Minus size={14} />0%
    </span>
  );
}

// ---------------------------------------------------------------------------
// Section A: Live Floor Status Bar
// ---------------------------------------------------------------------------
function FloorStatusBar() {
  const { repsOnCalls, totalReps, byStage } = floorStatus;
  return (
    <div
      className="w-full px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2"
      style={{ backgroundColor: '#12121a' }}
    >
      <div className="flex items-center gap-3">
        <Activity size={16} className="text-emerald-400" />
        <span className="text-white/50 text-sm font-medium">
          <span className="text-emerald-400 font-mono text-2xl font-bold mr-1">{repsOnCalls}</span>
          <span className="text-white/40">reps on calls</span>
          <span className="text-white/20 mx-2">/</span>
          <span className="text-white/30 font-mono">{totalReps}</span>
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(byStage).map(([stage, count]) => (
          <span
            key={stage}
            className="text-xs font-medium px-2.5 py-1 rounded-full border border-white/10 text-white/50"
          >
            <span className="text-white/70 font-mono mr-1">{count}</span>
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
function DailyPacingWidgets() {
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
    { label: 'Completed', value: completed.toLocaleString(), sub: `of ${total.toLocaleString()}`, pct: completedPct, color: '#10b981', ring: 'border-emerald-500/30' },
    { label: 'Remaining', value: remaining.toLocaleString(), sub: 'appointments', pct: Math.round((remaining / total) * 100), color: '#3b82f6', ring: 'border-blue-500/30' },
    { label: 'No-Shows', value: noShows.toString(), sub: `${noShowPct}%`, pct: parseFloat(noShowPct), color: '#f59e0b', ring: 'border-amber-500/30' },
    { label: 'Projected EOD', value: projected.toLocaleString(), sub: `${projectedPct}% completion`, pct: parseFloat(projectedPct), color: '#8b5cf6', ring: 'border-purple-500/30' },
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
            className={`bg-[#12121a] border ${w.ring} rounded-lg p-4 relative overflow-hidden`}
          >
            {/* Background arc */}
            <div className="absolute top-0 right-0 w-16 h-16 opacity-10" style={{
              background: `conic-gradient(${w.color} ${Math.min(w.pct, 100) * 3.6}deg, transparent 0deg)`,
              borderRadius: '0 8px 0 50%',
            }} />
            <div className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: `${w.color}99` }}>
              {w.label}
            </div>
            <div className="text-2xl font-black font-mono text-white leading-none">{w.value}</div>
            <div className="text-[11px] text-white/30 mt-1">{w.sub}</div>
            {/* Mini progress bar */}
            <div className="w-full h-1 rounded-full bg-white/5 mt-2 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(w.pct, 100)}%`, backgroundColor: w.color }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Timeline bar */}
      <div>
        <div className="relative w-full h-5 rounded bg-white/5 overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full rounded-l transition-all duration-700"
            style={{ width: `${completedPct}%`, background: 'linear-gradient(90deg, #059669, #10b981)' }}
          />
          <div
            className="absolute top-0 h-full w-0.5 bg-white/60 z-10"
            style={{ left: `${elapsedPct}%` }}
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-white/50 font-mono whitespace-nowrap">NOW</div>
          </div>
        </div>
        <div className="relative w-full h-4 mt-0.5">
          {hours.map(({ h, label, pct }) => (
            <span key={h} className="absolute text-[10px] text-white/20 font-mono -translate-x-1/2" style={{ left: `${pct}%` }}>
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
function RevenueScoreboard() {
  const periods = [
    { key: 'today', label: 'TODAY' },
    { key: 'week', label: 'THIS WEEK' },
    { key: 'month', label: 'THIS MONTH' },
    { key: 'quarter', label: 'THIS QUARTER' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 sm:px-6">
      {periods.map(({ key, label }) => {
        const d = revenueData[key];
        const hasTarget = !!d.target;
        const progressPct = hasTarget ? Math.round((d.amount / d.target) * 100) : null;
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: periods.findIndex(p => p.key === key) * 0.08 }}
            className="bg-[#12121a] border border-white/5 rounded-lg p-4"
          >
            <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">
              {label}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white leading-none mb-1">
              {formatFullCurrency(d.amount)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-white/40 font-mono">{d.deals} deals</span>
              <TrendArrow value={d.trend} />
            </div>
            {hasTarget && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-white/30 mb-1">
                  <span>{progressPct}% to {formatCurrency(d.target)}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
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
function FloorMap() {
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
    return 'bg-white/15';
  }

  function handleMouseEnter(e, rep) {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
    setHoveredRep(rep);
  }

  return (
    <div className="relative">
      <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3">
        Floor Map <span className="text-white/15 ml-2">170 reps</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {allReps.map((rep) => (
          <div
            key={rep.id}
            className={`w-3 h-3 rounded-full cursor-pointer transition-all hover:scale-150 hover:ring-1 hover:ring-white/30 ${getDotColor(rep)}`}
            onMouseEnter={(e) => handleMouseEnter(e, rep)}
            onMouseLeave={() => setHoveredRep(null)}
            onClick={() => navigate(`/manager/live/${rep.id}`)}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[10px] text-white/30">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> On pace</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Behind</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Critical</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Just closed</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/15 inline-block" /> Idle</span>
      </div>

      {/* Tooltip */}
      {hoveredRep && (
        <div
          className="fixed z-50 pointer-events-none bg-[#1a1a24] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="text-white font-semibold">{hoveredRep.name}</div>
          {hoveredRep.status === 'on_call' && (
            <>
              <div className="text-white/40 mt-0.5">{hoveredRep.leadName}</div>
              <div className="text-white/30 mt-0.5">
                Slide {hoveredRep.currentSlide}/{hoveredRep.totalSlides} &middot; {formatDuration(hoveredRep.callDuration)}
              </div>
              <div className="text-white/30">{hoveredRep.stage}</div>
            </>
          )}
          {hoveredRep.status === 'just_closed' && (
            <div className="text-emerald-400 mt-0.5">
              Closed {hoveredRep.lastClose} &mdash; {formatFullCurrency(hoveredRep.closedAmount)}
            </div>
          )}
          {hoveredRep.status === 'idle' && (
            <div className="text-white/30 mt-0.5">Idle</div>
          )}
          {hoveredRep.status === 'break' && (
            <div className="text-white/30 mt-0.5">On break</div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section E, Column 1: Manager Leaderboard
// ---------------------------------------------------------------------------
function ManagerLeaderboard() {
  const navigate = useNavigate();
  const sorted = useMemo(() =>
    [...managers].sort((a, b) => b.revenue - a.revenue),
    []
  );

  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3">
        Manager Leaderboard
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-white/30 text-[10px] uppercase tracking-wider">
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
            {sorted.map((mgr, i) => (
              <tr
                key={mgr.id}
                className="border-t border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => navigate(`/manager/rep/${mgr.id}`)}
              >
                <td className="py-1.5 pr-2 text-white/20 font-mono">{i + 1}</td>
                <td className="py-1.5 pr-2 text-white/70 font-medium truncate max-w-[110px]">{mgr.name}</td>
                <td className="py-1.5 pr-2 text-right text-white/40 font-mono">{mgr.reps}</td>
                <td className="py-1.5 pr-2 text-right text-white/40 font-mono">{mgr.activeCalls}</td>
                <td className="py-1.5 pr-2 text-right text-emerald-400 font-mono">{mgr.closedToday}</td>
                <td className="py-1.5 pr-2 text-right font-mono" style={{ color: mgr.closeRate >= 35 ? '#10b981' : mgr.closeRate >= 30 ? '#f59e0b' : '#ef4444' }}>
                  {mgr.closeRate}%
                </td>
                <td className="py-1.5 pr-2 text-right text-white/70 font-mono">{formatFullCurrency(mgr.revenue)}</td>
                <td className="py-1.5 text-right text-white/40 font-mono">
                  {mgr.appointmentsDone}/{mgr.appointmentsTotal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section E, Column 2: Conversion Funnel
// ---------------------------------------------------------------------------
function ConversionFunnel() {
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
      <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3">
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
                <span className="text-xs text-white/60">{stage.name}</span>
                <span className={`text-xs font-mono ${isLargeDrop ? 'text-red-400' : 'text-white/40'}`}>
                  {stage.pct}%
                  {drop > 0 && (
                    <span className={`ml-1.5 text-[10px] ${isLargeDrop ? 'text-red-400' : 'text-white/20'}`}>
                      (-{drop})
                    </span>
                  )}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${stage.pct}%`,
                    background: isLargeDrop
                      ? 'linear-gradient(90deg, #ef4444, #f87171)'
                      : stage.pct <= 40
                      ? '#ef4444'
                      : 'linear-gradient(90deg, #059669, #10b981)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-2">
          <Brain size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/70 leading-relaxed">
            <span className="font-bold text-amber-300">INSIGHT:</span> Reps who use the calculator before pricing convert at <span className="font-mono text-amber-300">44%</span>. Reps who skip it convert at <span className="font-mono text-amber-300">22%</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section E, Column 3: Rest-of-Day Simulator
// ---------------------------------------------------------------------------
function RestOfDaySimulator() {
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
      <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3">
        Rest-of-Day Simulator
      </div>

      {/* Current pace snapshot */}
      <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 mb-4">
        <div className="text-[10px] uppercase tracking-wider text-white/30 font-bold mb-2">At Current Pace ({currentCloseRate}%)</div>
        <div className="flex items-baseline justify-between">
          <span className="text-white/50 text-xs">End-of-day revenue</span>
          <span className="text-white/70 font-mono text-lg font-bold">{formatFullCurrency(currentPaceEOD)}</span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-white/50 text-xs">Total closes</span>
          <span className="text-white/50 font-mono">{currentPaceTotalCloses}</span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-white/50 text-xs">Remaining appointments</span>
          <span className="text-white/40 font-mono">{remaining}</span>
        </div>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-white/50">What if we close at...</label>
          <span className="text-sm font-mono text-brand-orange font-bold">{simCloseRate}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={60}
          value={simCloseRate}
          onChange={(e) => setSimCloseRate(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-white/10 accent-orange-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-white/15 font-mono mt-0.5">
          <span>10%</span>
          <span>60%</span>
        </div>
      </div>

      {/* Simulated outcome */}
      <div className="p-3 rounded-lg border border-brand-orange/20 bg-brand-orange/5">
        <div className="text-[10px] uppercase tracking-wider text-brand-orange/60 font-bold mb-2">
          Closing at {simCloseRate}% for the rest of the day
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-white/60 text-xs">End-of-day revenue</span>
          <span className="text-white font-mono text-xl font-black">{formatFullCurrency(simEOD)}</span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-white/60 text-xs">Total closes</span>
          <span className="text-white/70 font-mono font-semibold">{simTotalCloses}</span>
        </div>
      </div>

      {/* Delta */}
      {simCloseRate !== currentCloseRate && (
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-white/30">vs. current pace</span>
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
function LiveFeed() {
  const eventConfig = {
    close: { icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    progress: { icon: ChevronRight, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    new: { icon: Users, color: 'text-white/60', bg: 'bg-white/5' },
    insight: { icon: Brain, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  };

  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3">
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
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-white/5 transition-colors"
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                <Icon size={11} className={cfg.color} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-white/60 leading-snug">{event.text}</p>
                <span className="text-[10px] text-white/20 font-mono">{event.time}</span>
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
function AIDailyBriefing() {
  return (
    <div className="px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-[#12121a] border border-purple-500/15 rounded-lg p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <Brain size={18} className="text-purple-400" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-purple-400/60 font-bold mb-1.5">
              AI Daily Briefing
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
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
  const [currentTime, setCurrentTime] = useState(new Date());

  // Tick clock every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0f' }}>
      {/* ===== TOP HEADER ===== */}
      <div className="w-full px-4 sm:px-6 py-3 flex items-center justify-between border-b border-white/5" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black tracking-tight select-none">
            <span className="text-white/50">1-800-</span>
            <span style={{ color: '#F47920' }}>CLOSER</span>
          </h1>
          <span className="text-[10px] uppercase tracking-widest text-white/20 font-bold ml-2 hidden sm:inline">
            Executive Command Center
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/20 font-mono">
            {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </span>
          <button
            onClick={() => navigate('/')}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* ===== SECTION A: FLOOR STATUS BAR ===== */}
      <FloorStatusBar />

      {/* ===== AI BRIEFING (TOP) ===== */}
      <div className="mt-2 mb-2">
        <AIDailyBriefing />
      </div>

      {/* ===== DAILY PACING WIDGETS ===== */}
      <DailyPacingWidgets />

      {/* ===== REVENUE SCOREBOARD ===== */}
      <div className="mb-4">
        <RevenueScoreboard />
      </div>

      {/* ===== THREE COLUMNS: LEADERBOARD + FUNNEL + SIMULATOR ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 sm:px-6 mb-4">
        <div className="bg-[#12121a] border border-white/5 rounded-lg p-4">
          <ManagerLeaderboard />
        </div>
        <div className="bg-[#12121a] border border-white/5 rounded-lg p-4">
          <ConversionFunnel />
        </div>
        <div className="bg-[#12121a] border border-white/5 rounded-lg p-4">
          <RestOfDaySimulator />
        </div>
      </div>

      {/* ===== FLOOR MAP + LIVE FEED (BOTTOM) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 sm:px-6 mb-6">
        <div className="lg:col-span-2 bg-[#12121a] border border-white/5 rounded-lg p-4">
          <FloorMap />
        </div>
        <div className="bg-[#12121a] border border-white/5 rounded-lg p-4">
          <LiveFeed />
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-white/10 text-xs pb-6">
        1-800Accountant &middot; Executive Dashboard &middot; Internal Use Only
      </p>
    </div>
  );
}
