"use client";

import { useState, useEffect, useMemo } from "react";
import { Play, Pause, Music } from "lucide-react";
import Image from "next/image";

interface Track {
  name: string;
  artist: string;
  image?: string;
  duration: number;
  progress?: number;
  playedAt?: string;
}

interface NowPlayingResponse {
  isPlaying: boolean;
  track: Track | null;
}

export default function NowPlaying() {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingResponse | null>(null);
  const [localProgress, setLocalProgress] = useState(0);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      const res = await fetch("/api/now-playing");
      const data: NowPlayingResponse = await res.json();
      setNowPlaying(data);

      if (data.isPlaying && data.track?.progress) {
        setLocalProgress(data.track.progress);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!nowPlaying?.isPlaying || !nowPlaying.track?.duration) return;

    const interval = setInterval(() => {
      setLocalProgress((prev) =>
        Math.min(prev + 1000, nowPlaying.track!.duration)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [nowPlaying?.isPlaying, nowPlaying?.track?.duration]);

  const formatTimeAgo = useMemo(() => {
    return (timestamp: string) => {
      const diffMinutes = Math.floor(
        (Date.now() - new Date(timestamp).getTime()) / 60000
      );

      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      return `${Math.floor(diffMinutes / 60)}h ago`;
    };
  }, []);

  // Loading State
  if (!nowPlaying) {
    return (
      <div className="bg-[#101010] border border-white/10 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-white/10 flex justify-center items-center">
            <Music className="w-7 h-7 opacity-40" />
          </div>
          <div>
            <div className="text-sm opacity-60">Now Playing</div>
            <div className="text-xs opacity-40">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  // Not Playing State
  if (!nowPlaying.isPlaying) {
    return (
      <div className="bg-[#101010] border border-white/10 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-4">
          {nowPlaying.track?.image ? (
            <Image
              src={nowPlaying.track.image}
              alt={nowPlaying.track.name}
              width={64}
              height={64}
              className="rounded-xl opacity-70"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-white/10 flex justify-center items-center">
              <Pause className="w-7 h-7 opacity-40" />
            </div>
          )}

          <div className="min-w-0">
            <div className="text-sm opacity-60">Last Played</div>
            <div className="text-base font-semibold truncate">
              {nowPlaying.track?.name}
            </div>
            <div className="text-xs opacity-50 mt-1">
              {nowPlaying.track?.playedAt
                ? formatTimeAgo(nowPlaying.track.playedAt)
                : "Play something on Spotify"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Playing State
  const progress =
    localProgress && nowPlaying.track?.duration
      ? Math.min((localProgress / nowPlaying.track.duration) * 100, 100)
      : 0;

  return (
    <div className="bg-[#101010] border border-white/10 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center gap-4 mb-3">
        {nowPlaying.track?.image ? (
          <Image
            src={nowPlaying.track.image}
            alt={nowPlaying.track.name}
            width={72}
            height={72}
            className="rounded-xl shadow-md"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-white/10 flex justify-center items-center">
            <Music className="w-7 h-7 opacity-40" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold truncate">
            {nowPlaying.track?.name}
          </div>
          <div className="text-sm opacity-60 truncate">
            {nowPlaying.track?.artist}
          </div>
          <div className="text-xs text-[#00ff75] mt-1">Playing</div>
        </div>
      </div>

      <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
        <div
          className="h-1 bg-[#00ff75] rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
