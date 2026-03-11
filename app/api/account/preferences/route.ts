import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/db';

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, boolean> = {};

  if (typeof body.daily_briefing_enabled === 'boolean') {
    updates.daily_briefing_enabled = body.daily_briefing_enabled;
  }
  if (typeof body.weekly_digest_enabled === 'boolean') {
    updates.weekly_digest_enabled = body.weekly_digest_enabled;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No valid fields' }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from('subscribers')
    .update(updates)
    .eq('user_id', user.id);

  if (error) {
    return Response.json({ error: 'Failed to update' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
