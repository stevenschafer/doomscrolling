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
  }) {
    const { error } = await getSupabaseAdmin().from('articles').insert(article);
    if (error) throw error;
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
  }: {
    page?: number;
    limit?: number;
    category?: string;
  }) {
    let query = getSupabaseAdmin()
      .from('articles')
      .select('*', { count: 'exact' })
      .gte('concern_score', 50)
      .order('concern_score', { ascending: false })
      .order('ingested_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

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
