import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { ingestFunction } from '@/inngest/ingest';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [ingestFunction],
});
