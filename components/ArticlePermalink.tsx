'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ShareButton } from './ShareButton';
import type { Article } from '@/lib/db';

function scoreColor(score: number): string {
  const t = Math.max(0, Math.min(1, (score - 40) / 60));
  const hue = 50 * (1 - t);
  return `hsl(${hue}, 90%, 45%)`;
}

function trackOutboundClick(id: string) {
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(`/api/articles/${id}/click`);
  }
}

export function ArticlePermalink({ article }: { article: Article }) {
  const bgColor = scoreColor(article.concern_score);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight hover:no-underline">
          💀 doomscrolling.ai
        </Link>
        <Link href="/" className="text-sm text-muted hover:text-fg">
          All stories
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-16">
        <article className="bg-card-bg rounded-[20px] p-6 flex flex-col gap-5">
          {/* Category + Score */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-[1.2px] uppercase text-muted font-mono">
              {article.category}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-mono border border-border rounded px-2 py-1 flex items-center gap-1">
                <span>💀</span>
                <span>{article.click_count}</span>
              </span>
              <span
                className="text-xs font-mono font-bold text-white rounded px-2 py-1"
                style={{ backgroundColor: bgColor }}
              >
                {article.concern_score}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              onClick={() => trackOutboundClick(article.id)}
            >
              {article.title}
            </a>
          </h1>

          {/* Source + Date */}
          <div className="text-sm text-muted flex items-center gap-2">
            <span>{article.source_name}</span>
            <span>·</span>
            <span>{formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}</span>
          </div>

          {/* Hero image */}
          {article.image_url && (
            <img
              src={article.image_url}
              alt=""
              className="w-full aspect-video object-cover rounded-lg bg-border"
              referrerPolicy="no-referrer"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}

          <p className="text-sm text-muted leading-relaxed">
            {article.ai_summary}
          </p>

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs font-mono text-muted border border-border rounded px-2 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className="flex items-center gap-3 pt-2">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold border border-fg rounded px-4 py-2 btn-invert transition-colors hover:no-underline"
              onClick={() => trackOutboundClick(article.id)}
            >
              Read original
            </a>
            {article.slug && (
              <ShareButton slug={article.slug} title={article.title} />
            )}
          </div>
        </article>

        {/* Feed teaser */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted mb-3">More concerning developments in AI</p>
          <Link
            href="/"
            className="text-sm font-bold border border-fg rounded px-4 py-2 btn-invert transition-colors hover:no-underline inline-block"
          >
            See all stories
          </Link>
        </div>
      </main>
    </div>
  );
}
