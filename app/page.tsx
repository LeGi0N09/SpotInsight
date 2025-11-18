"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import KPI from "../components/KPI";
import { KPISkeleton, CardSkeleton } from "../components/Skeleton";

interface MonthlyData {
  month: string;
  plays: number;
}

interface Artist {
  id: string;
  name: string;
  image?: string;
  playCount?: number;
  rank?: number;
  followers?: number;
}

interface Track {
  name: string;
  artist: string;
}

interface Genre {
  genre: string;
  count: number;
}

interface Stats {
  totalPlays?: number;
  topArtists?: Artist[];
  topTracks?: Track[];
  topGenres?: Genre[];
}

export default function Page() {
  const [filter, setFilter] = useState("alltime");
  const [stats, setStats] = useState<Stats>({});
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData(showLoading = true) {
      try {
        if (showLoading) setLoading(true);
        const [statsRes, monthlyRes, profileRes] = await Promise.all([
          fetch(`/api/stats?filter=${filter}`, { cache: "no-store" }),
          fetch(`/api/spotify/monthly`, { cache: "no-store" }),
          fetch(`/api/spotify/me`, { cache: "no-store" }),
        ]);
        setStats(statsRes.ok ? await statsRes.json() : {});
        setMonthly(monthlyRes.ok ? await monthlyRes.json() : []);
        setProfile(profileRes.ok ? await profileRes.json() : {});
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(interval);
  }, [filter]);

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Topbar 
          profile={profile} 
          onFilterChange={setFilter}
          currentFilter={filter}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-24 pt-16 lg:pt-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Analytics And Data</h2>

          {loading ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {[...Array(4)].map((_, i) => <KPISkeleton key={i} />)}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {[...Array(2)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            </>
          ) : (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 animate-fadeIn">
                <KPI title="Total Plays" value={(stats.totalPlays as number) || 0} subtitle="Tracked in database" />
                <KPI title="Top Artists" value={(stats.topArtists as unknown[] | undefined)?.length || 0} subtitle="Unique artists" />
                <KPI title="Top Tracks" value={(stats.topTracks as unknown[] | undefined)?.length || 0} subtitle="Most played" />
                <KPI title="Genres" value={(stats.topGenres as unknown[] | undefined)?.length || 0} subtitle="Different genres" />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <div className="bg-[#111111] rounded-2xl p-4 h-80">
                  <div className="text-sm opacity-60 mb-4">Monthly Plays</div>
                  <div className="space-y-3">
                    {monthly.slice(-8).map((m, i) => {
                      const max = Math.max(...(monthly.map((d) => d.plays) || [1]));
                      const width = (m.plays / max) * 100;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div className="text-xs opacity-60 w-20 text-right">{m.month}</div>
                          <div className="flex-1 bg-[#1a1a1a] rounded-full h-6 overflow-hidden">
                            <div className="bg-[#00e461] h-full rounded-full flex items-center justify-end pr-2" style={{ width: `${width}%` }}>
                              <span className="text-xs font-bold text-black">{m.plays}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-[#111111] rounded-2xl p-4 h-80 overflow-y-auto">
                  <div className="text-sm opacity-60 mb-3">Top Artists</div>
                  <div className="space-y-2">
                    {stats.topArtists?.slice(0, 10).map((artist, i) => (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <div className="bg-[#111111] rounded-2xl p-4">
                  <div className="text-sm opacity-60">Most Played Track</div>
                  <div className="text-xl font-bold mt-2 truncate">{stats.topTracks?.[0]?.name || 'N/A'}</div>
                  <div className="text-xs opacity-60 truncate">{stats.topTracks?.[0]?.artist || ''}</div>
                </div>

                <div className="bg-[#111111] rounded-2xl p-4">
                  <div className="text-sm opacity-60">Favorite Artist</div>
                  <div className="text-xl font-bold mt-2 truncate">{stats.topArtists?.[0]?.name || 'N/A'}</div>
                  <div className="text-xs opacity-60">{stats.topArtists?.[0]?.followers?.toLocaleString() || 0} followers</div>
                </div>

                <div className="bg-[#111111] rounded-2xl p-4">
                  <div className="text-sm opacity-60">Top Genre</div>
                  <div className="text-xl font-bold mt-2 capitalize truncate">{stats.topGenres?.[0]?.genre || 'N/A'}</div>
                  <div className="text-xs opacity-60 mt-3 space-y-1">
                    {stats.topGenres?.slice(0, 3).map((g, i) => (
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
