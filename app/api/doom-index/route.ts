import { getSupabaseAdmin } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from('doom_index')
    .select('*')
    .order('week_start', { ascending: true })
    .limit(8);

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
