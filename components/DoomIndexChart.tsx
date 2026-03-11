'use client';

interface DoomIndexEntry {
  week_start: string;
  overall_score: number;
  category_scores?: Record<string, number>;
}

export function DoomIndexChart({
  data,
  showCategories = false,
}: {
  data: DoomIndexEntry[];
  showCategories?: boolean;
}) {
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

  const categoryColors: Record<string, string> = {
    safety: '#ef4444',
    labor: '#f59e0b',
    ethics: '#8b5cf6',
    power: '#3b82f6',
    misinformation: '#ec4899',
    surveillance: '#14b8a6',
  };

  return (
    <div className="border border-border rounded-lg p-6 bg-card-bg">
      {/* Current score */}
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-4xl font-bold tracking-tight">{latest.toFixed(1)}</span>
        <span className={`text-sm font-bold font-mono ${delta > 0 ? 'text-red-500' : delta < 0 ? 'text-green-500' : 'text-muted'}`}>
          {delta > 0 ? '+' : ''}{delta.toFixed(1)}
        </span>
        <span className="text-xs text-muted uppercase tracking-widest font-mono">Doom Index</span>
      </div>

      {/* Chart */}
      <svg viewBox="0 0 700 200" className="w-full h-auto mb-4" aria-label="Doom Index trend chart">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1="50" y1={20 + i * 40}
            x2="660" y2={20 + i * 40}
            stroke="var(--border)" strokeWidth="1"
          />
        ))}
        {/* Y-axis labels */}
        {[100, 80, 60, 40, 20].map((val, i) => (
          <text
            key={val}
            x="40" y={25 + i * 40}
            textAnchor="end"
            fill="var(--muted)"
            fontSize="11"
            fontFamily="monospace"
          >
            {val}
          </text>
        ))}
        {/* Line */}
        <polyline
          fill="none"
          stroke="var(--fg)"
          strokeWidth="2"
          points={scores.map((val, i) => {
            const x = 80 + i * (560 / Math.max(scores.length - 1, 1));
            const y = 180 - (val / 100) * 160;
            return `${x},${y}`;
          }).join(' ')}
        />
        {/* Data points */}
        {scores.map((val, i) => {
          const x = 80 + i * (560 / Math.max(scores.length - 1, 1));
          const y = 180 - (val / 100) * 160;
          return <circle key={i} cx={x} cy={y} r="4" fill="var(--fg)" />;
        })}
        {/* Week labels */}
        {data.map((d, i) => {
          const x = 80 + i * (560 / Math.max(data.length - 1, 1));
          const weekLabel = new Date(d.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <text
              key={i}
              x={x}
              y="198"
              textAnchor="middle"
              fill="var(--muted)"
              fontSize="10"
              fontFamily="monospace"
            >
              {weekLabel}
            </text>
          );
        })}
      </svg>

      {/* Category breakdown */}
      {showCategories && data[data.length - 1]?.category_scores && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-border">
          {Object.entries(data[data.length - 1].category_scores!).map(([cat, score]) => (
            <div key={cat} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: categoryColors[cat] ?? 'var(--muted)' }}
              />
              <span className="text-xs font-mono uppercase tracking-wider text-muted">{cat}</span>
              <span className="text-xs font-bold ml-auto">{(score as number).toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
