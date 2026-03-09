import { createHash } from 'crypto';
import { RawStory } from '../db';

const HN_API = 'https://hacker-news.firebaseio.com/v0';
const MAX_STORIES = 30;

interface HNItem {
  id: number;
  type: string;
  title?: string;
  url?: string;
  text?: string;
  by?: string;
  time?: number;
  score?: number;
  descendants?: number;
  dead?: boolean;
  deleted?: boolean;
}

async function fetchItem(id: number): Promise<HNItem | null> {
  try {
    const res = await fetch(`${HN_API}/item/${id}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchFromHackerNews(): Promise<RawStory[]> {
  const stories: RawStory[] = [];
  const seen = new Set<string>();

  try {
    const res = await fetch(`${HN_API}/topstories.json`);
    if (!res.ok) {
      console.error('Failed to fetch HN top stories:', res.status);
      return [];
    }

    const storyIds: number[] = await res.json();
    const topIds = storyIds.slice(0, MAX_STORIES);

    const items = await Promise.all(topIds.map(fetchItem));

    for (const item of items) {
      if (!item || item.deleted || item.dead) continue;
      if (item.type !== 'story' || !item.title) continue;

      // Use the external URL if available, otherwise link to HN discussion
      const url = item.url || `https://news.ycombinator.com/item?id=${item.id}`;
      const urlHash = createHash('sha256').update(url).digest('hex');
      if (seen.has(urlHash)) continue;
      seen.add(urlHash);

      const sourceName = item.url
        ? new URL(item.url).hostname.replace(/^www\./, '')
        : 'news.ycombinator.com';

      stories.push({
        source_id: urlHash,
        title: item.title,
        url,
        source_name: sourceName,
        image_url: null,
        published_at: item.time
          ? new Date(item.time * 1000).toISOString()
          : new Date().toISOString(),
        excerpt: item.text || null,
      });
    }
  } catch (err) {
    console.error('Hacker News fetch failed:', err);
  }

  return stories;
}
