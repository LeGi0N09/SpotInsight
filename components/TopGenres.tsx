"use client";

interface Genre {
  genre: string;
  count: number;
}

export default function TopGenres({
  genres,
  lastSynced,
}: {
  genres: Genre[];
  lastSynced?: string;
}) {
  return (
    <>
      <div className="bg-[#111111] rounded-xl p-6 border border-[#1a1a1a] mb-8">
        <h3 className="text-lg font-bold mb-4">Top Genres</h3>
        {!genres || genres.length === 0 ? (
          <div className="text-sm opacity-60">
            Genre data is not available yet. Sync will populate this data
            automatically.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {genres.slice(0, 12).map((genre, i) => (
              <div
                key={i}
                className="bg-[#1a1a1a] rounded-lg p-3 hover:bg-[#222] transition-colors"
              >
                <div className="text-sm font-medium truncate capitalize">
                  {genre.genre}
                </div>
                <div className="text-xs text-[#00e461] mt-1">
                  {genre.count} plays
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last Synced */}
      <div className="text-xs opacity-40 text-center">
        Last synced: {new Date(lastSynced || "").toLocaleString()}
      </div>
    </>
  );
}
