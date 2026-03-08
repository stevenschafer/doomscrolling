import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const category = searchParams.get('category') ?? undefined;

  try {
    const { articles, total } = await db.getArticles({ page, category });
    return Response.json({ articles, total, page });
  } catch (err) {
    console.error('Articles fetch error:', err);
    return Response.json({ articles: [], total: 0, page, error: String(err) });
  }
}
