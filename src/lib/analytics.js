import { supabase, isSupabaseConfigured } from './supabase';

// ---------------------------------------------------------------------------
// Helper: date N days ago as ISO string
// ---------------------------------------------------------------------------
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// getRepPerformance — daily stats for a rep over last N days
// ---------------------------------------------------------------------------
export async function getRepPerformance(repId, days = 30) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('rep_daily_stats')
      .select('*')
      .eq('rep_id', repId)
      .gte('date', daysAgo(days))
      .order('date', { ascending: true });
    if (!error && data?.length) return data;
  }
  // Mock: generate daily stats
  return generateMockDailyStats(days);
}

// ---------------------------------------------------------------------------
// getManagerPerformance — daily stats for a manager's team
// ---------------------------------------------------------------------------
export async function getManagerPerformance(managerId, days = 30) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('manager_daily_stats')
      .select('*')
      .eq('manager_id', managerId)
      .gte('date', daysAgo(days))
      .order('date', { ascending: true });
    if (!error && data?.length) return data;
  }
  return generateMockManagerStats(days);
}

// ---------------------------------------------------------------------------
// getFloorStats — aggregated stats across all reps for a given day
// ---------------------------------------------------------------------------
export async function getFloorStats(date = null) {
  if (isSupabaseConfigured()) {
    const targetDate = date || todayISO().split('T')[0];
    const { data, error } = await supabase
      .from('rep_daily_stats')
      .select('*')
      .eq('date', targetDate);
    if (!error && data?.length) {
      const totalCalls = data.reduce((s, r) => s + (r.calls_completed || 0), 0);
      const totalSales = data.reduce((s, r) => s + (r.sales || 0), 0);
      const totalRevenue = data.reduce((s, r) => s + parseFloat(r.total_revenue || 0), 0);
      const totalOverTime = data.reduce((s, r) => s + (r.calls_over_time || 0), 0);
      return {
        totalReps: data.length,
        totalCalls,
        totalSales,
        totalRevenue,
        closeRate: totalCalls > 0 ? Math.round((totalSales / totalCalls) * 100) : 0,
        avgCallDuration: totalCalls > 0 ? Math.round(data.reduce((s, r) => s + (r.avg_call_duration || 0), 0) / data.length) : 0,
        callsOverTime: totalOverTime,
      };
    }
  }
  return {
    totalReps: 170,
    totalCalls: 387,
    totalSales: 15,
    totalRevenue: 37485,
    closeRate: 36,
    avgCallDuration: 1620,
    callsOverTime: 8,
  };
}

// ---------------------------------------------------------------------------
// getConversionFunnel — funnel from consultations through close
// ---------------------------------------------------------------------------
export async function getConversionFunnel(days = 30) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('sessions')
      .select('slides_presented, outcome, price_quoted, total_slides')
      .gte('created_at', daysAgo(days));
    if (!error && data?.length) {
      const total = data.length;
      const reachedPricing = data.filter(s => (s.slides_presented || 0) >= 22).length;
      const gotQuote = data.filter(s => s.price_quoted).length;
      const closed = data.filter(s => s.outcome === 'closed').length;
      return {
        totalConsultations: total,
        reachedPricing: { count: reachedPricing, pct: Math.round((reachedPricing / total) * 100) },
        gotQuote: { count: gotQuote, pct: Math.round((gotQuote / total) * 100) },
        closed: { count: closed, pct: Math.round((closed / total) * 100) },
      };
    }
  }
  return {
    totalConsultations: 1020,
    reachedPricing: { count: 775, pct: 76 },
    gotQuote: { count: 612, pct: 60 },
    closed: { count: 367, pct: 36 },
    stages: [
      { name: 'Discovery', pct: 100 },
      { name: 'Deductions', pct: 94 },
      { name: 'Structure', pct: 89 },
      { name: 'Pricing', pct: 76 },
      { name: 'Close', pct: 36 },
    ],
  };
}

// ---------------------------------------------------------------------------
// getObjectionBreakdown — counts by type, win rates, competitor mentions
// ---------------------------------------------------------------------------
export async function getObjectionBreakdown(days = 30) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('objection_log')
      .select('*')
      .gte('created_at', daysAgo(days));
    if (!error && data?.length) {
      const byType = {};
      data.forEach(o => {
        if (!byType[o.objection_type]) byType[o.objection_type] = { count: 0, won: 0, competitor: 0 };
        byType[o.objection_type].count++;
        if (o.outcome === 'closed') byType[o.objection_type].won++;
        if (o.competitor_mentioned) byType[o.objection_type].competitor++;
      });
      return Object.entries(byType).map(([type, stats]) => ({
        type,
        count: stats.count,
        winRate: stats.count > 0 ? Math.round((stats.won / stats.count) * 100) : 0,
        competitorMentions: stats.competitor,
        pct: Math.round((stats.count / data.length) * 100),
      })).sort((a, b) => b.count - a.count);
    }
  }
  return [
    { type: 'Too expensive', count: 89, winRate: 28, competitorMentions: 0, pct: 34 },
    { type: 'Need to think', count: 67, winRate: 42, competitorMentions: 0, pct: 26 },
    { type: 'Have accountant', count: 45, winRate: 31, competitorMentions: 45, pct: 17 },
    { type: 'Spouse decides', count: 28, winRate: 38, competitorMentions: 0, pct: 11 },
    { type: 'No revenue yet', count: 18, winRate: 22, competitorMentions: 0, pct: 7 },
    { type: 'Do it myself', count: 14, winRate: 35, competitorMentions: 14, pct: 5 },
  ];
}

// ---------------------------------------------------------------------------
// getDispositionBreakdown — why prospects say no
// ---------------------------------------------------------------------------
export async function getDispositionBreakdown(days = 30) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('disposition_reasons')
      .select('*')
      .gte('created_at', daysAgo(days));
    if (!error && data?.length) {
      const byReason = {};
      data.forEach(d => {
        if (!byReason[d.reason]) byReason[d.reason] = { count: 0, sources: {}, industries: {} };
        byReason[d.reason].count++;
        if (d.lead_source) byReason[d.reason].sources[d.lead_source] = (byReason[d.reason].sources[d.lead_source] || 0) + 1;
        if (d.industry) byReason[d.reason].industries[d.industry] = (byReason[d.reason].industries[d.industry] || 0) + 1;
      });
      return Object.entries(byReason).map(([reason, stats]) => ({
        reason,
        count: stats.count,
        pct: Math.round((stats.count / data.length) * 100),
        topSource: Object.entries(stats.sources).sort((a, b) => b[1] - a[1])[0]?.[0] || '',
        topIndustry: Object.entries(stats.industries).sort((a, b) => b[1] - a[1])[0]?.[0] || '',
      })).sort((a, b) => b.count - a.count);
    }
  }
  return [
    { reason: 'No Money', count: 42, pct: 22, topSource: 'Organic', topIndustry: 'General' },
    { reason: 'Has Accountant', count: 38, pct: 20, topSource: 'LegalZoom', topIndustry: 'Consulting' },
    { reason: 'No Revenue', count: 28, pct: 15, topSource: 'BTP', topIndustry: 'E-Commerce' },
    { reason: 'Going Local', count: 24, pct: 13, topSource: 'Organic', topIndustry: 'Construction' },
    { reason: 'Personal Only', count: 22, pct: 12, topSource: 'Organic', topIndustry: 'General' },
    { reason: 'Mistake', count: 14, pct: 7, topSource: 'BTP', topIndustry: 'General' },
    { reason: 'Out of Scope', count: 8, pct: 4, topSource: 'LegalZoom', topIndustry: 'Non-Profit' },
    { reason: 'Bad Reviews', count: 6, pct: 3, topSource: 'Organic', topIndustry: 'General' },
    { reason: 'Language Barrier', count: 4, pct: 2, topSource: 'BTP', topIndustry: 'General' },
    { reason: "Doesn't Want Consultation", count: 4, pct: 2, topSource: 'Organic', topIndustry: 'General' },
  ];
}

// ---------------------------------------------------------------------------
// getRepRankings — all reps sorted by metrics
// ---------------------------------------------------------------------------
export async function getRepRankings(days = 7) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('rep_daily_stats')
      .select('*')
      .gte('date', daysAgo(days));
    if (!error && data?.length) {
      const byRep = {};
      data.forEach(d => {
        if (!byRep[d.rep_id]) byRep[d.rep_id] = { repId: d.rep_id, repName: d.rep_name, calls: 0, sales: 0, revenue: 0, totalDuration: 0 };
        byRep[d.rep_id].calls += d.calls_completed || 0;
        byRep[d.rep_id].sales += d.sales || 0;
        byRep[d.rep_id].revenue += parseFloat(d.total_revenue || 0);
        byRep[d.rep_id].totalDuration += (d.avg_call_duration || 0) * (d.calls_completed || 1);
      });
      return Object.values(byRep).map(r => ({
        ...r,
        closeRate: r.calls > 0 ? Math.round((r.sales / r.calls) * 100) : 0,
        avgDuration: r.calls > 0 ? Math.round(r.totalDuration / r.calls) : 0,
      })).sort((a, b) => b.revenue - a.revenue);
    }
  }
  // Mock rankings will be generated from sampleData in components
  return null;
}

// ---------------------------------------------------------------------------
// getRevenueTimeline — daily revenue totals for sparkline charts
// ---------------------------------------------------------------------------
export async function getRevenueTimeline(days = 30) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('rep_daily_stats')
      .select('date, total_revenue')
      .gte('date', daysAgo(days))
      .order('date', { ascending: true });
    if (!error && data?.length) {
      const byDate = {};
      data.forEach(d => {
        byDate[d.date] = (byDate[d.date] || 0) + parseFloat(d.total_revenue || 0);
      });
      return Object.entries(byDate).map(([date, revenue]) => ({ date, revenue }));
    }
  }
  // Mock: generate 30 days of revenue
  const result = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({
      date: d.toISOString().split('T')[0],
      revenue: Math.round(15000 + Math.random() * 25000),
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Mock data generators
// ---------------------------------------------------------------------------
function generateMockDailyStats(days) {
  const stats = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const calls = Math.floor(6 + Math.random() * 6);
    const sales = Math.floor(calls * (0.28 + Math.random() * 0.18));
    stats.push({
      date: d.toISOString().split('T')[0],
      calls_completed: calls,
      sales,
      follow_ups: Math.floor(calls * 0.25),
      not_interested: calls - sales - Math.floor(calls * 0.25),
      total_revenue: sales * (2200 + Math.random() * 1500),
      avg_call_duration: Math.floor(1500 + Math.random() * 600),
      avg_flow_score: Math.floor(72 + Math.random() * 20),
      avg_pacing_pct: Math.floor(80 + Math.random() * 20),
      calls_over_time: Math.floor(Math.random() * 2),
      objections_total: Math.floor(calls * 0.6),
      calculator_used: Math.floor(calls * (0.5 + Math.random() * 0.4)),
      avg_savings_quoted: Math.floor(4000 + Math.random() * 4000),
      discovery_completion_avg: Math.round((0.7 + Math.random() * 0.25) * 100) / 100,
    });
  }
  return stats;
}

function generateMockManagerStats(days) {
  const stats = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const calls = Math.floor(50 + Math.random() * 30);
    const sales = Math.floor(calls * (0.30 + Math.random() * 0.12));
    stats.push({
      date: d.toISOString().split('T')[0],
      total_reps: Math.floor(10 + Math.random() * 4),
      total_calls: calls,
      total_sales: sales,
      total_revenue: sales * (2400 + Math.random() * 1200),
      close_rate: Math.round((sales / calls) * 100),
      avg_call_duration: Math.floor(1550 + Math.random() * 500),
      avg_flow_score: Math.floor(75 + Math.random() * 18),
      calls_over_time: Math.floor(Math.random() * 5),
    });
  }
  return stats;
}
