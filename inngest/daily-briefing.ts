import { inngest } from './client';
import { getSupabaseAdmin } from '@/lib/db';
import { Resend } from 'resend';

export const dailyBriefing = inngest.createFunction(
  { id: 'daily-briefing', name: 'Send Daily Briefing Email' },
  { cron: 'TZ=America/New_York 0 7 * * *' }, // 7am ET daily
  async ({ step }) => {
    // Fetch top 5 articles from past 24h
    const articles = await step.run('fetch-top-articles', async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await getSupabaseAdmin()
        .from('articles')
        .select('title, url, source_name, concern_score, category, severity, ai_summary')
        .gte('published_at', since)
        .gte('concern_score', 30)
        .order('concern_score', { ascending: false })
        .limit(5);
      return data ?? [];
    });

    if (articles.length === 0) {
      return { skipped: true, reason: 'no articles in past 24h' };
    }

    // Fetch subscribers with daily_briefing_enabled
    const subscribers = await step.run('fetch-subscribers', async () => {
      const { data } = await getSupabaseAdmin()
        .from('subscribers')
        .select('email')
        .eq('status', 'premium')
        .eq('daily_briefing_enabled', true);
      return data ?? [];
    });

    if (subscribers.length === 0) {
      return { skipped: true, reason: 'no subscribers opted in' };
    }

    // Build email HTML
    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const articlesHtml = articles.map(a => `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #e5e5e5;">
          <div style="display: inline-block; font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 4px;">
            ${a.category} · ${a.severity} · ${a.concern_score}
          </div>
          <a href="${a.url}" style="display: block; font-size: 15px; font-weight: bold; color: #000; text-decoration: none; margin-bottom: 4px;">
            ${a.title}
          </a>
          <div style="font-size: 13px; color: #666; line-height: 1.5;">
            ${a.ai_summary}
          </div>
          <div style="font-size: 11px; color: #999; margin-top: 4px;">${a.source_name}</div>
        </td>
      </tr>
    `).join('');

    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="padding: 24px 0; border-bottom: 2px solid #000;">
          <div style="font-size: 18px; font-weight: bold;">💀 doomscrolling.ai</div>
          <div style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Daily Briefing</div>
        </div>
        <div style="padding: 16px 0;">
          <div style="font-size: 13px; color: #888; margin-bottom: 16px;">${dateStr}</div>
          <table style="width: 100%; border-collapse: collapse;">
            ${articlesHtml}
          </table>
        </div>
        <div style="padding: 16px 0; border-top: 1px solid #e5e5e5; font-size: 11px; color: #999; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://doomscrolling.ai'}/account" style="color: #999;">Manage preferences</a>
           ·
          <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://doomscrolling.ai'}" style="color: #999;">doomscrolling.ai</a>
        </div>
      </div>
    `;

    // Send emails in batches
    const sent = await step.run('send-emails', async () => {
      const resend = new Resend(process.env.RESEND_API_KEY);
      let sentCount = 0;

      // Resend supports batch send up to 100
      const batchSize = 100;
      for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize);
        await resend.batch.send(
          batch.map(sub => ({
            from: 'doomscrolling.ai <briefing@doomscrolling.ai>',
            to: sub.email,
            subject: `💀 Daily Briefing — ${articles[0].title}`,
            html,
          }))
        );
        sentCount += batch.length;
      }

      return sentCount;
    });

    return { sent, articles: articles.length };
  }
);
