import { getSupabaseAdmin } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const fromParam = params.get('from');
  const toParam = params.get('to');
  const weeksParam = params.get('weeks');

  let query = getSupabaseAdmin()
    .from('doom_index')
    .select('*')
    .order('week_start', { ascending: true });

  if (fromParam && toParam) {
    const from = new Date(fromParam);
    const to = new Date(toParam);
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || from >= to) {
      return Response.json({ error: 'Invalid date range' }, { status: 400 });
    }
    query = query.gte('week_start', fromParam).lte('week_start', toParam);
  } else {
    const weeks = Math.min(104, Math.max(4, weeksParam ? parseInt(weeksParam, 10) || 8 : 8));
    query = query.limit(weeks);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: 'Failed to fetch' }, { status: 500 });
  }

  // Check if user is premium for category breakdown
  let isPremium = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: subscriber } = await getSupabaseAdmin()
        .from('subscribers')
        .select('status')
        .eq('user_id', user.id)
        .single();
      isPremium = subscriber?.status === 'premium';
    }
  } catch {
    // Not logged in
  }

  // Strip category_scores for non-premium users
  const entries = (data ?? []).map(entry => ({
    week_start: entry.week_start,
    overall_score: entry.overall_score,
    article_count: entry.article_count,
    ...(isPremium ? { category_scores: entry.category_scores } : {}),
  }));

  return Response.json({ data: entries });
}
