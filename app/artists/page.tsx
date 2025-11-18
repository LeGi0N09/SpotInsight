"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

export default function ArtistsPage() {
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
        <main className="flex-1 overflow-y-auto px-4 pb-4">
          <h2 className="text-2xl font-bold mb-4">Top Artists</h2>
          {loading ? (
            <div className="text-center py-20 opacity-60">Loading...</div>
          ) : (
            <div className="grid grid-cols-3 gap-4 animate-fadeIn">
              {stats.topArtists?.map((artist: any, i: number) => (
                <div key={artist.id} className="bg-[#111111] rounded-2xl p-4 hover:bg-[#1a1a1a] transition-all hover:scale-105">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#00e461] text-black flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    {artist.image && <img src={artist.image} alt={artist.name} className="w-20 h-20 rounded-full" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-bold truncate">{artist.name}</div>
                      <div className="text-sm opacity-60">{artist.followers?.toLocaleString() || 0} followers</div>
                      {artist.playCount && (
                        <div className="text-sm text-[#00e461] mt-1">{artist.playCount} plays</div>
                      )}
                      <div className="text-xs opacity-60 mt-2">Popularity: {artist.popularity || 0}/100</div>
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
