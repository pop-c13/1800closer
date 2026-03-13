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
