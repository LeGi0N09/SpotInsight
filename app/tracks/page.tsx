"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { TrackSkeleton } from "../../components/Skeleton";

export default function TracksPage() {
  const [filter, setFilter] = useState("alltime");
  const [stats, setStats] = useState<any>({});
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const base = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";
      const [statsRes, profileRes] = await Promise.all([
        fetch(`${base}/api/stats?filter=${filter}`, { cache: "no-store" }),
        fetch(`${base}/api/spotify/me`, { cache: "no-store" }),
      ]);
      setStats(statsRes.ok ? await statsRes.json() : {});
      setProfile(profileRes.ok ? await profileRes.json() : {});
      setLoading(false);
    }
    fetchData();
  }, [filter]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar profile={profile} onFilterChange={setFilter} currentFilter={filter} />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 pt-16 lg:pt-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Top Tracks</h2>
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(10)].map((_, i) => <TrackSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fadeIn">
              {stats.topTracks?.map((track: any, i: number) => (
                <div key={track.id} className="bg-[#111111] rounded-2xl p-4 hover:bg-[#1a1a1a] transition-all hover:scale-105">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-[#00e461] text-black flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    {track.image && <img src={track.image} alt={track.name} className="w-16 h-16 rounded" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{track.name}</div>
                      <div className="text-sm opacity-60 truncate">{track.artist}</div>
                      {track.playCount > 0 && (
                        <div className="text-sm text-[#00e461] mt-1">
                          {track.playCount} plays • {Math.floor(track.totalTimeMs / 60000)}m
                        </div>
                      )}
                      <div className="text-xs opacity-60 mt-1">Popularity: {track.popularity || 0}/100</div>
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
