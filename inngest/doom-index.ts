import { inngest } from './client';
import { getSupabaseAdmin } from '@/lib/db';

const CATEGORIES = ['safety', 'labor', 'ethics', 'power', 'misinformation', 'surveillance'];

// Weights for overall score computation
const CATEGORY_WEIGHTS: Record<string, number> = {
  safety: 1.5,
  labor: 1.0,
  ethics: 1.2,
  power: 1.3,
  misinformation: 1.1,
  surveillance: 1.0,
};

export const computeDoomIndex = inngest.createFunction(
  { id: 'compute-doom-index', name: 'Compute Weekly Doom Index' },
  { cron: 'TZ=America/New_York 0 2 * * 0' }, // Sunday 2am ET
  async ({ step }) => {
    const result = await step.run('compute-scores', async () => {
      const admin = getSupabaseAdmin();

      // Get the start of this past week (Monday to Sunday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek - 6); // Previous Monday
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekStartStr = weekStart.toISOString().split('T')[0];

      // Check if already computed
      const { data: existing } = await admin
        .from('doom_index')
        .select('id')
        .eq('week_start', weekStartStr)
        .maybeSingle();

      if (existing) {
        return { skipped: true, week_start: weekStartStr };
      }

      // Query articles from the past week
      const { data: articles } = await admin
        .from('articles')
        .select('concern_score, category')
        .gte('published_at', weekStart.toISOString())
        .lt('published_at', weekEnd.toISOString())
        .gte('concern_score', 30);

      if (!articles || articles.length === 0) {
        return { skipped: true, reason: 'no articles', week_start: weekStartStr };
      }

      // Compute mean concern score per category
      const categoryScores: Record<string, number> = {};
      const categoryCounts: Record<string, number> = {};

      for (const article of articles) {
        const cat = article.category;
        if (!categoryCounts[cat]) {
          categoryCounts[cat] = 0;
          categoryScores[cat] = 0;
        }
        categoryCounts[cat]++;
        categoryScores[cat] += article.concern_score;
      }

      // Calculate mean per category
      for (const cat of CATEGORIES) {
        if (categoryCounts[cat]) {
          categoryScores[cat] = categoryScores[cat] / categoryCounts[cat];
        } else {
          categoryScores[cat] = 0;
        }
      }

      // Weighted overall score
      let weightedSum = 0;
      let totalWeight = 0;
      for (const cat of CATEGORIES) {
        if (categoryScores[cat] > 0) {
          const weight = CATEGORY_WEIGHTS[cat] ?? 1.0;
          weightedSum += categoryScores[cat] * weight;
          totalWeight += weight;
        }
      }
      const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

      // Insert into doom_index
      const { error } = await admin.from('doom_index').insert({
        week_start: weekStartStr,
        overall_score: Math.round(overallScore * 100) / 100,
        category_scores: categoryScores,
        article_count: articles.length,
      });

      if (error) throw error;

      return {
        week_start: weekStartStr,
        overall_score: Math.round(overallScore * 100) / 100,
        article_count: articles.length,
        category_scores: categoryScores,
      };
    });

    // Trigger synthesis report generation
    if (result && !('skipped' in result && result.skipped)) {
      await step.sendEvent('trigger-synthesis', {
        name: 'synthesis/generate',
        data: { week_start: result.week_start },
      });
    }

    return result;
  }
);
