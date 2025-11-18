"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

export default function GenresPage() {
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
          <h2 className="text-2xl font-bold mb-4">Top Genres</h2>
          {loading ? (
            <div className="text-center py-20 opacity-60">Loading...</div>
          ) : (
            <div className="grid grid-cols-4 gap-4 animate-fadeIn">
              {stats.topGenres?.map((genre: any, i: number) => (
                <div key={i} className="bg-[#111111] rounded-2xl p-6 hover:bg-[#1a1a1a] transition-all hover:scale-105">
                  <div className="text-sm opacity-60 mb-2">#{i + 1}</div>
                  <div className="text-xl font-bold capitalize mb-2">{genre.genre}</div>
                  <div className="text-sm text-[#00e461]">{genre.count} artists</div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
