# doomscrolling.ai

Editorially-filtered AI news feed. Black/white design, auto light/dark mode.

## Stack
- Next.js (App Router) + Tailwind CSS
- Supabase (PostgreSQL + Auth with magic link)
- Anthropic Claude API for scoring/filtering + synthesis reports
- OpenAI TTS for podcast audio generation
- NewsAPI + RSS + AI Incident Database for sources
- Google AdSense for ads (hidden for premium users)
- Stripe for premium subscriptions ($5/mo)
- Resend for transactional emails (daily briefing, weekly digest)
- Inngest for background jobs (ingest, doom index, synthesis, podcast, emails)

## Key env vars (no values in repo)
ANTHROPIC_API_KEY, NEWS_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_PREMIUM_PRICE_ID, NEXT_PUBLIC_ADSENSE_CLIENT_ID, CRON_SECRET, ADMIN_SECRET, RESEND_API_KEY, OPENAI_API_KEY

## Architecture
- `/api/ingest` — cron endpoint (every 2h) fetches news, scores with Claude, stores in Supabase
- `/api/articles` — paginated feed API
- `/api/articles/[id]/click` — click tracking via sendBeacon
- `/api/subscribe` — Stripe checkout (session-aware)
- `/api/stripe-webhook` — handles subscription lifecycle, links auth users
- `/api/doom-index` — public scores, premium gets category breakdown
- `/api/account/cancel` — cancel Stripe subscription
- `/api/account/preferences` — email preference toggles
- `/api/account/delete` — delete account, anonymize data
- `/api/podcast/feed` — per-subscriber private RSS feed
- `/api/inngest` — Inngest webhook handler (ingest, doom index, briefing, synthesis, podcast)
- `/auth/callback` — magic link exchange, links auth user to subscriber
- `/login` — magic link sign-in page
- `/account` — premium dashboard (doom index, podcast, synthesis, preferences)
- `/account/report/[id]` — full synthesis report view
- `/admin/filtered?secret=...` — view Claude-rejected stories

## Premium Features
- Ad-free experience (no AdSense, no GA for premium users)
- Doom Index — weekly composite score with category breakdown
- Daily briefing email — top 5 articles at 7am ET
- Weekly synthesis report — Claude-generated analysis
- Weekly podcast — two AI hosts (OpenAI TTS), uploaded to Supabase Storage

## Conventions
- Minimum concern score to display: 50
- Ingest is idempotent (dedupes by source_id = SHA-256 of URL)
- All Claude API calls wrapped in try/catch — skip on failure, don't crash batch
- Images use onError fallback to hide broken imgs
- Auth uses Supabase magic link (no passwords)
- Premium status checked via `lib/premium.ts` → `getPremiumStatus()`
