import { NextRequest } from 'next/server';
import { inngest } from '@/inngest/client';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
    ?? req.nextUrl.searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await inngest.send({ name: 'ingest/run', data: {} });
    return Response.json({ ok: true, message: 'Ingest triggered' });
  } catch (err) {
    console.error('Failed to trigger ingest:', err);
    return Response.json(
      { error: 'Failed to trigger ingest', message: String(err) },
      { status: 500 }
    );
  }
}
