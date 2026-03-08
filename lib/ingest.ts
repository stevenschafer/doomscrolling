import { db, RawStory } from './db';
import { fetchFromNewsAPI } from './sources/newsapi';
import { fetchFromRSS } from './sources/rss';
import { fetchFromAIID } from './sources/aiid';
import { scoreStories } from './scorer';

export async function runIngest() {
  // Fetch from all sources in parallel
  const [newsapiStories, rssStories, aiidStories] = await Promise.all([
    fetchFromNewsAPI(),
    fetchFromRSS(),
    fetchFromAIID(),
  ]);

  const allStories = [...newsapiStories, ...rssStories, ...aiidStories];
  console.log(`Fetched ${allStories.length} total stories`);

  // Deduplicate by source_id
  const uniqueMap = new Map<string, RawStory>();
  for (const story of allStories) {
    if (!uniqueMap.has(story.source_id)) {
      uniqueMap.set(story.source_id, story);
    }
  }
  const unique = Array.from(uniqueMap.values());
  console.log(`${unique.length} unique stories after dedup`);

  // Filter out already-processed stories
  const newStories: RawStory[] = [];
  for (const story of unique) {
    const exists = await db.isAlreadyProcessed(story.source_id);
    if (!exists) newStories.push(story);
  }
  console.log(`${newStories.length} new stories to score`);

  if (newStories.length === 0) {
    return { fetched: allStories.length, scored: 0, approved: 0, filtered: 0 };
  }

  const results = await scoreStories(newStories);

  return {
    fetched: allStories.length,
    ...results,
  };
}
