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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Dashboard</h2>
              <p className="text-sm opacity-60 mt-1">Your Spotify listening analytics</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  timeRange === 'month'
                    ? 'bg-[#00e461] text-black'
                    : 'bg-[#1a1a1a] text-white/60 hover:text-white hover:bg-[#222]'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeRange('year')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  timeRange === 'year'
                    ? 'bg-[#00e461] text-black'
                    : 'bg-[#1a1a1a] text-white/60 hover:text-white hover:bg-[#222]'
                }`}
              >
                Last 12 Months
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  timeRange === 'all'
                    ? 'bg-[#00e461] text-black'
                    : 'bg-[#1a1a1a] text-white/60 hover:text-white hover:bg-[#222]'
                }`}
              >
                All Time
              </button>

            </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fadeIn">
                <KPI title="Total Plays" value={(stats.totalPlays as number) || 0} subtitle="All time" />
                <KPI title="This Month" value={monthly.slice(-1)[0]?.plays || 0} subtitle={monthly.slice(-1)[0]?.month || "Current"} />
                <KPI title="Unique Artists" value={stats.totalArtists || 0} subtitle="Discovered" />
                <KPI title="Top Tracks" value={stats.topTracks?.length || 0} subtitle="Tracked" />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 animate-fadeIn" style={{ animationDelay: "0.1s" }}>
                <div className="bg-[#111111] rounded-2xl p-5 sm:p-6 lg:col-span-2 overflow-hidden border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="text-xs uppercase tracking-wider opacity-50 mb-2">Listening Activity</div>
                      <div className="text-3xl sm:text-4xl font-bold">
                        {monthly.slice(-1)[0]?.plays.toLocaleString() || 0}
                      </div>
                      <div className="text-sm opacity-60 mt-1">
                        {monthly.slice(-1)[0]?.month || "This Month"}
                      </div>
                    </div>
                    {monthly.length >= 2 && (() => {
                      const recent = monthly.slice(-12);
                      const current = recent[recent.length - 1]?.plays || 0;
                      const previous = recent[recent.length - 2]?.plays || 1;
                      const growth = (((current - previous) / previous) * 100).toFixed(1);
                      const isPositive = parseFloat(growth) >= 0;
                      return (
                        <div className="text-right">
                          <div className="text-xs opacity-50 mb-1">vs last month</div>
                          <div className={`text-2xl font-bold ${isPositive ? "text-[#00e461]" : "text-red-400"}`}>
                            {isPositive ? "+" : ""}{growth}%
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="relative h-[240px] sm:h-[280px] mb-4 flex gap-3">
                    {monthly.length > 0 && (() => {
                      const recentMonths = monthly.slice(-12);
                      const max = Math.max(...recentMonths.map((d) => d.plays), 1);
                      const min = Math.min(...recentMonths.map((d) => d.plays));
                      const range = max - min || 1;
                      const yLabels = [max, Math.round(max * 0.75), Math.round(max * 0.5), Math.round(max * 0.25), min];
                      
                      return (
                        <>
                          <div className="flex flex-col justify-between py-2 text-[10px] opacity-40 min-w-[40px] text-right">
                            {yLabels.map((val, i) => (
                              <div key={i}>{val.toLocaleString()}</div>
                            ))}
                          </div>
                          
                          <div className="flex-1 relative">
                            {hoveredMonth && (
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#0a0a0a] px-4 py-2.5 rounded-lg z-10 border border-[#2a2a2a] shadow-xl">
                                <div className="text-[10px] uppercase tracking-wider opacity-50 mb-0.5">{hoveredMonth.month}</div>
                                <div className="text-xl font-bold text-[#00e461]">
                                  {hoveredMonth.plays.toLocaleString()}
                                </div>
                              </div>
                            )}
                            
                            {(() => {
                              const points = recentMonths.map((m, i) => ({
                                x: (i / Math.max(recentMonths.length - 1, 1)) * 90 + 5,
                                y: 10 + ((max - m.plays) / range) * 70,
                                month: m.month,
                                plays: m.plays,
                              }));
                              
                              let pathD = `M ${points[0].x} ${points[0].y}`;
                              for (let i = 0; i < points.length - 1; i++) {
                                const cp1x = points[i].x + (points[i + 1].x - points[i].x) / 3;
                                const cp1y = points[i].y;
                                const cp2x = points[i].x + (2 * (points[i + 1].x - points[i].x)) / 3;
                                const cp2y = points[i + 1].y;
                                pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i + 1].x} ${points[i + 1].y}`;
                              }
                              
                              const areaPath = `${pathD} L ${points[points.length - 1].x} 88 L ${points[0].x} 88 Z`;
                              
                              return (
                                <>
                                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <defs>
                                      <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#00e461" stopOpacity="0.12" />
                                        <stop offset="100%" stopColor="#00e461" stopOpacity="0" />
                                      </linearGradient>
                                    </defs>
                                    
                                    {[0, 1, 2, 3, 4].map((i) => (
                                      <line
                                        key={i}
                                        x1="5"
                                        y1={10 + i * 17.5}
                                        x2="95"
                                        y2={10 + i * 17.5}
                                        stroke="#1a1a1a"
                                        strokeWidth="0.3"
                                      />
                                    ))}
                                    
                                    <path d={areaPath} fill="url(#areaGrad)" />
                                    <path
                                      d={pathD}
                                      fill="none"
                                      stroke="#00e461"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    
                                    {points.map((p, i) => (
                                      <g key={i}>
                                        <circle
                                          cx={p.x}
                                          cy={p.y}
                                          r="2.5"
                                          fill="#111111"
                                          className="cursor-pointer"
                                          onMouseEnter={() => setHoveredMonth({ month: p.month, plays: p.plays })}
                                          onMouseLeave={() => setHoveredMonth(null)}
                                        />
                                        <circle
                                          cx={p.x}
                                          cy={p.y}
                                          r={hoveredMonth?.month === p.month ? "2" : "1.5"}
                                          fill="#00e461"
                                          className="cursor-pointer transition-all"
                                          onMouseEnter={() => setHoveredMonth({ month: p.month, plays: p.plays })}
                                          onMouseLeave={() => setHoveredMonth(null)}
                                        />
                                      </g>
                                    ))}
                                  </svg>
                                  
                                  <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
                                    {recentMonths.map((m, i) => (
                                      <div 
                                        key={i} 
                                        className={`text-[9px] sm:text-[10px] text-center transition-all ${
                                          hoveredMonth?.month === m.month ? "opacity-100 font-bold" : "opacity-40"
                                        }`}
                                        style={{ width: `${100 / recentMonths.length}%` }}
                                      >
                                        {m.month.split(" ")[0]}
                                      </div>
                                    ))}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  {monthly.length > 0 && (() => {
                    const recent = monthly.slice(-12);
                    const total = recent.reduce((sum, m) => sum + m.plays, 0);
                    const avg = Math.round(total / recent.length);
                    const peak = Math.max(...recent.map(m => m.plays));
                    return (
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#1a1a1a]">
                        <div>
                          <div className="text-xs opacity-50 mb-1">Avg/Month</div>
                          <div className="text-lg font-bold">{avg.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-50 mb-1">Peak Month</div>
                          <div className="text-lg font-bold text-[#00e461]">{peak.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-50 mb-1">Total (12mo)</div>
                          <div className="text-lg font-bold">{total.toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-[#111111] rounded-2xl p-4 sm:p-5 h-[400px] sm:h-[450px] overflow-y-auto border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm opacity-60">Top Artists</div>
                    <div className="text-xs opacity-40">{stats.topArtists?.length || 0} total</div>
                  </div>
                  <div className="space-y-2">
                    {stats.topArtists?.slice(0, 15).map((artist, i) => (
                      <div
                        key={artist.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-[#00e461] text-black flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        {artist.image ? (
                          <img src={artist.image} alt={artist.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-[#1a1a1a] flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-sm">{artist.name}</div>
                          <div className="text-xs opacity-60">
                            {artist.playCount?.toLocaleString() || 0} plays
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Tracks Section */}
              <div className="bg-[#111111] rounded-2xl p-4 sm:p-5 mb-6 animate-fadeIn border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors" style={{ animationDelay: "0.2s" }}>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm opacity-60">Top Tracks</div>
                  <div className="text-xs opacity-40">{stats.topTracks?.length || 0} total</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stats.topTracks?.slice(0, 6).map((track, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] hover:bg-[#1a1a1a] transition-colors">
                      <div className="w-8 h-8 rounded bg-[#00e461] text-black flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm">{track.name}</div>
                        <div className="text-xs opacity-60 truncate">{track.artist}</div>
                        <div className="text-xs text-[#00e461] mt-0.5">{track.playCount?.toLocaleString()} plays</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 animate-fadeIn" style={{ animationDelay: "0.3s" }}>
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
                  <div className="text-xs opacity-50 mb-3">Listening Stats</div>
                  {monthly.length > 0 && (() => {
                    const recent = monthly.slice(-12);
                    const total = recent.reduce((sum, m) => sum + m.plays, 0);
                    const avgPerMonth = Math.round(total / recent.length);
                    const avgPerDay = Math.round(avgPerMonth / 30);
                    return (
                      <>
                        <div className="space-y-3">
                          <div>
                            <div className="text-2xl font-bold">{avgPerDay}</div>
                            <div className="text-xs opacity-60">Avg plays per day</div>
                          </div>
                          <div className="pt-3 border-t border-[#1a1a1a] space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs opacity-60">This month</span>
                              <span className="text-sm font-bold">{monthly.slice(-1)[0]?.plays || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs opacity-60">Last month</span>
                              <span className="text-sm font-bold">{monthly.slice(-2)[0]?.plays || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs opacity-60">Monthly avg</span>
                              <span className="text-sm font-bold">{avgPerMonth}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
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
