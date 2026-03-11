import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/db';
import { getStripe } from '@/lib/stripe';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: subscriber } = await getSupabaseAdmin()
    .from('subscribers')
    .select('stripe_subscription_id, status')
    .eq('user_id', user.id)
    .single();

  if (!subscriber || subscriber.status !== 'premium') {
    return Response.json({ error: 'No active subscription' }, { status: 400 });
  }

  try {
    await getStripe().subscriptions.cancel(subscriber.stripe_subscription_id);

    await getSupabaseAdmin()
      .from('subscribers')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id);

    return Response.json({ ok: true });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    return Response.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
