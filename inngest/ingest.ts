import { inngest } from './client';
import { db, RawStory } from '@/lib/db';
import { fetchFromNewsAPI } from '@/lib/sources/newsapi';
import { fetchFromRSS } from '@/lib/sources/rss';
import { fetchFromAIID } from '@/lib/sources/aiid';
import { fetchOgImage } from '@/lib/sources/og';
import { scoreStory } from '@/lib/scorer';

export const ingestFunction = inngest.createFunction(
  {
    id: 'ingest-news',
    concurrency: [{ limit: 1 }],
  },
  { event: 'ingest/run' },
  async ({ step }) => {
    // Step 1: Fetch from all sources
    const allStories = await step.run('fetch-sources', async () => {
      const [newsapiStories, rssStories, aiidStories] = await Promise.all([
        fetchFromNewsAPI(),
        fetchFromRSS(),
        fetchFromAIID(),
      ]);

      const combined = [...newsapiStories, ...rssStories, ...aiidStories];
      console.log(`Fetched ${combined.length} total stories`);

      // Deduplicate by source_id
      const uniqueMap = new Map<string, RawStory>();
      for (const story of combined) {
        if (!uniqueMap.has(story.source_id)) {
          uniqueMap.set(story.source_id, story);
        }
      }
      return Array.from(uniqueMap.values());
    });

    // Step 2: Filter out already-processed stories
    const newStories = await step.run('filter-existing', async () => {
      const fresh: RawStory[] = [];
      for (const story of allStories) {
        const exists = await db.isAlreadyProcessed(story.source_id);
        if (!exists) fresh.push(story);
      }
      console.log(`${fresh.length} new stories to score`);
      return fresh;
    });

    if (newStories.length === 0) {
      return { fetched: allStories.length, scored: 0, approved: 0, filtered: 0, errors: 0 };
    }

    // Step 2.5: Fetch OG images for stories missing image_url
    const storiesWithImages = await step.run('fetch-og-images', async () => {
      const results: RawStory[] = [];
      for (const story of newStories) {
        if (!story.image_url) {
          try {
            story.image_url = await fetchOgImage(story.url);
          } catch {
            // Skip silently — image fetching should never block ingestion
          }
        }
        results.push(story);
      }
      return results;
    });

    // Step 3: Score each story individually
    let approved = 0;
    let filtered = 0;
    let errors = 0;

    for (let i = 0; i < storiesWithImages.length; i++) {
      const story = storiesWithImages[i];
      const result = await step.run(`score-${i}-${story.source_id.slice(0, 8)}`, async () => {
        try {
          const scored = await scoreStory(story);
          return scored.filtered ? 'filtered' : 'approved';
        } catch (err) {
          console.error(`Failed to score "${story.title}":`, err);
          return `error: ${err instanceof Error ? err.message : JSON.stringify(err)}`;
        }
      });

      if (result === 'approved') approved++;
      else if (result === 'filtered') filtered++;
      else {
        errors++;
        console.error(`Score step result: ${result}`);
      }
    }

    return {
      fetched: allStories.length,
      scored: storiesWithImages.length,
      approved,
      filtered,
      errors,
    };
  }
);
