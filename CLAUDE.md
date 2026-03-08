# doomscrolling.ai

Editorially-filtered AI news feed. Black/white design, auto light/dark mode.

## Stack
- Next.js (App Router) + Tailwind CSS
- Supabase (PostgreSQL)
- Anthropic Claude API for scoring/filtering
- NewsAPI + RSS + AI Incident Database for sources
- Google AdSense for ads
- Stripe for premium subscriptions ($5/mo)

## Key env vars (no values in repo)
ANTHROPIC_API_KEY, NEWS_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_PREMIUM_PRICE_ID, NEXT_PUBLIC_ADSENSE_CLIENT_ID, CRON_SECRET, ADMIN_SECRET

## Architecture
- `/api/ingest` — cron endpoint (every 2h) fetches news, scores with Claude, stores in Supabase
- `/api/articles` — paginated feed API
- `/api/articles/[id]/click` — click tracking via sendBeacon
- `/api/subscribe` — Stripe checkout
- `/api/stripe-webhook` — handles subscription lifecycle
- `/admin/filtered?secret=...` — view Claude-rejected stories

## Conventions
- Minimum concern score to display: 50
- Ingest is idempotent (dedupes by source_id = SHA-256 of URL)
- All Claude API calls wrapped in try/catch — skip on failure, don't crash batch
- Images use onError fallback to hide broken imgs
