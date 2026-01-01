"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Music, RotateCw } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { usePlayCapture } from "../../hooks/usePlayCapture";

interface Play {
  id: string;
  track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  image_url?: string;
  album_image?: string;
  duration_ms?: number;
  ms_played?: number;
  played_at: string;
}

export default function LatestPlaysPage() {
  const [plays, setPlays] = useState<Play[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({});

  // Auto-capture plays while on this page
  usePlayCapture();

  async function fetchLatestPlays() {
    try {
      setLoading(true);
      const res = await fetch("/api/plays/latest?limit=50", {
        cache: "no-store",
      });
      const data = await res.json();

      if (data.success) {
        setPlays(data.plays);
      }
    } catch (error) {
      console.error("Failed to fetch plays:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLatestPlays();

    // Fetch profile
    const fetchProfile = async () => {
      const profileRes = await fetch(`/api/spotify/me`, { cache: "no-store" });
      setProfile(profileRes.ok ? await profileRes.json() : {});
    };
    fetchProfile();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (ms?: number) => {
    if (!ms || ms === 0) return "--:--";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar profile={profile} />

        <main className="flex-1 overflow-y-auto px-6 py-6 pb-24">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold">Latest Plays</h2>
              <p className="text-sm opacity-60 mt-1">
                Last 50 songs you&apos;ve played
              </p>
            </div>

            <button
              onClick={fetchLatestPlays}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00e461] text-black font-medium hover:bg-[#00cc55] transition-colors disabled:opacity-50"
            >
              <RotateCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="bg-[#111] rounded-lg p-4 animate-pulse flex gap-4"
                >
                  <div className="w-16 h-16 bg-[#222] rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#222] rounded w-1/2"></div>
                    <div className="h-3 bg-[#222] rounded w-1/3"></div>
                    <div className="h-3 bg-[#222] rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : plays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Music className="w-12 h-12 opacity-30 mb-4" />
              <p className="text-lg opacity-60">No plays recorded yet</p>
              <p className="text-sm opacity-40 mt-1">
                Plays will appear here as you listen to music
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {plays.map((play, index) => (
                <div
                  key={play.id}
                  className="bg-[#111111] rounded-lg p-4 hover:bg-[#1a1a1a] transition-colors flex items-center gap-4 border border-[#1a1a1a]"
                >
                  <div className="w-6 h-6 rounded bg-[#00e461] text-black flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>

                  <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-[#1f1f1f] border border-white/5">
                    {play.image_url || play.album_image ? (
                      <Image
                        src={play.image_url || play.album_image || ""}
                        alt={play.track_name}
                        fill
                        sizes="64px"
                        className="object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : null}
                    {!play.image_url && !play.album_image && (
                      <div className="absolute inset-0 flex items-center justify-center text-[#b3b3b3]">
                        <Music className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-base">
                      {play.track_name}
                    </div>
                    <div className="text-sm opacity-70 truncate">
                      {play.artist_name}
                    </div>
                    <div className="text-xs opacity-50 truncate">
                      {play.album_name}
                    </div>
                  </div>

                  <div className="flex gap-4 items-center flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-[#00e461] font-medium">
                        {formatDuration(play.duration_ms || play.ms_played)}
                      </div>
                      <div className="text-xs opacity-50">
                        {formatDate(play.played_at)}
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
