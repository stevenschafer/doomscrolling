import { NextRequest } from 'next/server';
import { runIngest } from '@/lib/ingest';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
    ?? req.nextUrl.searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runIngest();
    return Response.json(result);
  } catch (err) {
    console.error('Ingest failed:', err);
    return Response.json(
      { error: 'Ingest failed', message: String(err) },
      { status: 500 }
    );
  }
}
