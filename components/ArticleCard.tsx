'use client';

import { formatDistanceToNow } from 'date-fns';
import { Article } from '@/lib/db';
import { useState } from 'react';

function trackClick(id: string) {
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(`/api/articles/${id}/click`);
  } else {
    fetch(`/api/articles/${id}/click`, { method: 'POST' }).catch(() => {});
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-severity-critical border-severity-critical';
  if (score >= 65) return 'text-severity-high border-severity-high';
  if (score >= 50) return 'text-severity-medium border-severity-medium';
  return 'text-severity-low border-severity-low';
}

export function ArticleCard({ article }: { article: Article }) {
  const [imgError, setImgError] = useState(false);
  const scoreClasses = scoreColor(article.concern_score);

  return (
    <article className="border-b border-border pb-6 mb-6">
      {article.image_url && !imgError ? (
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick(article.id)}
        >
          <img
            src={article.image_url}
            alt=""
            className="w-full aspect-video object-cover mb-4 bg-border"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        </a>
      ) : (
        <div className="w-full aspect-video bg-border mb-4" aria-hidden="true" />
      )}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold tracking-widest uppercase text-muted">
            {article.category}
          </span>
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 border ${scoreClasses}`}
            title={`Concern level — ${article.severity}`}
          >
            {article.concern_score}
          </span>
        </div>
        <h2 className="text-xl font-bold leading-tight mb-2">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick(article.id)}
            className="hover:underline"
          >
            {article.title}
          </a>
        </h2>
        <p className="text-sm text-muted leading-relaxed mb-3">
          {article.ai_summary}
        </p>
        <footer className="text-xs text-muted flex items-center gap-2">
          <span>{article.source_name}</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}</span>
          <span>·</span>
          <span>{article.click_count} clicks</span>
        </footer>
      </div>
    </article>
  );
}
