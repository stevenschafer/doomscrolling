import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await db.incrementClick(id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error('Click tracking error:', err);
    return Response.json({ error: 'Failed to track click' }, { status: 500 });
  }
}
