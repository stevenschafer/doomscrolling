import { redirect } from 'next/navigation';
import { getPremiumStatus } from '@/lib/premium';
import { getSupabaseAdmin } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import { AuthButton } from '@/components/AuthButton';
import { DoomIndexChart } from '@/components/DoomIndexChart';
import { PodcastPlayer } from '@/components/PodcastPlayer';
import { EmailPreferences } from '@/components/EmailPreferences';
import { AccountActions } from './account-actions';

export const metadata = {
  title: 'Account — doomscrolling.ai',
};

export default async function AccountPage() {
  const status = await getPremiumStatus();
  if (!status.isLoggedIn) redirect('/login');

  const admin = getSupabaseAdmin();

  // Fetch subscriber info
  const { data: subscriber } = await admin
    .from('subscribers')
    .select('*')
    .eq('user_id', status.userId)
    .single();

  // Fetch doom index (last 8 weeks)
  const { data: doomData } = await admin
    .from('doom_index')
    .select('*')
    .order('week_start', { ascending: true })
    .limit(8);

  // Fetch latest podcast episode and generate signed URL
  const { data: podcastRaw } = await admin
    .from('podcast_episodes')
    .select('*')
    .eq('status', 'ready')
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  let podcast = podcastRaw;
  if (podcast?.audio_url) {
    const { data: signedData } = await admin.storage
      .from('podcast')
      .createSignedUrl(podcast.audio_url, 3600); // 1 hour expiry
    if (signedData?.signedUrl) {
      podcast = { ...podcast, audio_url: signedData.signedUrl };
    }
  }

  // Fetch latest synthesis report
  const { data: report } = await admin
    .from('synthesis_reports')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get Stripe subscription details for billing info
  let nextBillingDate: string | null = null;
  if (subscriber?.stripe_subscription_id && subscriber.status === 'premium') {
    try {
      const sub = await getStripe().subscriptions.retrieve(subscriber.stripe_subscription_id);
      // Compute next billing from billing_cycle_anchor (monthly subscription)
      if (sub.billing_cycle_anchor) {
        const anchor = new Date(sub.billing_cycle_anchor * 1000);
        const now = new Date();
        // Advance anchor month by month until it's in the future
        while (anchor <= now) {
          anchor.setMonth(anchor.getMonth() + 1);
        }
        nextBillingDate = anchor.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch {
      // Stripe call failed, skip billing info
    }
  }

  const isPremium = subscriber?.status === 'premium';

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border sticky top-0 z-50 bg-card-bg">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">
            <a href="/" className="no-underline hover:no-underline">💀 doomscrolling.ai</a>
          </h1>
          <AuthButton />
        </div>
      </header>

      <div className="max-w-[720px] mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-10">
          <h2 className="text-2xl font-bold tracking-tight">Account</h2>
          {isPremium && (
            <span className="text-xs font-bold tracking-[1.2px] uppercase font-mono px-2 py-0.5 border border-fg bg-fg text-bg rounded">
              PRO
            </span>
          )}
        </div>

        {!isPremium && (
          <div className="border border-border rounded-lg p-6 bg-card-bg mb-8 text-center">
            <p className="font-bold mb-1">You&rsquo;re on the free plan</p>
            <p className="text-sm text-muted mb-4">Upgrade to unlock the Doom Index, podcast, daily briefings, and ad-free experience.</p>
            <a
              href="/premium"
              className="inline-block text-xs font-bold uppercase tracking-widest font-mono px-6 py-3 border border-fg bg-fg text-bg rounded-lg hover:bg-transparent hover:text-fg transition-colors no-underline"
            >
              Get Premium — $5/mo
            </a>
          </div>
        )}

        {isPremium && (
          <>
            {/* Doom Index */}
            <section className="mb-8">
              <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-muted mb-3">Doom Index</h3>
              <DoomIndexChart data={doomData ?? []} showCategories={true} />
            </section>

            {/* Podcast */}
            <section className="mb-8">
              <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-muted mb-3">Weekly Podcast</h3>
              <PodcastPlayer episode={podcast} />
            </section>

            {/* Synthesis Report */}
            <section className="mb-8">
              <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-muted mb-3">Weekly Synthesis</h3>
              {report ? (
                <div className="border border-border rounded-lg p-6 bg-card-bg">
                  <h4 className="font-bold text-sm mb-2">{report.title}</h4>
                  <p className="text-sm text-muted line-clamp-3 mb-3">
                    {report.content.slice(0, 200)}...
                  </p>
                  <a
                    href={`/account/report/${report.id}`}
                    className="text-xs font-bold uppercase tracking-widest font-mono text-fg hover:underline"
                  >
                    Read full report →
                  </a>
                </div>
              ) : (
                <div className="border border-border rounded-lg p-10 bg-card-bg text-center">
                  <p className="text-2xl mb-3">📊</p>
                  <p className="font-bold mb-1">No synthesis reports yet</p>
                  <p className="text-sm text-muted">The first report will be generated this Sunday.</p>
                </div>
              )}
            </section>

            {/* Email Preferences */}
            <section className="mb-8">
              <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-muted mb-3">Email Preferences</h3>
              <EmailPreferences
                dailyBriefing={subscriber?.daily_briefing_enabled ?? true}
                weeklyDigest={subscriber?.weekly_digest_enabled ?? true}
              />
            </section>
          </>
        )}

        {/* Subscription Info */}
        <section className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-muted mb-3">Subscription</h3>
          <div className="border border-border rounded-lg divide-y divide-border bg-card-bg">
            <div className="flex justify-between px-6 py-3">
              <span className="text-sm text-muted">Email</span>
              <span className="text-sm">{status.email}</span>
            </div>
            <div className="flex justify-between px-6 py-3">
              <span className="text-sm text-muted">Plan</span>
              <span className="text-sm">{isPremium ? 'Premium ($5/mo)' : 'Free'}</span>
            </div>
            {subscriber?.premium_since && (
              <div className="flex justify-between px-6 py-3">
                <span className="text-sm text-muted">Premium since</span>
                <span className="text-sm">
                  {new Date(subscriber.premium_since).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
            {nextBillingDate && (
              <div className="flex justify-between px-6 py-3">
                <span className="text-sm text-muted">Next billing</span>
                <span className="text-sm">{nextBillingDate}</span>
              </div>
            )}
          </div>
        </section>

        {/* Account Actions */}
        <AccountActions isPremium={isPremium} />
      </div>
    </div>
  );
}
