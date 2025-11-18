"use client";

type Point = { month: string; plays: number };

export default function TimeSeriesChart({ data }: { data: Point[] }) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.plays), 1);
  const cols = data.length;
  const svgWidth = Math.max(320, cols * 48);
  const svgHeight = 160;
  const gap = 8;
  const barW = Math.max(8, Math.floor((svgWidth - (cols + 1) * gap) / cols));

  return (
    <div className="card p-5 overflow-visible">
      <h3 className="text-sm font-semibold text-white/90">Monthly Plays</h3>

      <div className="mt-4 h-48 w-full">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          role="img"
        >
          {/* horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => (
            <line
              key={idx}
              x1={0}
              x2={svgWidth}
              y1={Math.round((1 - t) * (svgHeight - 40))}
              y2={Math.round((1 - t) * (svgHeight - 40))}
              stroke="#0f766e22"
              strokeWidth={1}
            />
          ))}

          {data.map((d, i) => {
            const x = gap + i * (barW + gap);
            const h = Math.max(
              4,
              Math.round((d.plays / max) * (svgHeight - 60))
            );
            const y = svgHeight - 40 - h;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={6}
                  fill="#10b981"
                />
                <title>{`${d.month}: ${d.plays.toLocaleString()}`}</title>
              </g>
            );
          })}
        </svg>

        <div className="mt-2 flex items-center justify-between text-xs text-zinc-400 font-medium">
          {data.map((d, i) => (
            <div key={i} style={{ width: barW + gap, textAlign: "center" }}>
              {d.month}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
