import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabaseAdmin;
}

export interface Article {
  id: string;
  source_id: string;
  title: string;
  url: string;
  source_name: string;
  image_url: string | null;
  published_at: string;
  ingested_at: string;
  concern_score: number;
  category: string;
  severity: string;
  ai_summary: string;
  tags: string[];
  click_count: number;
  is_featured: boolean;
  slug: string | null;
  permalink_view_count: number;
}

export interface FilteredArticle {
  id: string;
  source_id: string;
  title: string;
  url: string;
  source_name: string;
  published_at: string | null;
  ingested_at: string;
  filter_reason: string;
  raw_score: number | null;
  claude_response: Record<string, unknown> | null;
}

export interface RawStory {
  source_id: string;
  title: string;
  url: string;
  source_name: string;
  image_url?: string | null;
  published_at: string;
  excerpt?: string | null;
}

export const db = {
  async isAlreadyProcessed(sourceId: string): Promise<boolean> {
    const { data: article } = await getSupabaseAdmin()
      .from('articles')
      .select('id')
      .eq('source_id', sourceId)
      .maybeSingle();

    if (article) return true;

    const { data: filtered } = await getSupabaseAdmin()
      .from('filtered_articles')
      .select('id')
      .eq('source_id', sourceId)
      .maybeSingle();

    return !!filtered;
  },

  async insertArticle(article: {
    source_id: string;
    title: string;
    url: string;
    source_name: string;
    image_url?: string | null;
    published_at: string;
    concern_score: number;
    category: string;
    severity: string;
    ai_summary: string;
    tags: string[];
    slug?: string;
  }) {
    const { error } = await getSupabaseAdmin().from('articles').insert(article);

    if (error?.code === '23505' && error.message.includes('slug') && article.slug) {
      // Slug collision — retry with hash fallback
      const { generateSlugWithFallback } = await import('./slugify');
      const fallbackSlug = generateSlugWithFallback(
        article.title,
        article.published_at,
        article.url
      );
      const { error: retryError } = await getSupabaseAdmin()
        .from('articles')
        .insert({ ...article, slug: fallbackSlug });
      if (retryError) throw retryError;
      return;
    }

    if (error) throw error;
  },

  async updateArticleScoring(id: string, data: {
    concern_score: number;
    category: string;
    severity: string;
    ai_summary: string;
    tags: string[];
  }) {
    const { error } = await getSupabaseAdmin()
      .from('articles')
      .update(data)
      .eq('id', id);
    if (error) throw error;
  },

  async getArticlesNeedingRescore() {
    const { data, error } = await getSupabaseAdmin()
      .from('articles')
      .select('*')
      .or('concern_score.lt.30,ai_summary.eq.Manually approved from filtered articles.');
    if (error) throw error;
    return data as Article[];
  },

  async insertFiltered(filtered: {
    source_id: string;
    title: string;
    url: string;
    source_name: string;
    published_at?: string | null;
    filter_reason: string;
    raw_score?: number | null;
    claude_response?: Record<string, unknown> | null;
  }) {
    const { error } = await getSupabaseAdmin().from('filtered_articles').insert(filtered);
    if (error) throw error;
  },

  async getArticles({
    page = 1,
    limit = 20,
    category,
    sort = 'latest',
  }: {
    page?: number;
    limit?: number;
    category?: string;
    sort?: string;
  }) {
    let query = getSupabaseAdmin()
      .from('articles')
      .select('*', { count: 'exact' })
      .gte('concern_score', 30);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    switch (sort) {
      case 'score_high':
        query = query.order('concern_score', { ascending: false });
        break;
      case 'most_clicked':
        query = query.order('click_count', { ascending: false });
        break;
      case 'severity':
        // Order by severity using a custom approach — critical > high > medium > low
        // Supabase doesn't support custom enum ordering, so we sort by concern_score as proxy
        // and add severity as a hint (critical items tend to have higher scores)
        query = query
          .order('severity', { ascending: true })
          .order('concern_score', { ascending: false });
        break;
      case 'latest':
      default:
        query = query.order('published_at', { ascending: false });
        break;
    }

    // Secondary sort for stability
    if (sort !== 'latest') {
      query = query.order('published_at', { ascending: false });
    }

    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    return { articles: data as Article[], total: count ?? 0 };
  },

  async incrementClick(id: string) {
    const { error } = await getSupabaseAdmin().rpc('increment_click_count', { article_id: id });
    if (error) {
      // Fallback if RPC doesn't exist
      const { data } = await getSupabaseAdmin()
        .from('articles')
        .select('click_count')
        .eq('id', id)
        .single();
      if (data) {
        await getSupabaseAdmin()
          .from('articles')
          .update({ click_count: (data.click_count || 0) + 1 })
          .eq('id', id);
      }
    }
  },

  async getArticleBySlug(slug: string): Promise<Article | null> {
    const { data, error } = await getSupabaseAdmin()
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return data as Article;
  },

  async incrementPermalinkViews(id: string) {
    const { error } = await getSupabaseAdmin().rpc('increment_permalink_views', { article_id: id });
    if (error) {
      // Fallback if RPC doesn't exist
      const { data } = await getSupabaseAdmin()
        .from('articles')
        .select('permalink_view_count')
        .eq('id', id)
        .single();
      if (data) {
        await getSupabaseAdmin()
          .from('articles')
          .update({ permalink_view_count: (data.permalink_view_count || 0) + 1 })
          .eq('id', id);
      }
    }
  },

  async getFilteredArticles({ page = 1, limit = 50 }: { page?: number; limit?: number }) {
    const { data, count, error } = await getSupabaseAdmin()
      .from('filtered_articles')
      .select('*', { count: 'exact' })
      .order('ingested_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    if (error) throw error;
    return { articles: data as FilteredArticle[], total: count ?? 0 };
  },

  async approveFiltered(id: string, articleData: {
    concern_score: number;
    category: string;
    severity: string;
    ai_summary: string;
    tags: string[];
  }) {
    const { data: filtered, error: fetchError } = await getSupabaseAdmin()
      .from('filtered_articles')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError || !filtered) throw fetchError || new Error('Not found');

    await db.insertArticle({
      source_id: filtered.source_id,
      title: filtered.title,
      url: filtered.url,
      source_name: filtered.source_name,
      image_url: null,
      published_at: filtered.published_at || new Date().toISOString(),
      ...articleData,
    });

    const { error: deleteError } = await getSupabaseAdmin()
      .from('filtered_articles')
      .delete()
      .eq('id', id);
    if (deleteError) throw deleteError;
  },
};
