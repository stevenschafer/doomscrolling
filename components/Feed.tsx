'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Article } from '@/lib/db';
import { ArticleCard } from './ArticleCard';
import { AdSlot } from './AdSlot';

const CATEGORIES = ['all', 'safety', 'labor', 'ethics', 'power', 'misinformation', 'surveillance'];

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'score_high', label: 'Score (High to Low)' },
  { value: 'most_clicked', label: 'Most Clicked' },
  { value: 'severity', label: 'Severity' },
] as const;

export function Feed({ isPremium = false }: { isPremium?: boolean }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('latest');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchArticles = useCallback(async (pageNum: number, cat: string, sortBy: string, replace = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum) });
      if (cat !== 'all') params.set('category', cat);
      if (sortBy !== 'latest') params.set('sort', sortBy);

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

  // Initial load and category/sort change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchArticles(1, category, sort, true);
  }, [category, sort, fetchArticles]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage((prev) => {
            const next = prev + 1;
            fetchArticles(next, category, sort);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore, category, sort, fetchArticles]);

  return (
    <div>
      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-4 border-b border-border pb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`text-xs font-bold tracking-[1.2px] uppercase font-mono px-3 py-1 border rounded transition-colors ${
              category === cat
                ? 'bg-fg text-bg border-fg'
                : 'bg-transparent text-muted border-border hover:text-fg hover:border-fg'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <div className="flex items-center gap-2 mb-8">
        <span className="text-xs text-muted uppercase tracking-widest font-bold">Sort</span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-xs font-bold tracking-[1.2px] uppercase font-mono px-3 py-1 pr-8 border border-border rounded bg-transparent text-fg cursor-pointer transition-colors hover:border-fg focus:border-fg focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23888%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Articles */}
      <div className="flex flex-col gap-4">
        {articles.map((article, i) => (
          <div key={article.id}>
            <ArticleCard article={article} />
            {/* In-feed ad every 10 articles (mobile, non-premium only) */}
            {!isPremium && (i + 1) % 10 === 0 && (
              <div className="mt-4 xl:hidden">
                <AdSlot slot="in-feed-mobile" />
              </div>
            )}
          </div>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8 text-muted text-sm">Loading...</div>
      )}

      {!loading && articles.length === 0 && (
        <div className="text-center py-16 text-muted text-sm">
          No articles yet.
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />
    </div>
  );
}
