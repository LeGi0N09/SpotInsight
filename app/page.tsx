"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Music } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

interface Artist {
  id: string;
  name: string;
  image?: string;
  genres: string[];
  playCount: number;
  rank: number;
}

interface Track {
  id: string;
  name: string;
  artist: string;
  image?: string;
  playCount: number;
  rank: number;
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
  lastSynced?: string;
}

export default function Page() {
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [range, setRange] = useState<"all" | "month" | "year">("all");

  async function fetchStats(rangeType: "all" | "month" | "year") {
    try {
      const res = await fetch(`/api/stats?range=${rangeType}`, {
        cache: "no-store",
      });
      return res.ok ? await res.json() : null;
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      return null;
    }
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const statsData = await fetchStats(range);
      setStats(statsData || {});

      // Fetch profile separately
      const profileRes = await fetch(`/api/spotify/me`, { cache: "no-store" });
      setProfile(profileRes.ok ? await profileRes.json() : {});

      setLoading(false);
    }
    fetchData();
  }, [range]);

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar profile={profile} />

        <main className="flex-1 overflow-y-auto px-6 py-6 pb-24">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold">Your Spotify Stats</h2>
              <p className="text-sm opacity-60 mt-1">
                {range === "all"
                  ? "All-time listening data"
                  : range === "month"
                  ? "This month"
                  : "This year"}
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              {(
                [
                  { label: "All Time", value: "all" },
                  { label: "This Month", value: "month" },
                  { label: "This Year", value: "year" },
                ] as Array<{ label: string; value: "all" | "month" | "year" }>
              ).map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setRange(btn.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    range === btn.value
                      ? "bg-[#00e461] text-black"
                      : "bg-[#222] text-white hover:bg-[#333]"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#111] rounded-lg p-4 animate-pulse">
                  <div className="h-8 bg-[#222] rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-[#222] rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-[#111111] rounded-xl p-6 border border-[#1a1a1a]">
                  <div className="text-sm opacity-60 mb-2">Total Plays</div>
                  <div className="text-3xl font-bold text-[#00e461]">
                    {(stats.totalPlays || 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-[#111111] rounded-xl p-6 border border-[#1a1a1a]">
                  <div className="text-sm opacity-60 mb-2">Unique Artists</div>
                  <div className="text-3xl font-bold text-[#00e461]">
                    {stats.totalArtists || 0}
                  </div>
                </div>
                <div className="bg-[#111111] rounded-xl p-6 border border-[#1a1a1a]">
                  <div className="text-sm opacity-60 mb-2">Unique Tracks</div>
                  <div className="text-3xl font-bold text-[#00e461]">
                    {stats.totalTracks || 0}
                  </div>
                </div>
              </div>

              {/* Top Artists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#111111] rounded-xl p-6 border border-[#1a1a1a]">
                  <h3 className="text-lg font-bold mb-4">Top Artists</h3>
                  <div className="space-y-2">
                    {stats.topArtists?.slice(0, 10).map((artist, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1a1a1a]"
                      >
                        <div className="w-6 h-6 rounded-full bg-[#00e461] text-black flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </div>
                        <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-[#1f1f1f] border border-white/5">
                          {artist.image ? (
                            <Image
                              src={artist.image}
                              alt={artist.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-[#b3b3b3]">
                              <Music className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {artist.name}
                          </div>
                          <div className="text-xs opacity-60">
                            {artist.playCount} plays
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Tracks */}
                <div className="bg-[#111111] rounded-xl p-6 border border-[#1a1a1a]">
                  <h3 className="text-lg font-bold mb-4">Top Tracks</h3>
                  <div className="space-y-2">
                    {stats.topTracks?.slice(0, 10).map((track, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1a1a1a]"
                      >
                        <div className="w-6 h-6 rounded bg-[#00e461] text-black flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </div>
                        <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-[#1f1f1f] border border-white/5">
                          {track.image ? (
                            <Image
                              src={track.image}
                              alt={track.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-[#b3b3b3]">
                              <Music className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {track.name}
                          </div>
                          <div className="text-xs opacity-60 truncate">
                            {track.artist}
                          </div>
                        </div>
                        <div className="text-sm text-[#00e461] font-medium">
                          {track.playCount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Genres (placeholder) */}
              <div className="bg-[#111111] rounded-xl p-6 border border-[#1a1a1a]">
                <h3 className="text-lg font-bold mb-4">Top Genres</h3>
                {!stats.topGenres || stats.topGenres.length === 0 ? (
                  <div className="text-sm opacity-60">
                    Genre data is not available yet. Sync will populate this
                    data automatically.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {stats.topGenres.slice(0, 12).map((genre, i) => (
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
              <div className="text-xs opacity-40 mt-8 text-center">
                Last synced: {new Date(stats.lastSynced || "").toLocaleString()}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
