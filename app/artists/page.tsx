"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { CardSkeleton } from "../../components/Skeleton";
import Image from "next/image";

// Types
interface Artist {
  id: string;
  name: string;
  image?: string;
  followers?: number;
  playCount?: number;
  totalTimeMs?: number;
  popularity?: number;
}

interface StatsResponse {
  topArtists?: Artist[];
}

interface ProfileResponse {
  display_name?: string;
  images?: Array<{ url: string }>;
}

export default function ArtistsPage() {
  const [stats, setStats] = useState<StatsResponse>({});
  const [profile, setProfile] = useState<ProfileResponse>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [statsRes, profileRes] = await Promise.all([
        fetch(`/api/stats`, { cache: "force-cache" }),
        fetch(`/api/spotify/me`, { cache: "force-cache" }),
      ]);

      setStats(statsRes.ok ? await statsRes.json() : {});
      setProfile(profileRes.ok ? await profileRes.json() : {});
      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar profile={profile} />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-24 pt-16 lg:pt-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Top Artists</h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(12)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
              {stats.topArtists?.map((artist, index) => (
                <div
                  key={artist.id}
                  className="bg-[#111111] rounded-2xl p-4 hover:bg-[#1a1a1a] transition-all hover:scale-105"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#00e461] text-black flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>

                    {artist.image && (
                      <Image
                        src={artist.image}
                        alt={artist.name}
                        width={80}
                        height={80}
                        className="rounded-full"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-bold truncate">
                        {artist.name}
                      </div>

                      <div className="text-sm opacity-60">
                        {artist.followers?.toLocaleString() || 0} followers
                      </div>

                      {artist.playCount ? (
                        <div className="text-sm text-[#00e461] mt-1">
                          {artist.playCount} plays •{" "}
                          {Math.floor((artist.totalTimeMs ?? 0) / 60000)}m
                        </div>
                      ) : null}

                      <div className="text-xs opacity-60 mt-2">
                        Popularity: {artist.popularity || 0}/100
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
