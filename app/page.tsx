"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { usePlayCapture } from "../hooks/usePlayCapture";

// Lazy load heavy components
const TopArtists = lazy(() => import("../components/TopArtists"));
const TopTracks = lazy(() => import("../components/TopTracks"));
const TopGenres = lazy(() => import("../components/TopGenres"));

interface Stats {
  totalPlays?: number;
  totalArtists?: number;
  totalTracks?: number;
  topArtists?: any[];
  topTracks?: any[];
  topGenres?: any[];
  lastSynced?: string;
}

export default function Page() {
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [range, setRange] = useState<"all" | "month" | "year">("all");

  // Start capturing plays when page loads
  usePlayCapture();

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
      setLoading(false);
    }
    fetchData();
  }, [range]);

  // Fetch profile without blocking initial render
  useEffect(() => {
    fetch(`/api/spotify/me`, { cache: "no-store" })
      .then((res) => res.ok && res.json())
      .then((data) => setProfile(data || {}))
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar profile={profile} />

        <main className="flex-1 overflow-y-auto px-6 py-6 pb-24">
          {/* Header */}
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

          {/* KPI Cards - Always visible for fast load */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#111] rounded-lg p-4 animate-pulse">
                  <div className="h-8 bg-[#222] rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-[#222] rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
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

              {/* Lazy-loaded components */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Suspense
                  fallback={
                    <div className="bg-[#111] rounded-lg h-96 animate-pulse" />
                  }
                >
                  <TopArtists artists={stats.topArtists || []} />
                </Suspense>
                <Suspense
                  fallback={
                    <div className="bg-[#111] rounded-lg h-96 animate-pulse" />
                  }
                >
                  <TopTracks tracks={stats.topTracks || []} />
                </Suspense>
              </div>

              <Suspense
                fallback={
                  <div className="bg-[#111] rounded-lg h-48 animate-pulse" />
                }
              >
                <TopGenres
                  genres={stats.topGenres || []}
                  lastSynced={stats.lastSynced}
                />
              </Suspense>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
