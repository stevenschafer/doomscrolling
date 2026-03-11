import { NextRequest } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return Response.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const email = session.customer_email ?? session.metadata?.email;
      if (email) {
        await getSupabaseAdmin().from('subscribers').upsert(
          {
            email,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: 'premium',
            premium_since: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );

        // Link auth user if they already have an account
        const { data: authUsers } = await getSupabaseAdmin().auth.admin.listUsers();
        const authUser = authUsers?.users?.find(u => u.email === email);
        if (authUser) {
          await getSupabaseAdmin()
            .from('subscribers')
            .update({ user_id: authUser.id })
            .eq('email', email)
            .is('user_id', null);
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await getSupabaseAdmin()
        .from('subscribers')
        .update({ status: 'cancelled' })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }

    case 'invoice.payment_failed': {
      console.warn('Payment failed for invoice:', event.data.object.id);
      break;
    }
  }

  return Response.json({ received: true });
}
