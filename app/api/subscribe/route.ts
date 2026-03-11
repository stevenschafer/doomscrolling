import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // If user is signed in, use their session email for consistency
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const checkoutEmail = user?.email ?? email;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: checkoutEmail,
      line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID!, quantity: 1 }],
      success_url: `${baseUrl}/login?checkout=success`,
      cancel_url: `${baseUrl}/`,
      metadata: { email: checkoutEmail },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
