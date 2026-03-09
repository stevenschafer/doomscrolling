import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, concern_score, category, severity, ai_summary, tags } = await req.json();

  if (!id) {
    return Response.json({ error: 'Missing article id' }, { status: 400 });
  }

  try {
    await db.approveFiltered(id, {
      concern_score: concern_score ?? 40,
      category: category ?? 'uncanny',
      severity: severity ?? 'low',
      ai_summary: ai_summary ?? 'Manually approved from filtered articles.',
      tags: tags ?? [],
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error('Failed to approve filtered article:', err);
    return Response.json(
      { error: 'Failed to approve', message: String(err) },
      { status: 500 }
    );
  }
}
