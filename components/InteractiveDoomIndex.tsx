'use client';

import { useState, useEffect, useCallback } from 'react';
import { DoomIndexChart, DoomIndexEntry, categoryColors } from './DoomIndexChart';

type TimeWindow = '4w' | '8w' | '12w' | 'all';

const timeWindowWeeks: Record<TimeWindow, number | null> = {
  '4w': 4,
  '8w': 8,
  '12w': 12,
  'all': null,
};

export function InteractiveDoomIndex() {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('8w');
  const [data, setData] = useState<DoomIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabledCategories, setEnabledCategories] = useState<Set<string>>(
    new Set(Object.keys(categoryColors))
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    const weeks = timeWindowWeeks[timeWindow];
    const url = weeks ? `/api/doom-index?weeks=${weeks}` : '/api/doom-index?weeks=104';
    fetch(url)
      .then(res => res.json())
      .then(json => setData(json.data ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [timeWindow]);

  const toggleCategory = useCallback((cat: string) => {
    setEnabledCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  // Show scores from hovered point or latest
  const displayEntry = hoveredIndex !== null ? data[hoveredIndex] : data[data.length - 1];

  return (
    <div className="border border-border rounded-lg p-6 bg-card-bg">
      {/* Time window pills */}
      <div className="flex gap-2 mb-4">
        {(Object.keys(timeWindowWeeks) as TimeWindow[]).map(tw => (
          <button
            key={tw}
            onClick={() => setTimeWindow(tw)}
            className={`text-xs font-bold tracking-[1.2px] uppercase font-mono px-3 py-1 border rounded transition-colors ${
              tw === timeWindow
                ? 'bg-fg text-bg border-fg'
                : 'bg-transparent text-muted border-border hover:text-fg hover:border-fg'
            }`}
          >
            {tw === 'all' ? 'All' : tw.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className={`transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}>
        <DoomIndexChart
          data={data}
          enabledCategories={enabledCategories}
          hoveredIndex={hoveredIndex}
          onHover={setHoveredIndex}
        />
      </div>

      {/* Category legend toggles */}
      {displayEntry?.category_scores && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-border mt-4">
          {Object.entries(displayEntry.category_scores).map(([cat, score]) => {
            const enabled = enabledCategories.has(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`flex items-center gap-2 text-left transition-opacity ${enabled ? 'opacity-100' : 'opacity-40'}`}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: enabled ? (categoryColors[cat] ?? 'var(--muted)') : 'var(--muted)' }}
                />
                <span className="text-xs font-mono uppercase tracking-wider text-muted">{cat}</span>
                <span className="text-xs font-bold ml-auto">{(score as number).toFixed(1)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
