import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db';
import { generateSlug, generateSlugWithFallback } from '@/lib/slugify';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, published_at, url')
    .is('slug', null);

  if (!articles?.length) {
    return NextResponse.json({ message: 'No articles need slug backfill.' });
  }

  const seen = new Set<string>();
  const results: string[] = [];

  for (const article of articles) {
    let slug = generateSlug(article.title, article.published_at);
    if (seen.has(slug)) {
      slug = generateSlugWithFallback(article.title, article.published_at, article.url);
    }
    seen.add(slug);

    const { error } = await supabase.from('articles').update({ slug }).eq('id', article.id);
    if (error) {
      results.push(`ERROR ${article.id}: ${error.message}`);
    } else {
      results.push(slug);
    }
  }

  return NextResponse.json({ backfilled: results.length, slugs: results });
}
