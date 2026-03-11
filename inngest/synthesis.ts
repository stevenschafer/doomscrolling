import { inngest } from './client';
import { getSupabaseAdmin } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';

export const generateSynthesis = inngest.createFunction(
  { id: 'generate-synthesis', name: 'Generate Weekly Synthesis Report' },
  { event: 'synthesis/generate' },
  async ({ event, step }) => {
    const weekStart = event.data.week_start as string;

    const reportData = await step.run('generate-report', async () => {
      const admin = getSupabaseAdmin();

      // Check if already generated
      const { data: existing } = await admin
        .from('synthesis_reports')
        .select('id')
        .eq('week_start', weekStart)
        .maybeSingle();

      if (existing) return { skipped: true };

      // Fetch doom index for this week
      const { data: doomIndex } = await admin
        .from('doom_index')
        .select('*')
        .eq('week_start', weekStart)
        .single();

      // Fetch all articles from this week
      const weekStartDate = new Date(weekStart);
      const weekEnd = new Date(weekStartDate);
      weekEnd.setDate(weekStartDate.getDate() + 7);

      const { data: articles } = await admin
        .from('articles')
        .select('title, url, source_name, concern_score, category, severity, ai_summary')
        .gte('published_at', weekStartDate.toISOString())
        .lt('published_at', weekEnd.toISOString())
        .gte('concern_score', 30)
        .order('concern_score', { ascending: false });

      if (!articles || articles.length === 0) {
        return { skipped: true, reason: 'no articles' };
      }

      // Build prompt
      const articleSummaries = articles.map(a =>
        `- [${a.category}/${a.severity}] (score: ${a.concern_score}) ${a.title} — ${a.ai_summary}`
      ).join('\n');

      const doomInfo = doomIndex
        ? `Doom Index for this week: ${doomIndex.overall_score} (categories: ${JSON.stringify(doomIndex.category_scores)})`
        : 'No Doom Index available.';

      const anthropic = new Anthropic();
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: `You are the editor of doomscrolling.ai, a news site tracking concerning AI developments. Write a weekly synthesis report for the week of ${weekStart}.

${doomInfo}

Articles this week (${articles.length} total):
${articleSummaries}

Write an executive summary and analysis in markdown format with these sections:
# Week of [date] — [punchy title]
## Executive Summary
(2-3 paragraphs summarizing the week's most important developments)
## Category Analysis
(For each active category, a brief analysis of trends and key stories)
## Trends
(Cross-cutting themes and patterns emerging this week)
## Outlook
(What to watch for next week based on this week's developments)

Keep it insightful, analytical, and slightly ominous in tone. About 800-1200 words total.`
        }],
      });

      const content = message.content[0].type === 'text' ? message.content[0].text : '';

      // Extract title from first heading
      const titleMatch = content.match(/^#\s+(.+)/m);
      const title = titleMatch ? titleMatch[1] : `Week of ${weekStart}`;

      // Insert report
      const { error } = await admin.from('synthesis_reports').insert({
        week_start: weekStart,
        title,
        content,
        doom_index_id: doomIndex?.id ?? null,
      });

      if (error) throw error;

      return { week_start: weekStart, title };
    });

    // Send weekly digest emails after synthesis is generated
    if (reportData && !('skipped' in reportData && reportData.skipped)) {
      await step.run('send-weekly-digest', async () => {
        const admin = getSupabaseAdmin();

        const { data: subscribers } = await admin
          .from('subscribers')
          .select('email')
          .eq('status', 'premium')
          .eq('weekly_digest_enabled', true);

        if (!subscribers || subscribers.length === 0) return { sent: 0 };

        const { data: doomIndex } = await admin
          .from('doom_index')
          .select('overall_score')
          .eq('week_start', weekStart)
          .single();

        const { data: podcast } = await admin
          .from('podcast_episodes')
          .select('title')
          .eq('week_start', weekStart)
          .eq('status', 'ready')
          .maybeSingle();

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://doomscrolling.ai';
        const score = doomIndex?.overall_score ?? '—';

        const html = `
          <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="padding: 24px 0; border-bottom: 2px solid #000;">
              <div style="font-size: 18px; font-weight: bold;">💀 doomscrolling.ai</div>
              <div style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Weekly Digest</div>
            </div>
            <div style="padding: 24px 0;">
              <div style="text-align: center; padding: 24px; border: 1px solid #e5e5e5; border-radius: 8px; margin-bottom: 24px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-bottom: 8px;">Doom Index</div>
                <div style="font-size: 48px; font-weight: bold;">${score}</div>
              </div>
              <div style="margin-bottom: 16px;">
                <div style="font-weight: bold; margin-bottom: 4px;">📊 Weekly Synthesis</div>
                <div style="font-size: 14px; color: #666;">
                  ${(reportData as { title: string }).title}
                </div>
                <a href="${baseUrl}/account" style="font-size: 13px; color: #000;">Read the full report →</a>
              </div>
              ${podcast ? `
              <div style="margin-bottom: 16px;">
                <div style="font-weight: bold; margin-bottom: 4px;">🎙️ Weekly Podcast</div>
                <div style="font-size: 14px; color: #666;">${podcast.title}</div>
                <a href="${baseUrl}/account" style="font-size: 13px; color: #000;">Listen now →</a>
              </div>
              ` : ''}
            </div>
            <div style="padding: 16px 0; border-top: 1px solid #e5e5e5; font-size: 11px; color: #999; text-align: center;">
              <a href="${baseUrl}/account" style="color: #999;">Manage preferences</a>
            </div>
          </div>
        `;

        const resend = new Resend(process.env.RESEND_API_KEY);
        const batchSize = 100;
        let sentCount = 0;

        for (let i = 0; i < subscribers.length; i += batchSize) {
          const batch = subscribers.slice(i, i + batchSize);
          await resend.batch.send(
            batch.map(sub => ({
              from: 'doomscrolling.ai <digest@doomscrolling.ai>',
              to: sub.email,
              subject: `💀 Weekly Digest — Doom Index: ${score}`,
              html,
            }))
          );
          sentCount += batch.length;
        }

        return { sent: sentCount };
      });

      // Trigger podcast generation
      await step.sendEvent('trigger-podcast', {
        name: 'podcast/generate',
        data: { week_start: weekStart },
      });
    }

    return reportData;
  }
);
