import { PremiumCheckout } from '@/components/PremiumCheckout';

export const metadata = {
  title: 'Premium — doomscrolling.ai',
  description: 'Get the daily digest, weekly podcast, Doom Index, and ad-free experience.',
};

const features = [
  {
    icon: '✉️',
    title: 'Daily Briefing. In your inbox by 7am.',
    copy: 'The top 5 stories by concern score, summarized and delivered every morning. Read the whole feed in 90 seconds without opening a browser.',
  },
  {
    icon: '🎙️',
    title: 'Weekly Podcast. Two AI hosts. One grim recap.',
    copy: "Every Sunday, our AI hosts synthesize the week's most alarming developments into a 10–15 minute audio briefing. Commutable. Disturbing. Essential.",
  },
  {
    icon: '📉',
    title: 'The Doom Index. Track the trend.',
    copy: 'A weekly composite score tracking aggregate AI concern across all ingested stories, broken down by category. The number journalists will start citing.',
  },
  {
    icon: '🚫',
    title: 'Ad-free. Always.',
    copy: 'No AdSense. No trackers. No irony of being surveilled while reading about AI surveillance. Clean feed, forever.',
  },
];

const comparisonRows = [
  { feature: 'Full article feed', free: true, premium: true },
  { feature: 'AI summary (2–3 sentences)', free: true, premium: true },
  { feature: 'Concern score + category', free: true, premium: true },
  { feature: 'Google ads', free: 'Yes', premium: 'No' },
  { feature: 'Daily digest email', free: false, premium: true },
  { feature: 'Weekly podcast', free: false, premium: true },
  { feature: 'Doom Index report', free: false, premium: true },
  { feature: 'Weekly synthesis report', free: false, premium: true },
];

const faqs = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your account settings or email us. No questions, no retention flow, no dark patterns.',
  },
  {
    q: 'Do you store my payment info?',
    a: 'No. Payments are handled entirely by Stripe. We never see your card number.',
  },
  {
    q: "What if the podcast or Doom Index isn't built yet?",
    a: "Fair question. The daily digest and ad-free experience are live on day one. The podcast and Doom Index are in active development — early subscribers get them the moment they launch, and the price won't increase.",
  },
];

// Fake Doom Index data for the teaser chart
const doomIndexData = [62, 58, 65, 71, 68, 74, 79, 83];
const doomIndexWeeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-card-bg">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">
            <a href="/" className="no-underline hover:no-underline">💀 doomscrolling.ai</a>
          </h1>
        </div>
      </header>

      <div className="max-w-[720px] mx-auto px-4">

        {/* Hero */}
        <section className="py-20 md:py-28 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-6">
            The feed. Plus everything the feed doesn&rsquo;t tell you.
          </h2>
          <p className="text-base md:text-lg text-muted max-w-[560px] mx-auto leading-relaxed mb-10">
            doomscrolling.ai premium gives you the weekly synthesis, the AI podcast, the Doom Index, and a daily briefing — so you&rsquo;re not just aware of what&rsquo;s happening in AI, you actually understand it.
          </p>
          <PremiumCheckout context="hero" />
        </section>

        {/* Doom Index Teaser */}
        <section className="py-16 border-t border-border">
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
            The Doom Index. A number the free tier doesn&rsquo;t see.
          </h3>
          <p className="text-muted leading-relaxed mb-8 max-w-[560px]">
            Every week, we score every ingested story, aggregate by category, and produce a single index number tracking the state of AI risk. Is it getting better or worse? Which categories are spiking? Premium subscribers get the full breakdown.
          </p>
          <div className="relative border border-border rounded-lg p-6 bg-card-bg overflow-hidden">
            {/* Simple SVG chart */}
            <svg viewBox="0 0 700 200" className="w-full h-auto" aria-label="Doom Index trend chart">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="50" y1={20 + i * 40}
                  x2="660" y2={20 + i * 40}
                  stroke="var(--border)" strokeWidth="1"
                />
              ))}
              {/* Y-axis labels */}
              {[100, 80, 60, 40, 20].map((val, i) => (
                <text
                  key={val}
                  x="40" y={25 + i * 40}
                  textAnchor="end"
                  fill="var(--muted)"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              ))}
              {/* Line */}
              <polyline
                fill="none"
                stroke="var(--fg)"
                strokeWidth="2"
                points={doomIndexData.map((val, i) => {
                  const x = 80 + i * 80;
                  const y = 180 - (val / 100) * 160;
                  return `${x},${y}`;
                }).join(' ')}
              />
              {/* Data points */}
              {doomIndexData.map((val, i) => {
                const x = 80 + i * 80;
                const y = 180 - (val / 100) * 160;
                return (
                  <circle
                    key={i}
                    cx={x} cy={y} r="4"
                    fill="var(--fg)"
                  />
                );
              })}
              {/* Week labels */}
              {doomIndexWeeks.map((label, i) => (
                <text
                  key={label}
                  x={80 + i * 80}
                  y="198"
                  textAnchor="middle"
                  fill="var(--muted)"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {label}
                </text>
              ))}
            </svg>
            {/* Blur overlay on right half */}
            <div className="absolute top-0 right-0 w-1/2 h-full backdrop-blur-md bg-bg/50 flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">🔒</span>
              <span className="text-xs font-bold uppercase tracking-widest font-mono">Premium</span>
              <span className="text-sm text-muted">Unlock the full Doom Index →</span>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-16 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="border border-border rounded-lg p-6 bg-card-bg"
              >
                <div className="text-2xl mb-3">{f.icon}</div>
                <h4 className="font-bold text-sm mb-2">{f.title}</h4>
                <p className="text-sm text-muted leading-relaxed">{f.copy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Podcast Sample */}
        <section className="py-16 border-t border-border">
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
            What it sounds like.
          </h3>
          <p className="text-muted leading-relaxed mb-6">
            Every Sunday, two AI hosts break down the week in AI risk. First episode coming soon — subscribe to get it the moment it drops.
          </p>
          <div className="border border-border rounded-lg p-8 bg-card-bg flex flex-col items-center gap-4 text-center">
            {/* Static waveform representation */}
            <div className="flex items-end gap-[3px] h-12">
              {[3,5,8,4,7,10,6,9,5,8,11,7,4,9,6,10,5,8,3,7,9,4,6,8,5,10,7,3,6,9,5,8,4,7,10,6].map((h, i) => (
                <div
                  key={i}
                  className="w-[4px] bg-fg/30 rounded-full"
                  style={{ height: `${h * 4}px` }}
                />
              ))}
            </div>
            <p className="text-sm text-muted">
              First episode drops soon. Subscribe to get it.
            </p>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 border-t border-border">
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
            Free vs Premium
          </h3>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-normal text-muted">Feature</th>
                  <th className="px-4 py-3 font-normal text-muted text-center w-24">Free</th>
                  <th className="px-4 py-3 font-bold text-center w-24 bg-fg text-bg">Premium</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">{row.feature}</td>
                    <td className="px-4 py-3 text-center">
                      {row.free === true ? '✓' : row.free === false ? <span className="text-muted">—</span> : <span className="text-muted">{row.free}</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      {row.premium === true ? '✓' : row.premium === false ? <span className="text-muted">—</span> : <span>{row.premium}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pricing Block */}
        <section className="py-16 border-t border-border">
          <div className="border border-border rounded-lg p-10 md:p-14 bg-card-bg text-center">
            <p className="text-xs font-bold uppercase tracking-widest font-mono text-muted mb-4">
              doomscrolling.ai Premium
            </p>
            <p className="text-5xl md:text-6xl font-bold tracking-tight mb-2">$5</p>
            <p className="text-muted mb-8">per month. Cancel anytime. No tricks.</p>
            <PremiumCheckout context="pricing" />
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 border-t border-border">
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
            Questions.
          </h3>
          <div className="space-y-0 border border-border rounded-lg overflow-hidden">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="border-b border-border last:border-b-0 group"
              >
                <summary className="px-6 py-4 cursor-pointer font-bold text-sm hover:bg-card-bg list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-muted group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <p className="px-6 pb-4 text-sm text-muted leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Footer spacer */}
        <div className="py-16 text-center text-xs text-muted">
          AI wrote the summaries. AI hosts the podcast. Humans are optional.
        </div>
      </div>
    </div>
  );
}
