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
  const t = Math.max(0, Math.min(1, (score - 40) / 60));
  const hue = 50 * (1 - t);
  return `hsl(${hue}, 90%, 45%)`;
}

export function ArticleCard({ article }: { article: Article }) {
  const [imgError, setImgError] = useState(false);
  const bgColor = scoreColor(article.concern_score);

  return (
    <article className="bg-card-bg rounded-[20px] pt-4 pb-4 px-4 flex flex-col gap-4">
      {article.image_url && !imgError && (
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick(article.id)}
        >
          <img
            src={article.image_url}
            alt=""
            className="w-full aspect-video object-cover rounded-lg bg-border"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        </a>
      )}
      <div className="flex flex-col gap-2">
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
              title={`Concern level — ${article.severity}`}
            >
              {article.concern_score}
            </span>
          </div>
        </div>
        <h2 className="text-xl font-bold leading-[25px]">
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
        <p className="text-sm text-muted leading-[20px] tracking-[-0.1px]">
          {article.ai_summary}
        </p>
        <footer className="text-xs text-muted flex items-center gap-2">
          <span>{article.source_name}</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}</span>
        </footer>
      </div>
    </article>
  );
}
