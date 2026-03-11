import { inngest } from './client';
import { getSupabaseAdmin } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export const generatePodcast = inngest.createFunction(
  { id: 'generate-podcast', name: 'Generate Weekly Podcast' },
  { event: 'podcast/generate' },
  async ({ event, step }) => {
    const weekStart = event.data.week_start as string;

    // Create episode record
    const episodeId = await step.run('create-episode', async () => {
      const admin = getSupabaseAdmin();

      const { data: existing } = await admin
        .from('podcast_episodes')
        .select('id')
        .eq('week_start', weekStart)
        .maybeSingle();

      if (existing) return null;

      const { data, error } = await admin
        .from('podcast_episodes')
        .insert({
          week_start: weekStart,
          title: `Week of ${weekStart}`,
          status: 'generating',
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    });

    if (!episodeId) return { skipped: true };

    // Generate script with Claude
    const script = await step.run('generate-script', async () => {
      const admin = getSupabaseAdmin();

      // Fetch synthesis report and doom index
      const { data: report } = await admin
        .from('synthesis_reports')
        .select('title, content')
        .eq('week_start', weekStart)
        .single();

      const { data: doomIndex } = await admin
        .from('doom_index')
        .select('overall_score, category_scores')
        .eq('week_start', weekStart)
        .single();

      // Fetch top articles
      const weekStartDate = new Date(weekStart);
      const weekEnd = new Date(weekStartDate);
      weekEnd.setDate(weekStartDate.getDate() + 7);

      const { data: articles } = await admin
        .from('articles')
        .select('title, concern_score, category, ai_summary')
        .gte('published_at', weekStartDate.toISOString())
        .lt('published_at', weekEnd.toISOString())
        .gte('concern_score', 30)
        .order('concern_score', { ascending: false })
        .limit(10);

      const anthropic = new Anthropic();
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `You are writing a podcast script for doomscrolling.ai's weekly AI doom recap. Two hosts: Alex (measured, analytical) and Jordan (more alarmed, sardonic). The podcast should be 10-15 minutes when read aloud (~2000 words).

Week of ${weekStart}
Doom Index: ${doomIndex?.overall_score ?? 'unavailable'}
${doomIndex?.category_scores ? `Category scores: ${JSON.stringify(doomIndex.category_scores)}` : ''}

${report ? `Synthesis report:\n${report.content}` : ''}

Top stories:
${(articles ?? []).map(a => `- [${a.category}] (${a.concern_score}) ${a.title}: ${a.ai_summary}`).join('\n')}

Write the script as alternating dialogue. Format each line as:
ALEX: [dialogue]
JORDAN: [dialogue]

Start with a brief intro/greeting, cover the Doom Index, discuss the top 3-4 stories, analyze trends, and end with an ominous sign-off. Keep it conversational but informative. Dark humor welcome.`
        }],
      });

      const scriptText = message.content[0].type === 'text' ? message.content[0].text : '';

      // Update episode with script and title
      const titleMatch = report?.title ?? `Doom Index at ${doomIndex?.overall_score ?? '?'} — Week of ${weekStart}`;
      await admin
        .from('podcast_episodes')
        .update({
          script: scriptText,
          title: titleMatch,
          description: `Weekly AI doom recap for the week of ${weekStart}. Doom Index: ${doomIndex?.overall_score ?? '?'}.`,
        })
        .eq('id', episodeId);

      return scriptText;
    });

    // Generate audio with OpenAI TTS
    await step.run('generate-audio', async () => {
      const admin = getSupabaseAdmin();
      const openai = new OpenAI();

      // Parse script into segments
      const lines = script.split('\n').filter(l => l.trim());
      const segments: { voice: 'alloy' | 'onyx'; text: string }[] = [];

      for (const line of lines) {
        if (line.startsWith('ALEX:')) {
          segments.push({ voice: 'alloy', text: line.replace('ALEX:', '').trim() });
        } else if (line.startsWith('JORDAN:')) {
          segments.push({ voice: 'onyx', text: line.replace('JORDAN:', '').trim() });
        }
      }

      if (segments.length === 0) {
        throw new Error('No dialogue segments found in script');
      }

      // Generate audio for each segment
      const audioBuffers: Buffer[] = [];
      for (const segment of segments) {
        const response = await openai.audio.speech.create({
          model: 'tts-1-hd',
          voice: segment.voice,
          input: segment.text,
          response_format: 'mp3',
        });

        const buffer = Buffer.from(await response.arrayBuffer());
        audioBuffers.push(buffer);
      }

      // Concatenate MP3 buffers (simple concatenation works for MP3)
      const fullAudio = Buffer.concat(audioBuffers);

      // Upload to Supabase Storage
      const filename = `podcast-${weekStart}.mp3`;
      const { error: uploadError } = await admin.storage
        .from('podcast')
        .upload(filename, fullAudio, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Estimate duration (~150 words per minute)
      const wordCount = segments.reduce((sum, s) => sum + s.text.split(/\s+/).length, 0);
      const durationSeconds = Math.round((wordCount / 150) * 60);

      // Store the storage path (not a public URL) — signed URLs generated on demand
      await admin
        .from('podcast_episodes')
        .update({
          audio_url: filename,
          duration_seconds: durationSeconds,
          status: 'ready',
        })
        .eq('id', episodeId);

      return { duration_seconds: durationSeconds, segments: segments.length };
    });

    return { episodeId, week_start: weekStart };
  }
);
