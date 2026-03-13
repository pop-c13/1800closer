import { supabase, isSupabaseConfigured } from './supabase';

export async function saveSession(sessionData) {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured — session not saved to DB');
    return null;
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select()
    .single();

  if (error) {
    console.error('Error saving session:', error);
    return null;
  }
  return data;
}

export async function getRecentSessions(repId = null, limit = 10) {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (repId) {
    query = query.eq('rep_id', repId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
  return data;
}

export async function getRepStats(repId) {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('rep_id', repId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return null;

  const sessions = data || [];
  const completed = sessions.filter(s => s.outcome && s.outcome !== 'pending');
  const closed = completed.filter(s => s.outcome === 'closed');

  return {
    totalCalls: completed.length,
    closeRate: completed.length > 0 ? Math.round((closed.length / completed.length) * 100) : 0,
    avgDuration: completed.length > 0 ? Math.round(completed.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / completed.length) : 0,
    avgSavings: completed.length > 0 ? Math.round(completed.reduce((sum, s) => sum + (s.computed_savings || 0), 0) / completed.length) : 0,
    overTimeCount: completed.filter(s => s.over_time).length,
    recentSessions: sessions.slice(0, 10),
  };
}

export async function getTodayTeamStats() {
  if (!isSupabaseConfigured()) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .gte('created_at', today.toISOString());

  if (error) return null;

  const sessions = data || [];
  const completed = sessions.filter(s => s.outcome && s.outcome !== 'pending');
  const closed = completed.filter(s => s.outcome === 'closed');
  const revenue = closed.reduce((sum, s) => {
    const price = parseFloat((s.price_quoted || '0').replace(/[^0-9.]/g, ''));
    return sum + price;
  }, 0);

  return {
    totalCalls: completed.length,
    closedToday: closed.length,
    revenueBooked: revenue,
    closeRate: completed.length > 0 ? Math.round((closed.length / completed.length) * 100) : 0,
  };
}

// ---------------------------------------------------------------------------
// Post-call analytics: upsert rep daily stats
// ---------------------------------------------------------------------------
export async function upsertRepDailyStats(sessionRecord) {
  if (!isSupabaseConfigured()) return null;

  const today = new Date().toISOString().split('T')[0];
  const isSale = sessionRecord.outcome === 'closed';
  const isFollowUp = sessionRecord.outcome === 'follow-up';
  const isNotInterested = sessionRecord.outcome === 'no-sale';
  const revenue = isSale ? parseFloat((sessionRecord.price_quoted || '0').toString().replace(/[^0-9.]/g, '')) : 0;

  // Try to get existing row
  const { data: existing } = await supabase
    .from('rep_daily_stats')
    .select('*')
    .eq('rep_id', sessionRecord.rep_id)
    .eq('date', today)
    .single();

  if (existing) {
    const newCalls = (existing.calls_completed || 0) + 1;
    const newSales = (existing.sales || 0) + (isSale ? 1 : 0);
    const newFollowUps = (existing.follow_ups || 0) + (isFollowUp ? 1 : 0);
    const newNotInterested = (existing.not_interested || 0) + (isNotInterested ? 1 : 0);
    const newRevenue = parseFloat(existing.total_revenue || 0) + revenue;
    const newOverTime = (existing.calls_over_time || 0) + (sessionRecord.over_time ? 1 : 0);
    const newObjections = (existing.objections_total || 0) + (sessionRecord.objections_handled?.length || 0);
    const calcUsed = (existing.calculator_used || 0) + (sessionRecord.computed_savings > 0 ? 1 : 0);

    const { error } = await supabase
      .from('rep_daily_stats')
      .update({
        calls_completed: newCalls,
        sales: newSales,
        follow_ups: newFollowUps,
        not_interested: newNotInterested,
        total_revenue: newRevenue,
        avg_call_duration: Math.round(((existing.avg_call_duration || 0) * (newCalls - 1) + (sessionRecord.duration_seconds || 0)) / newCalls),
        calls_over_time: newOverTime,
        objections_total: newObjections,
        calculator_used: calcUsed,
        avg_savings_quoted: Math.round(((existing.avg_savings_quoted || 0) * (newCalls - 1) + (sessionRecord.computed_savings || 0)) / newCalls),
      })
      .eq('id', existing.id);

    if (error) console.error('Error updating rep daily stats:', error);
  } else {
    const { error } = await supabase
      .from('rep_daily_stats')
      .insert({
        rep_id: sessionRecord.rep_id,
        rep_name: sessionRecord.rep_name,
        date: today,
        calls_completed: 1,
        sales: isSale ? 1 : 0,
        follow_ups: isFollowUp ? 1 : 0,
        not_interested: isNotInterested ? 1 : 0,
        total_revenue: revenue,
        avg_call_duration: sessionRecord.duration_seconds || 0,
        calls_over_time: sessionRecord.over_time ? 1 : 0,
        objections_total: sessionRecord.objections_handled?.length || 0,
        calculator_used: sessionRecord.computed_savings > 0 ? 1 : 0,
        avg_savings_quoted: sessionRecord.computed_savings || 0,
      });

    if (error) console.error('Error inserting rep daily stats:', error);
  }
}

// ---------------------------------------------------------------------------
// Post-call: log objections
// ---------------------------------------------------------------------------
export async function logObjections(sessionId, repId, objections, outcome) {
  if (!isSupabaseConfigured() || !objections?.length) return;

  const competitorMap = {
    'Have accountant': 'Local CPA',
    'Do it myself': 'TurboTax/DIY',
  };

  const rows = objections.map(obj => ({
    session_id: sessionId,
    rep_id: repId,
    objection_type: typeof obj === 'string' ? obj : obj.text,
    competitor_mentioned: competitorMap[typeof obj === 'string' ? obj : obj.text] || null,
    outcome: outcome,
    slide_number: typeof obj === 'object' ? obj.slideId : null,
    timestamp_seconds: null,
  }));

  const { error } = await supabase.from('objection_log').insert(rows);
  if (error) console.error('Error logging objections:', error);
}

// ---------------------------------------------------------------------------
// Post-call: log disposition reason (for Not Interested)
// ---------------------------------------------------------------------------
export async function logDispositionReason(sessionId, repId, reason, leadData) {
  if (!isSupabaseConfigured() || !reason) return;

  const { error } = await supabase.from('disposition_reasons').insert({
    session_id: sessionId,
    rep_id: repId,
    reason: reason,
    lead_source: leadData?.leadSource || null,
    industry: leadData?.industry || null,
    state: leadData?.state || null,
  });

  if (error) console.error('Error logging disposition reason:', error);
}
