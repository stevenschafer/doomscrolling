import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { ingestFunction } from '@/inngest/ingest';
import { computeDoomIndex } from '@/inngest/doom-index';
import { dailyBriefing } from '@/inngest/daily-briefing';
import { generateSynthesis } from '@/inngest/synthesis';
import { generatePodcast } from '@/inngest/podcast';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    ingestFunction,
    computeDoomIndex,
    dailyBriefing,
    generateSynthesis,
    generatePodcast,
  ],
});
