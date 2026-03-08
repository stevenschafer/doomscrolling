import { createHash } from 'crypto';
import Parser from 'rss-parser';
import { RawStory } from '../db';

const RSS_FEEDS = [
  { name: '404 Media', url: 'https://www.404media.co/rss' },
  { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { name: 'MIT Tech Review AI', url: 'https://www.technologyreview.com/feed/' },
  { name: 'Wired AI', url: 'https://www.wired.com/feed/tag/ai/latest/rss' },
  { name: 'AI Incident DB Blog', url: 'https://incidentdatabase.ai/rss.xml' },
  { name: 'The Guardian Tech', url: 'https://www.theguardian.com/technology/rss' },
];

const parser = new Parser();

export async function fetchFromRSS(): Promise<RawStory[]> {
  const stories: RawStory[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);

      for (const item of parsed.items ?? []) {
        if (!item.link || !item.title) continue;
        const urlHash = createHash('sha256').update(item.link).digest('hex');

        stories.push({
          source_id: urlHash,
          title: item.title,
          url: item.link,
          source_name: feed.name,
          image_url: item.enclosure?.url ?? null,
          published_at: item.isoDate ?? new Date().toISOString(),
          excerpt: item.contentSnippet ?? item.content ?? null,
        });
      }
    } catch (err) {
      console.error(`RSS feed "${feed.name}" failed:`, err);
    }
  }

  return stories;
}
