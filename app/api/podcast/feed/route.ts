import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token');

  if (!token) {
    return new Response('Missing token', { status: 401 });
  }

  const admin = getSupabaseAdmin();

  // Verify token is a valid subscriber
  const { data: subscriber } = await admin
    .from('subscribers')
    .select('email, status')
    .eq('stripe_subscription_id', token)
    .single();

  if (!subscriber || subscriber.status !== 'premium') {
    return new Response('Invalid or expired subscription', { status: 403 });
  }

  // Fetch all published episodes
  const { data: episodes } = await admin
    .from('podcast_episodes')
    .select('*')
    .eq('status', 'ready')
    .order('week_start', { ascending: false });

  // Generate signed URLs for each episode (24h expiry for podcast apps)
  const signedEpisodes = await Promise.all(
    (episodes ?? []).map(async (ep) => {
      const { data: signedData } = await admin.storage
        .from('podcast')
        .createSignedUrl(ep.audio_url, 86400); // 24 hours
      return { ...ep, signed_url: signedData?.signedUrl ?? '' };
    })
  );

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://doomscrolling.ai';
  const items = signedEpisodes.map(ep => `
    <item>
      <title><![CDATA[${ep.title}]]></title>
      <description><![CDATA[${ep.description ?? ''}]]></description>
      <pubDate>${new Date(ep.created_at).toUTCString()}</pubDate>
      <enclosure url="${ep.signed_url}" length="0" type="audio/mpeg" />
      <itunes:duration>${ep.duration_seconds ?? 0}</itunes:duration>
      <guid isPermaLink="false">${ep.id}</guid>
    </item>
  `).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>doomscrolling.ai — Weekly Podcast</title>
    <link>${baseUrl}</link>
    <language>en-us</language>
    <description>Weekly AI doom recap. Two AI hosts discuss the most concerning developments in artificial intelligence.</description>
    <itunes:author>doomscrolling.ai</itunes:author>
    <itunes:category text="Technology" />
    <atom:link href="${baseUrl}/api/podcast/feed?token=${token}" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
