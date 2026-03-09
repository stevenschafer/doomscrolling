import * as cheerio from 'cheerio';

export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'doomscrolling.ai/1.0 (news aggregator)' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    return (
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      null
    );
  } catch {
    return null;
  }
}
