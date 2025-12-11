"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { TrackSkeleton } from "../../components/Skeleton";

// ──────────────── TYPES ──────────────── //
interface Track {
  id: string;
  name: string;
  artist: string;
  image?: string;
  playCount: number;
  totalTimeMs: number;
  popularity: number;
}

interface StatsResponse {
  topTracks?: Track[];
}

interface ProfileResponse {
  display_name?: string;
  images?: Array<{ url: string }>;
}

// ──────────────── PAGE ──────────────── //
export default function TracksPage() {
  const [timeRange, setTimeRange] = useState<'month' | 'year' | 'all'>('all');
  const [stats, setStats] = useState<StatsResponse>({});
  const [profile, setProfile] = useState<ProfileResponse>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [statsRes, profileRes] = await Promise.all([
        fetch(`/api/stats?range=${timeRange}`, { cache: "no-store" }),
        fetch(`/api/spotify/me`, { cache: "force-cache" }),
      ]);

      setStats(statsRes.ok ? await statsRes.json() : {});
      setProfile(profileRes.ok ? await profileRes.json() : {});
      setLoading(false);
    }

    fetchData();
  }, [timeRange]);

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar profile={profile} />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-32 pt-16 lg:pt-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Top Tracks</h2>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(10)].map((_, i) => (
                <TrackSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fadeIn">
              {stats.topTracks?.map((track, i) => (
                <div
                  key={track.id}
                  className="bg-[#111111] rounded-2xl p-4 hover:bg-[#1a1a1a] transition-all hover:scale-[1.03]"
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Box */}
                    <div className="w-10 h-10 rounded bg-[#00e461] text-black flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>

                    {/* Track Image */}
                    {track.image && (
                      <div className="relative w-16 h-16">
                        <Image
                          src={track.image}
                          alt={track.name}
                          fill
                          sizes="64px"
                          className="rounded object-cover"
                        />
                      </div>
                    )}

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{track.name}</div>
                      <div className="text-sm opacity-60 truncate">
                        {track.artist}
                      </div>

                      {track.playCount > 0 && (
                        <div className="text-sm text-[#00e461] mt-1">
                          {track.playCount} plays •{" "}
                          {Math.floor(track.totalTimeMs / 60000)}m
                        </div>
                      )}

                      <div className="text-xs opacity-60 mt-1">
                        Popularity: {track.popularity || 0}/100
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
