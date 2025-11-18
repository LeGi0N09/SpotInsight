"use client";
import { useMemo } from "react";

export default function GenreTreemap() {
  const genres = useMemo(
    () => [
      { name: "Pop", size: 30 },
      { name: "Hip Hop", size: 22 },
      { name: "Indie", size: 18 },
      { name: "Electronic", size: 15 },
      { name: "Jazz", size: 8 },
    ],
    []
  );

  const total = useMemo(() => genres.reduce((s, g) => s + g.size, 0), [genres]);

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white/90">Genres Breakdown</h3>

      <div className="mt-4 flex flex-wrap gap-3">
        {genres.map((g) => {
          const percent = (g.size / total) * 100;

          return (
            <div
              key={g.name}
              style={{ flexBasis: `${percent}%`, minWidth: 90 }}
              className="
                bg-gradient-to-br from-emerald-500 to-emerald-700
                rounded-xl shadow-md p-3 text-xs font-semibold
                text-white transition hover:scale-105
              "
            >
              {g.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
