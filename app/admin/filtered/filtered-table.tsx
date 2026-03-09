'use client';

import { useState } from 'react';

interface FilteredArticle {
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

type SortColumn = 'title' | 'source' | 'date' | 'score';
type SortDirection = 'asc' | 'desc';

function extractTLD(sourceName: string): string {
  try {
    // If it looks like a domain, extract TLD
    const cleaned = sourceName.replace(/^www\./, '').toLowerCase();
    const parts = cleaned.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return cleaned;
  } catch {
    return sourceName.toLowerCase();
  }
}

function sortArticles(
  articles: FilteredArticle[],
  column: SortColumn | null,
  direction: SortDirection
): FilteredArticle[] {
  if (!column) return articles;

  return [...articles].sort((a, b) => {
    const dir = direction === 'asc' ? 1 : -1;

    switch (column) {
      case 'title':
        return dir * a.title.localeCompare(b.title);
      case 'source': {
        const aTLD = extractTLD(a.source_name);
        const bTLD = extractTLD(b.source_name);
        return dir * aTLD.localeCompare(bTLD);
      }
      case 'date': {
        const aDate = a.published_at ? new Date(a.published_at).getTime() : 0;
        const bDate = b.published_at ? new Date(b.published_at).getTime() : 0;
        return dir * (aDate - bDate);
      }
      case 'score': {
        const aScore = a.raw_score ?? -1;
        const bScore = b.raw_score ?? -1;
        return dir * (aScore - bScore);
      }
      default:
        return 0;
    }
  });
}

function Caret({ direction }: { direction: SortDirection }) {
  return (
    <span className="inline-block ml-1 text-xs">
      {direction === 'asc' ? '▲' : '▼'}
    </span>
  );
}

export function FilteredTable({ articles, secret }: { articles: FilteredArticle[]; secret: string }) {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [approving, setApproving] = useState<string | null>(null);
  const [approved, setApproved] = useState<Set<string>>(new Set());

  async function handleApprove(article: FilteredArticle) {
    setApproving(article.id);
    try {
      const claude = article.claude_response;
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify({
          id: article.id,
          concern_score: Math.max(Number(claude?.concern_score ?? article.raw_score ?? 40), 40),
          category: claude?.category ?? 'uncanny',
          severity: claude?.severity ?? 'low',
          ai_summary: claude?.ai_summary ?? 'Manually approved from filtered articles.',
          tags: claude?.tags ?? [],
        }),
      });
      if (res.ok) {
        setApproved((prev) => new Set(prev).add(article.id));
      }
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setApproving(null);
    }
  }

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection(column === 'score' ? 'desc' : 'asc');
    }
  }

  const sorted = sortArticles(articles, sortColumn, sortDirection);

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-border text-left">
          <th
            className="py-2 pr-4 cursor-pointer select-none hover:text-fg/70"
            onClick={() => handleSort('title')}
          >
            Title{sortColumn === 'title' && <Caret direction={sortDirection} />}
          </th>
          <th
            className="py-2 pr-4 cursor-pointer select-none hover:text-fg/70"
            onClick={() => handleSort('source')}
          >
            Source{sortColumn === 'source' && <Caret direction={sortDirection} />}
          </th>
          <th
            className="py-2 pr-4 cursor-pointer select-none hover:text-fg/70"
            onClick={() => handleSort('date')}
          >
            Date{sortColumn === 'date' && <Caret direction={sortDirection} />}
          </th>
          <th className="py-2 pr-4">Reason</th>
          <th
            className="py-2 pr-4 cursor-pointer select-none hover:text-fg/70"
            onClick={() => handleSort('score')}
          >
            Score{sortColumn === 'score' && <Caret direction={sortDirection} />}
          </th>
          <th className="py-2 pr-4">Link</th>
          <th className="py-2"></th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((a) => (
          <tr key={a.id} className="border-b border-border">
            <td className="py-2 pr-4 max-w-[300px] truncate">{a.title}</td>
            <td className="py-2 pr-4 text-muted">{a.source_name}</td>
            <td className="py-2 pr-4 text-muted whitespace-nowrap">
              {a.published_at ? new Date(a.published_at).toLocaleDateString() : '—'}
            </td>
            <td className="py-2 pr-4 text-muted max-w-[300px]">{a.filter_reason}</td>
            <td className="py-2 pr-4 font-mono">{a.raw_score ?? '—'}</td>
            <td className="py-2 pr-4">
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-muted hover:text-fg"
              >
                View
              </a>
            </td>
            <td className="py-2">
              {approved.has(a.id) ? (
                <span className="text-xs text-green-600 dark:text-green-400">Approved</span>
              ) : (
                <button
                  onClick={() => handleApprove(a)}
                  disabled={approving === a.id}
                  className="text-xs px-2 py-1 border border-border hover:border-fg cursor-pointer disabled:opacity-50"
                >
                  {approving === a.id ? 'Approving…' : 'Approve'}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
