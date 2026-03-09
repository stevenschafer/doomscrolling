import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { rescoreArticle } from '@/lib/scorer';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const articles = await db.getArticlesNeedingRescore();

    if (articles.length === 0) {
      return Response.json({ ok: true, rescored: 0, message: 'No articles need rescoring' });
    }

    let rescored = 0;
    const errors: string[] = [];

    for (const article of articles) {
      try {
        const result = await rescoreArticle({
          title: article.title,
          url: article.url,
          source_name: article.source_name,
          published_at: article.published_at,
        });

        await db.updateArticleScoring(article.id, {
          concern_score: Math.max(result.concern_score, 30),
          category: result.category,
          severity: result.severity,
          ai_summary: result.ai_summary,
          tags: result.tags,
        });

        rescored++;
      } catch (err) {
        errors.push(`${article.title}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return Response.json({ ok: true, found: articles.length, rescored, errors });
  } catch (err) {
    console.error('Rescore failed:', err);
    return Response.json(
      { error: 'Rescore failed', message: String(err) },
      { status: 500 }
    );
  }
}
