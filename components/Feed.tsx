'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Article } from '@/lib/db';
import { ArticleCard } from './ArticleCard';
import { AdSlot } from './AdSlot';

const CATEGORIES = ['all', 'safety', 'labor', 'ethics', 'power', 'misinformation', 'surveillance'];

export function Feed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchArticles = useCallback(async (pageNum: number, cat: string, replace = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum) });
      if (cat !== 'all') params.set('category', cat);

      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      const fetched = data.articles ?? [];

      if (replace) {
        setArticles(fetched);
      } else {
        setArticles((prev) => [...prev, ...fetched]);
      }
      setHasMore(fetched.length === 20);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and category change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchArticles(1, category, true);
  }, [category, fetchArticles]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage((prev) => {
            const next = prev + 1;
            fetchArticles(next, category);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore, category, fetchArticles]);

  return (
    <div>
      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-border pb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`text-xs font-bold tracking-widest uppercase px-3 py-1 border transition-colors ${
              category === cat
                ? 'bg-fg text-bg border-fg'
                : 'bg-transparent text-muted border-border hover:text-fg hover:border-fg'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles */}
      {articles.map((article, i) => (
        <div key={article.id}>
          <ArticleCard article={article} />
          {/* In-feed ad every 10 articles (mobile) */}
          {(i + 1) % 10 === 0 && (
            <div className="my-6 xl:hidden">
              <AdSlot slot="in-feed-mobile" />
            </div>
          )}
        </div>
      ))}

      {loading && (
        <div className="text-center py-8 text-muted text-sm">Loading...</div>
      )}

      {!loading && articles.length === 0 && (
        <div className="text-center py-16 text-muted text-sm">
          No articles yet. Run the ingest pipeline to populate the feed.
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />
    </div>
  );
}
