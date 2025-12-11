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
  totalArtists?: number;
  totalTracks?: number;
  topArtists?: Artist[];
  topTracks?: Track[];
  topGenres?: Genre[];
}

export default function Page() {
  const [timeRange, setTimeRange] = useState<'month' | 'year' | 'all'>('all');
  const [stats, setStats] = useState<Stats>({});
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [hoveredMonth, setHoveredMonth] = useState<{
    month: string;
    plays: number;
  } | null>(null);


  useEffect(() => {
    async function fetchData(showLoading = true) {
      try {
        if (showLoading) setLoading(true);
        const [statsRes, monthlyRes, profileRes] = await Promise.all([
          fetch(`/api/stats?range=${timeRange}`, { cache: "no-store" }),
          fetch(`/api/spotify/monthly?range=${timeRange}`, { cache: "no-store" }),
          fetch(`/api/spotify/me`, { cache: "no-store" }),
        ]);
        setStats(statsRes.ok ? await statsRes.json() : {});
        setMonthly(monthlyRes.ok ? await monthlyRes.json() : []);
        setProfile(profileRes.ok ? await profileRes.json() : {});
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [timeRange]);

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Topbar profile={profile} />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-24 pt-16 lg:pt-6">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold">Dashboard</h2>
            <p className="text-sm opacity-60 mt-1">Your Spotify listening analytics</p>
          </div>

          {loading ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                  <KPISkeleton key={i} />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {[...Array(2)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 animate-fadeIn">
                <KPI title="Total Plays" value={(stats.totalPlays as number) || 0} subtitle="All time" />
                <KPI title="This Month" value={monthly.slice(-1)[0]?.plays || 0} subtitle={monthly.slice(-1)[0]?.month || "Current"} />
                <KPI title="Unique Artists" value={stats.totalArtists || 0} subtitle="All time" />
                <KPI title="Unique Tracks" value={stats.totalTracks || 0} subtitle="All time" />
              </div>

              {/* Main Chart */}
              <div className="mb-8 animate-fadeIn" style={{ animationDelay: "0.1s" }}>
                <div className="bg-[#111111] rounded-2xl p-6 border border-[#1a1a1a]">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold">Listening Activity</h3>
                      <p className="text-sm opacity-50 mt-1">Last 12 months</p>
                    </div>
                    {monthly.length >= 2 && (() => {
                      const recent = monthly.slice(-12);
                      const current = recent[recent.length - 1]?.plays || 0;
                      const previous = recent[recent.length - 2]?.plays || 1;
                      const change = (((current - previous) / previous) * 100).toFixed(0);
                      const isUp = parseFloat(change) >= 0;
                      return (
                        <div className="text-right">
                          <div className="text-2xl font-bold">{current.toLocaleString()}</div>
                          <div className={`text-sm ${isUp ? "text-[#00e461]" : "text-red-400"}`}>
                            {isUp ? "+" : ""}{change}% vs last month
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {monthly.length > 0 && (() => {
                    const data = monthly.slice(-12);
                    const max = Math.max(...data.map(d => d.plays));
                    const chartHeight = 240;
                    
                    return (
                      <div>
                        <div className="relative h-64 bg-[#0a0a0a] rounded-lg p-6">
                          {/* Grid */}
                          <div className="absolute left-16 right-6 top-6 bottom-10 flex flex-col justify-between">
                            {[0, 1, 2, 3, 4].map(i => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-[10px] opacity-40 absolute -left-14 w-12 text-right">
                                  {Math.round((max * (4 - i)) / 4).toLocaleString()}
                                </span>
                                <div className="w-full border-t border-[#222]" />
                              </div>
                            ))}
                          </div>

                          {/* Chart area */}
                          <div className="absolute left-16 right-6 top-6 bottom-10">
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                                  <stop offset="0%" stopColor="#00e461" stopOpacity="0.2" />
                                  <stop offset="100%" stopColor="#00e461" stopOpacity="0" />
                                </linearGradient>
                              </defs>
                              <path
                                d={(() => {
                                  const points = data.map((m, i) => {
                                    const x = (i / (data.length - 1)) * 100;
                                    const y = (1 - m.plays / max) * 100;
                                    return `${x},${y}`;
                                  });
                                  return `M 0,100 L ${points.join(' L ')} L 100,100 Z`;
                                })()}
                                fill="url(#areaGrad)"
                              />
                              <polyline
                                points={data.map((m, i) => {
                                  const x = (i / (data.length - 1)) * 100;
                                  const y = (1 - m.plays / max) * 100;
                                  return `${x},${y}`;
                                }).join(' ')}
                                fill="none"
                                stroke="#00e461"
                                strokeWidth="1"
                              />
                            </svg>
                            
                            {/* Hover areas */}
                            {data.map((m, i) => {
                              const x = (i / (data.length - 1)) * 100;
                              const y = (m.plays / max) * 100;
                              const isHovered = hoveredMonth?.month === m.month;
                              return (
                                <div
                                  key={i}
                                  className="absolute w-8 h-full cursor-pointer -translate-x-4"
                                  style={{ left: `${x}%` }}
                                  onMouseEnter={() => setHoveredMonth({ month: m.month, plays: m.plays })}
                                  onMouseLeave={() => setHoveredMonth(null)}
                                >
                                  {isHovered && (
                                    <div className="absolute left-1/2 -translate-x-1/2 bg-[#00e461] text-black px-2 py-1 rounded text-xs font-bold whitespace-nowrap z-10" style={{ bottom: `${y}%`, transform: 'translate(-50%, -120%)' }}>
                                      {m.month}: {m.plays.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Month labels */}
                          <div className="absolute left-16 right-6 bottom-2 flex justify-between">
                            {data.map((m, i) => (
                              <div key={i} className="text-[9px] opacity-40">
                                {m.month.split(' ')[0].slice(0, 3)}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-[#1a1a1a]">
                          <div>
                            <div className="text-xs opacity-50">Average</div>
                            <div className="text-xl font-bold mt-1">
                              {Math.round(data.reduce((s, m) => s + m.plays, 0) / data.length).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs opacity-50">Peak</div>
                            <div className="text-xl font-bold text-[#00e461] mt-1">{max.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs opacity-50">Total</div>
                            <div className="text-xl font-bold mt-1">
                              {data.reduce((s, m) => s + m.plays, 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Top Artists & Tracks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fadeIn" style={{ animationDelay: "0.2s" }}>
                <div className="bg-[#111111] rounded-2xl p-5 border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors">
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <div className="text-base font-semibold">Top Artists</div>
                      <div className="text-xs opacity-50 mt-0.5">{stats.topArtists?.length || 0} total</div>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {stats.topArtists?.slice(0, 10).map((artist, i) => (
                      <div key={artist.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors">
                        <div className="w-6 h-6 rounded-full bg-[#00e461] text-black flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        {artist.image ? (
                          <img src={artist.image} alt={artist.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{artist.name}</div>
                          <div className="text-xs opacity-60">{artist.playCount?.toLocaleString() || 0} plays</div>
                          {(artist as any).genres?.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {(artist as any).genres.slice(0, 2).map((g: string, idx: number) => (
                                <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-[#00e461]/10 text-[#00e461] capitalize">
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#111111] rounded-2xl p-5 border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors">
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <div className="text-base font-semibold">Top Tracks</div>
                      <div className="text-xs opacity-50 mt-0.5">{stats.topTracks?.length || 0} total</div>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {stats.topTracks?.slice(0, 10).map((track, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors">
                        <div className="w-6 h-6 rounded bg-[#00e461] text-black flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        {(track as any).image ? (
                          <img src={(track as any).image} alt={track.name} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-[#1a1a1a] flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{track.name}</div>
                          <div className="text-xs opacity-60 truncate">{track.artist}</div>
                          <div className="text-xs text-[#00e461] mt-0.5">{track.playCount?.toLocaleString()} plays</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fadeIn" style={{ animationDelay: "0.3s" }}>
                <div className="bg-[#111111] rounded-2xl p-4 border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors">
                  <div className="text-xs opacity-50 mb-3 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00e461] animate-pulse" />
                    Listening Pattern
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Morning', percent: 18 },
                      { label: 'Afternoon', percent: 22 },
                      { label: 'Evening', percent: 35 },
                      { label: 'Night', percent: 25 },
                    ].map((slot) => (
                      <div key={slot.label}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium">{slot.label}</span>
                          <span className="text-xs opacity-60">{slot.percent}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              slot.label === 'Evening' ? 'bg-[#00e461]' : 'bg-[#333]'
                            }`}
                            style={{ width: `${slot.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#1a1a1a] text-xs opacity-60">
                    Most active: <span className="text-[#00e461] font-medium">Evening</span>
                  </div>
                </div>

                <div className="bg-[#111111] rounded-2xl p-4 border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors">
                  <div className="text-xs opacity-50 mb-4">Top Genres</div>
                  {stats.topGenres &&
                    stats.topGenres.length > 0 &&
                    (() => {
                      const total = stats.topGenres.reduce(
                        (sum, g) => sum + g.count,
                        0
                      );
                      return (
                        <div className="space-y-3.5">
                          {stats.topGenres.slice(0, 5).map((g, i) => {
                            const percentage = (
                              (g.count / total) *
                              100
                            ).toFixed(0);
                            return (
                              <div key={i}>
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-sm capitalize truncate font-medium">
                                    {g.genre}
                                  </span>
                                  <span className="text-xs font-bold text-[#00e461]">
                                    {percentage}%
                                  </span>
                                </div>
                                <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                                  <div
                                    className="bg-[#00e461] h-2 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <div className="text-[10px] opacity-40 mt-0.5">
                                  {g.count} {g.count === 1 ? 'artist' : 'artists'}
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
