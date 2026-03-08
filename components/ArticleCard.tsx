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

export function ArticleCard({ article }: { article: Article }) {
  const [imgError, setImgError] = useState(false);

  return (
    <article className="border-b border-border pb-6 mb-6">
      {article.image_url && !imgError && (
        <img
          src={article.image_url}
          alt=""
          className="w-full aspect-video object-cover mb-4"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      )}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold tracking-widest uppercase text-muted">
            {article.category}
          </span>
          <span
            className="text-xs font-mono font-bold px-2 py-0.5 border border-fg text-fg"
            title="Concern level"
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
