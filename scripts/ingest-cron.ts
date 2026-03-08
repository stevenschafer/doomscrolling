/**
 * Manual trigger for testing the ingest pipeline locally.
 * Run with: npx tsx scripts/ingest-cron.ts
 */

import 'dotenv/config';

async function main() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error('CRON_SECRET not set in .env.local');
    process.exit(1);
  }

  console.log('Triggering ingest...');
  const res = await fetch(`${baseUrl}/api/ingest?secret=${encodeURIComponent(secret)}`);
  const data = await res.json();
  console.log('Result:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
