"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import KPI from "../components/KPI";
import TimeSeriesChart from "../components/TimeSeriesChart";

export default function Page() {
  const [filter, setFilter] = useState("alltime");
  const [stats, setStats] = useState<any>({});
  const [monthly, setMonthly] = useState<any>([]);
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      const base = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";

      try {
        const [statsRes, monthlyRes, profileRes] = await Promise.all([
          fetch(`${base}/api/stats?filter=${filter}`, { cache: "no-store" }).catch(() => null),
          fetch(`${base}/api/spotify/monthly`, { cache: "no-store" }).catch(() => null),
          fetch(`${base}/api/spotify/me`, { cache: "no-store" }).catch(() => null),
        ]);

        setStats(statsRes?.ok ? await statsRes.json() : {});
        setMonthly(monthlyRes?.ok ? await monthlyRes.json() : []);
        setProfile(profileRes?.ok ? await profileRes.json() : {});
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [filter]);

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          profile={profile} 
          onFilterChange={setFilter}
          currentFilter={filter}
        />

        <main className="flex-1 overflow-y-auto px-4 pb-4">
          <h2 className="text-2xl font-bold mb-4">Analytics And Data</h2>

          {error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
              <div className="text-red-400 mb-2">⚠️ {error}</div>
              <a href="/api/sync" className="inline-block mt-2 px-4 py-2 bg-[#00e461] text-black rounded-lg font-medium">
                Sync Data Now
              </a>
            </div>
          ) : loading ? (
            <div className="text-center py-20 opacity-60">Loading...</div>
          ) : (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-4 gap-4 mb-6 animate-fadeIn">
                <KPI title="Total Plays" value={stats.totalPlays || 0} subtitle="Tracked in database" change="+0.5% More Than Last Month" />
                <KPI title="Top Artists" value={stats.topArtists?.length || 0} subtitle="Unique artists" change="+2% More Than Last Month" />
                <KPI title="Top Tracks" value={stats.topTracks?.length || 0} subtitle="Most played" change="+4% More Than Last Month" />
                <KPI title="Genres" value={stats.topGenres?.length || 0} subtitle="Different genres" change="+1% More Than Last Month" />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-2 gap-4 mb-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <div className="bg-[#111111] rounded-2xl p-4 h-80">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm opacity-60">Listening Activity • 2024</div>
                      <div className="text-lg font-semibold">Monthly Plays</div>
                    </div>
                    <div className="text-xs opacity-60">7 days</div>
                  </div>
                  <TimeSeriesChart data={monthly || []} />
                </div>

                <div className="bg-[#111111] rounded-2xl p-4 h-80 overflow-y-auto">
                  <div className="text-sm opacity-60 mb-3">Top Artists</div>
                  <div className="space-y-2">
                    {stats.topArtists?.slice(0, 10).map((artist: any, i: number) => (
                      <div key={artist.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a1a]">
                        <div className="w-7 h-7 rounded-full bg-[#00e461] text-black flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </div>
                        {artist.image && <img src={artist.image} alt={artist.name} className="w-10 h-10 rounded-full" />}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{artist.name}</div>
                          <div className="text-xs opacity-60">
                            {artist.playCount !== null ? `${artist.playCount} plays` : `Rank #${artist.rank}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-4 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <div className="bg-[#111111] rounded-2xl p-4">
                  <div className="text-sm opacity-60">Most Played Track</div>
                  <div className="text-xl font-bold mt-2 truncate">{stats.topTracks?.[0]?.name || 'N/A'}</div>
                  <div className="text-xs opacity-60 truncate">{stats.topTracks?.[0]?.artist || ''}</div>
                  <div className="text-green-400 text-sm mt-2">
                    {stats.topTracks?.[0]?.playCount !== null ? `${stats.topTracks[0].playCount} plays` : 'Top ranked'}
                  </div>
                </div>

                <div className="bg-[#111111] rounded-2xl p-4">
                  <div className="text-sm opacity-60">Favorite Artist</div>
                  <div className="text-xl font-bold mt-2 truncate">{stats.topArtists?.[0]?.name || 'N/A'}</div>
                  <div className="text-xs opacity-60">{stats.topArtists?.[0]?.followers?.toLocaleString() || 0} followers</div>
                  <div className="text-green-400 text-sm mt-2">
                    {stats.topArtists?.[0]?.playCount !== null ? `${stats.topArtists[0].playCount} plays` : 'Top ranked'}
                  </div>
                </div>

                <div className="bg-[#111111] rounded-2xl p-4">
                  <div className="text-sm opacity-60">Top Genre</div>
                  <div className="text-xl font-bold mt-2 capitalize truncate">{stats.topGenres?.[0]?.genre || 'N/A'}</div>
                  <div className="text-xs opacity-60 mt-3 space-y-1">
                    {stats.topGenres?.slice(0, 3).map((g: any, i: number) => (
                      <div key={i} className="capitalize truncate">{g.genre} • {g.count} artists</div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
