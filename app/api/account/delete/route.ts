import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/db';
import { getStripe } from '@/lib/stripe';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  // Get subscriber record
  const { data: subscriber } = await admin
    .from('subscribers')
    .select('stripe_subscription_id, status')
    .eq('user_id', user.id)
    .single();

  // Cancel Stripe subscription if active
  if (subscriber?.stripe_subscription_id && subscriber.status === 'premium') {
    try {
      await getStripe().subscriptions.cancel(subscriber.stripe_subscription_id);
    } catch (err) {
      console.error('Failed to cancel Stripe subscription during deletion:', err);
    }
  }

  // Anonymize subscriber record (keep for Stripe reconciliation)
  if (subscriber) {
    await admin
      .from('subscribers')
      .update({
        email: `deleted-${user.id}@deleted.local`,
        user_id: null,
        status: 'cancelled',
        daily_briefing_enabled: false,
        weekly_digest_enabled: false,
      })
      .eq('user_id', user.id);
  }

  // Delete Supabase Auth user
  await admin.auth.admin.deleteUser(user.id);

  return Response.json({ ok: true });
}
