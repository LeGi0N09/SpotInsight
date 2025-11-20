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
  id?: string;
  name: string;
  artist: string;
  playCount?: number;
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
  const [stats, setStats] = useState<Stats>({});
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [hoveredMonth, setHoveredMonth] = useState<{month: string; plays: number} | null>(null);

  useEffect(() => {
    async function fetchData(showLoading = true) {
      try {
        if (showLoading) setLoading(true);
        const [statsRes, monthlyRes, profileRes] = await Promise.all([
          fetch(`/api/stats`, { cache: 'force-cache' }),
          fetch(`/api/spotify/monthly`, { cache: 'force-cache' }),
          fetch(`/api/spotify/me`, { cache: 'force-cache' }),
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
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Topbar 
          profile={profile}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 animate-fadeIn">
                <KPI title="Total Plays" value={(stats.totalPlays as number) || 0} subtitle="All time listening" />
                <KPI title="This Month" value={monthly.slice(-1)[0]?.plays || 0} subtitle="Current month plays" />
                <KPI title="Artists" value={(stats.topArtists as unknown[] | undefined)?.length || 0} subtitle="Unique artists" />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <div className="bg-[#111111] rounded-2xl p-4 h-80">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-sm opacity-60">Monthly Plays (Last 12 Months)</div>
                      {monthly.length >= 2 && (() => {
                        const recent = monthly.slice(-12);
                        const current = recent[recent.length - 1]?.plays || 0;
                        const previous = recent[recent.length - 2]?.plays || 1;
                        const growth = ((current - previous) / previous * 100).toFixed(1);
                        const isPositive = parseFloat(growth) >= 0;
                        return (
                          <div className={`text-xs mt-1 ${isPositive ? 'text-[#00e461]' : 'text-red-400'}`}>
                            {isPositive ? '↑' : '↓'} {Math.abs(parseFloat(growth))}% vs last month
                          </div>
                        );
                      })()}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{monthly.slice(-1)[0]?.plays.toLocaleString() || 0}</div>
                      <div className="text-[10px] opacity-60">This Month</div>
                    </div>
                  </div>
                  <div className="relative h-52">
                    {hoveredMonth && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#1a1a1a] px-3 py-2 rounded-lg shadow-lg z-10 border border-[#00e461]">
                        <div className="text-xs font-medium">{hoveredMonth.month}</div>
                        <div className="text-sm font-bold text-[#00e461]">{hoveredMonth.plays.toLocaleString()} plays</div>
                      </div>
                    )}
                    {monthly.length > 0 && (() => {
                      const recentMonths = monthly.slice(-12);
                      const max = Math.max(...recentMonths.map(d => d.plays), 1);
                      const points = recentMonths.map((m, i) => ({
                        x: (i / (recentMonths.length - 1)) * 100,
                        y: 100 - (m.plays / max) * 85,
                        month: m.month,
                        plays: m.plays
                      }));
                      const pathPoints = points.map(p => `${p.x},${p.y}`).join(' ');
                      const areaPoints = `0,100 ${pathPoints} 100,100`;
                      return (
                        <>
                          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#00e461" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#00e461" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            {[0, 25, 50, 75].map(y => (
                              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#ffffff" strokeOpacity="0.05" strokeWidth="0.2" />
                            ))}
                            <polygon points={areaPoints} fill="url(#lineGradient)" />
                            <polyline fill="none" stroke="#00e461" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" points={pathPoints} />
                            {points.map((p, i) => (
                              <circle 
                                key={i} 
                                cx={p.x} 
                                cy={p.y} 
                                r="1.5" 
                                fill="#00e461" 
                                stroke="#111111" 
                                strokeWidth="0.5" 
                                className="cursor-pointer transition-all"
                                onMouseEnter={() => setHoveredMonth({month: p.month, plays: p.plays})}
                                onMouseLeave={() => setHoveredMonth(null)}
                                style={{ r: hoveredMonth?.month === p.month ? '2.5' : '1.5' }}
                              />
                            ))}
                          </svg>
                          <div className="flex justify-between mt-2 px-2">
                            {recentMonths.map((m, i) => (
                              <div key={i} className="text-[9px] opacity-50 text-center" style={{ width: `${100/12}%` }}>
                                {m.month.split(' ')[0]}
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
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
                  <div className="text-sm opacity-60 mb-2">Most Played Track</div>
                  <div className="text-xl font-bold truncate">{stats.topTracks?.[0]?.name || 'N/A'}</div>
                  <div className="text-xs opacity-60 truncate mb-3">{stats.topTracks?.[0]?.artist || ''}</div>
                  <div className="space-y-2 mt-3 pt-3 border-t border-[#1a1a1a]">
                    {stats.topTracks?.slice(1, 4).map((track, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#1a1a1a] text-[#00e461] flex items-center justify-center text-[10px] font-bold">
                          {i + 2}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs truncate">{track.name}</div>
                          <div className="text-[10px] opacity-50 truncate">{track.artist}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#111111] rounded-2xl p-4">
                  <div className="text-sm opacity-60 mb-2">Favorite Artist</div>
                  <div className="text-xl font-bold truncate">{stats.topArtists?.[0]?.name || 'N/A'}</div>
                  <div className="text-xs opacity-60 mb-3">{stats.topArtists?.[0]?.followers?.toLocaleString() || 0} followers</div>
                  <div className="space-y-2 mt-3 pt-3 border-t border-[#1a1a1a]">
                    {stats.topArtists?.slice(1, 4).map((artist, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#1a1a1a] text-[#00e461] flex items-center justify-center text-[10px] font-bold">
                          {i + 2}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs truncate">{artist.name}</div>
                          <div className="text-[10px] opacity-50">{artist.playCount?.toLocaleString() || 0} plays</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#111111] rounded-2xl p-4">
                  <div className="text-sm opacity-60 mb-3">Top Genres</div>
                  {stats.topGenres && stats.topGenres.length > 0 && (() => {
                    const total = stats.topGenres.reduce((sum, g) => sum + g.count, 0);
                    return (
                      <div className="space-y-3">
                        {stats.topGenres.slice(0, 5).map((g, i) => {
                          const percentage = ((g.count / total) * 100).toFixed(1);
                          return (
                            <div key={i}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm capitalize truncate">{g.genre}</span>
                                <span className="text-xs opacity-60">{g.count} artists</span>
                              </div>
                              <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                                <div className="bg-[#00e461] h-1.5 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
