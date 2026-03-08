import { createHash } from 'crypto';
import { RawStory } from '../db';

const QUERIES = [
  'AI safety incident',
  'artificial intelligence layoffs',
  'AI model behavior',
  'AI ethics controversy',
  'OpenAI controversy',
  'AI regulation concern',
  'AI harm',
  'AI job displacement',
  'artificial intelligence risk',
];

interface NewsAPIArticle {
  title: string;
  url: string;
  source: { name: string };
  urlToImage: string | null;
  publishedAt: string;
  description: string | null;
  content: string | null;
}

export async function fetchFromNewsAPI(): Promise<RawStory[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn('NEWS_API_KEY not set, skipping NewsAPI');
    return [];
  }

  const seen = new Set<string>();
  const stories: RawStory[] = [];

  for (const query of QUERIES) {
    try {
      const params = new URLSearchParams({
        q: query,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: '10',
        apiKey,
      });

      const res = await fetch(`https://newsapi.org/v2/everything?${params}`);
      if (!res.ok) continue;

      const data = await res.json();
      const articles: NewsAPIArticle[] = data.articles ?? [];

      for (const article of articles) {
        if (!article.url || !article.title) continue;
        const urlHash = createHash('sha256').update(article.url).digest('hex');
        if (seen.has(urlHash)) continue;
        seen.add(urlHash);

        stories.push({
          source_id: urlHash,
          title: article.title,
          url: article.url,
          source_name: article.source?.name ?? 'NewsAPI',
          image_url: article.urlToImage,
          published_at: article.publishedAt,
          excerpt: article.description || article.content || null,
        });
      }
    } catch (err) {
      console.error(`NewsAPI query "${query}" failed:`, err);
    }
  }

  return stories;
}
