'use client';

export interface DoomIndexEntry {
  week_start: string;
  overall_score: number;
  article_count?: number;
  category_scores?: Record<string, number>;
}

export const categoryColors: Record<string, string> = {
  safety: '#ef4444',
  labor: '#f59e0b',
  ethics: '#8b5cf6',
  power: '#3b82f6',
  misinformation: '#ec4899',
  surveillance: '#14b8a6',
};

interface Props {
  data: DoomIndexEntry[];
  enabledCategories?: Set<string>;
  hoveredIndex?: number | null;
  onHover?: (index: number | null) => void;
}

export function DoomIndexChart({
  data,
  enabledCategories,
  hoveredIndex = null,
  onHover,
}: Props) {
  if (data.length === 0) {
    return (
      <div className="border border-border rounded-lg p-10 bg-card-bg text-center">
        <p className="text-2xl mb-3">📉</p>
        <p className="font-bold mb-1">No Doom Index data yet</p>
        <p className="text-sm text-muted">The first index will be computed this Sunday.</p>
      </div>
    );
  }

  const scores = data.map(d => d.overall_score);
  const latest = scores[scores.length - 1];
  const prev = scores.length > 1 ? scores[scores.length - 2] : latest;
  const delta = latest - prev;

  const chartLeft = 50;
  const chartRight = 660;
  const chartTop = 20;
  const chartBottom = 180;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const xStep = data.length > 1 ? chartWidth / (data.length - 1) : 0;
  const getX = (i: number) => chartLeft + i * xStep;
  const getY = (val: number) => chartBottom - (val / 100) * chartHeight;

  // Skip x-axis labels when too many points
  const labelInterval = Math.ceil(data.length / 8);

  // Determine displayed score (hovered or latest)
  const displayIndex = hoveredIndex !== null ? hoveredIndex : data.length - 1;
  const displayScore = scores[displayIndex];
  const displayPrev = displayIndex > 0 ? scores[displayIndex - 1] : displayScore;
  const displayDelta = displayScore - displayPrev;

  return (
    <div>
      {/* Current score */}
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-4xl font-bold tracking-tight">{displayScore.toFixed(1)}</span>
        <span className={`text-sm font-bold font-mono ${displayDelta > 0 ? 'text-red-500' : displayDelta < 0 ? 'text-green-500' : 'text-muted'}`}>
          {displayDelta > 0 ? '+' : ''}{displayDelta.toFixed(1)}
        </span>
        <span className="text-xs text-muted uppercase tracking-widest font-mono">Doom Index</span>
        {hoveredIndex !== null && (
          <span className="text-xs text-muted font-mono">
            {new Date(data[hoveredIndex].week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Chart */}
      <svg
        viewBox="0 0 700 210"
        className="w-full h-auto"
        aria-label="Doom Index trend chart"
        onMouseLeave={() => onHover?.(null)}
      >
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={chartLeft} y1={chartTop + i * 40}
            x2={chartRight} y2={chartTop + i * 40}
            stroke="var(--border)" strokeWidth="1"
          />
        ))}
        {/* Y-axis labels */}
        {[100, 80, 60, 40, 20].map((val, i) => (
          <text
            key={val}
            x={chartLeft - 10} y={chartTop + 5 + i * 40}
            textAnchor="end"
            fill="var(--muted)"
            fontSize="11"
            fontFamily="monospace"
          >
            {val}
          </text>
        ))}

        {/* Category trend lines */}
        {enabledCategories && data[0]?.category_scores && Array.from(enabledCategories).map(cat => {
          const catScores = data.map(d => d.category_scores?.[cat]);
          if (catScores.some(s => s === undefined)) return null;
          return (
            <polyline
              key={cat}
              fill="none"
              stroke={categoryColors[cat] ?? 'var(--muted)'}
              strokeWidth="1.5"
              opacity="0.7"
              points={(catScores as number[]).map((val, i) => `${getX(i)},${getY(val)}`).join(' ')}
            />
          );
        })}

        {/* Overall score line */}
        <polyline
          fill="none"
          stroke="var(--fg)"
          strokeWidth="2"
          points={scores.map((val, i) => `${getX(i)},${getY(val)}`).join(' ')}
        />

        {/* Hover guideline */}
        {hoveredIndex !== null && (
          <line
            x1={getX(hoveredIndex)} y1={chartTop}
            x2={getX(hoveredIndex)} y2={chartBottom}
            stroke="var(--muted)" strokeWidth="1" strokeDasharray="4 3"
          />
        )}

        {/* Data points */}
        {scores.map((val, i) => {
          const isHovered = hoveredIndex === i;
          return (
            <g key={i}>
              <circle
                cx={getX(i)} cy={getY(val)}
                r={isHovered ? 6 : 3}
                fill="var(--fg)"
              />
              {isHovered && (
                <circle
                  cx={getX(i)} cy={getY(val)}
                  r="9" fill="none"
                  stroke="var(--fg)" strokeWidth="1.5" opacity="0.3"
                />
              )}
            </g>
          );
        })}

        {/* Hover hit areas */}
        {onHover && data.map((_, i) => {
          const colWidth = data.length > 1 ? chartWidth / data.length : chartWidth;
          const colX = data.length > 1 ? getX(i) - colWidth / 2 : chartLeft;
          return (
            <rect
              key={`hit-${i}`}
              x={colX} y={chartTop}
              width={colWidth} height={chartBottom - chartTop + 20}
              fill="transparent"
              onMouseEnter={() => onHover(i)}
              style={{ cursor: 'crosshair' }}
            />
          );
        })}

        {/* Week labels */}
        {data.map((d, i) => {
          if (i % labelInterval !== 0 && i !== data.length - 1) return null;
          const weekLabel = new Date(d.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <text
              key={i}
              x={getX(i)}
              y="205"
              textAnchor="middle"
              fill="var(--muted)"
              fontSize="10"
              fontFamily="monospace"
            >
              {weekLabel}
            </text>
          );
        })}

        {/* Tooltip */}
        {hoveredIndex !== null && data[hoveredIndex]?.category_scores && enabledCategories && (
          (() => {
            const tipX = getX(hoveredIndex);
            const flipLeft = tipX > 400;
            const boxX = flipLeft ? tipX - 155 : tipX + 10;
            const boxY = chartTop + 5;
            const entry = data[hoveredIndex];
            const cats = Object.entries(entry.category_scores!).filter(([c]) => enabledCategories.has(c));

            return (
              <foreignObject x={boxX} y={boxY} width="145" height={50 + cats.length * 18} style={{ pointerEvents: 'none' }}>
                <div
                  className="bg-card-bg border border-border rounded p-2 text-xs font-mono shadow-lg"
                  style={{ fontSize: '10px' }}
                >
                  <div className="font-bold mb-1">
                    {new Date(entry.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted">Overall</span>
                    <span className="font-bold">{entry.overall_score.toFixed(1)}</span>
                  </div>
                  {entry.article_count !== undefined && (
                    <div className="flex justify-between mb-1">
                      <span className="text-muted">Articles</span>
                      <span>{entry.article_count}</span>
                    </div>
                  )}
                  {cats.map(([cat, score]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: categoryColors[cat] }} />
                        <span className="text-muted">{cat}</span>
                      </span>
                      <span>{(score as number).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </foreignObject>
            );
          })()
        )}
      </svg>
    </div>
  );
}
