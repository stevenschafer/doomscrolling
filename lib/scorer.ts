import Anthropic from '@anthropic-ai/sdk';
import { RawStory, db } from './db';

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are the editorial filter for doomscrolling.ai — a news feed dedicated to surfacing real, concerning developments in AI. Your job is to evaluate whether a story belongs in the feed and how alarming it is.

The feed covers: model safety failures, AI-enabled harm, controversial company decisions, labor displacement, regulatory failures, surveillance, AI misinformation, and concentration of power.

The feed does NOT cover: product launches, fundraising announcements, research breakthroughs (unless they raise safety concerns), AI art, general tech news, or AI hype.

Be skeptical of PR spin. Prioritize actual documented harm over speculation. A story about a real person harmed by AI scores higher than a think-piece about hypothetical risk.

Return ONLY valid JSON with no additional text.`;

function buildUserPrompt(story: RawStory): string {
  return `Evaluate this article for doomscrolling.ai:

Title: ${story.title}
Source: ${story.source_name}
Published: ${story.published_at}
Excerpt: ${story.excerpt?.slice(0, 800) ?? 'No excerpt available'}

Return a JSON object:
{
  "is_relevant": boolean,
  "filter_reason": string | null,
  "concern_score": number,
  "category": "safety" | "labor" | "ethics" | "power" | "misinformation" | "surveillance",
  "severity": "low" | "medium" | "high" | "critical",
  "ai_summary": string,
  "tags": string[]
}`;
}

interface ScoreResult {
  is_relevant: boolean;
  filter_reason: string | null;
  concern_score: number;
  category: string;
  severity: string;
  ai_summary: string;
  tags: string[];
}

export interface ScoredStory extends RawStory {
  filtered: boolean;
  concern_score?: number;
  category?: string;
  severity?: string;
  ai_summary?: string;
  tags?: string[];
}

async function scoreStory(story: RawStory): Promise<ScoredStory> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(story) }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const result: ScoreResult = JSON.parse(text);

  if (!result.is_relevant) {
    await db.insertFiltered({
      source_id: story.source_id,
      title: story.title,
      url: story.url,
      source_name: story.source_name,
      published_at: story.published_at,
      filter_reason: result.filter_reason ?? 'Not relevant',
      raw_score: result.concern_score,
      claude_response: result as unknown as Record<string, unknown>,
    });
    return { ...story, filtered: true };
  }

  await db.insertArticle({
    source_id: story.source_id,
    title: story.title,
    url: story.url,
    source_name: story.source_name,
    image_url: story.image_url,
    published_at: story.published_at,
    concern_score: result.concern_score,
    category: result.category,
    severity: result.severity,
    ai_summary: result.ai_summary,
    tags: result.tags,
  });

  return { ...story, filtered: false, ...result };
}

export async function scoreStories(stories: RawStory[]): Promise<{
  scored: number;
  approved: number;
  filtered: number;
  errors: number;
}> {
  let approved = 0;
  let filtered = 0;
  let errors = 0;

  // Process in batches of 10 with 1s delay between batches
  for (let i = 0; i < stories.length; i += 10) {
    const batch = stories.slice(i, i + 10);

    const results = await Promise.allSettled(batch.map(scoreStory));

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.filtered) filtered++;
        else approved++;
      } else {
        errors++;
        console.error('Scoring error:', result.reason);
      }
    }

    // 1s delay between batches
    if (i + 10 < stories.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { scored: stories.length, approved, filtered, errors };
}
