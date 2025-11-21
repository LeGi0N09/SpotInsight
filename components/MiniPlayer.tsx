"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Music, Heart } from "lucide-react";

interface NowPlayingData {
  isPlaying: boolean;
  track?: {
    name: string;
    artist: string;
    image?: string;
    progress: number;
    duration: number;
    isLiked?: boolean;
  };
}

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const Equalizer = () => (
  <div className="flex items-end gap-[2px] h-3">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-[3px] bg-[#00e461] rounded-full animate-[equalize_0.6s_ease-in-out_infinite]"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

export default function MiniPlayer() {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [localProgress, setLocalProgress] = useState(0);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      const res = await fetch("/api/now-playing");
      const data = await res.json();
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
    if (!nowPlaying?.isPlaying || !nowPlaying?.track?.duration) return;

    const interval = setInterval(() => {
      setLocalProgress((prev) =>
        Math.min(prev + 1000, nowPlaying.track!.duration)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [nowPlaying?.isPlaying, nowPlaying?.track?.duration]);

  if (!nowPlaying?.isPlaying || !nowPlaying.track) return null;

  const progress =
    localProgress && nowPlaying.track.duration
      ? Math.min((localProgress / nowPlaying.track.duration) * 100, 100)
      : 0;

  const cover = nowPlaying.track.image;

  return (
    <>
      <style jsx global>{`
        @keyframes equalize {
          0%,
          100% {
            height: 4px;
          }
          50% {
            height: 12px;
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-black/40 border-t border-white/5 z-50 animate-[slideUp_0.35s_ease-out]">
        {/* Progress bar */}
        <div className="relative h-1 bg-[#1a1a1a] group cursor-pointer">
          <div
            className="h-full bg-[#00e461] transition-[width] duration-500 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Player */}
        <div className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-all">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Album Art */}
            {cover ? (
              <div className="relative w-12 h-12">
                <Image
                  src={cover}
                  alt={nowPlaying.track.name}
                  fill
                  sizes="48px"
                  className="rounded shadow-md animate-[spin-slow_20s_linear_infinite]"
                />

                {/* Blur glow bg */}
                <div
                  className="absolute inset-0 -z-10 blur-xl opacity-40 rounded"
                  style={{
                    backgroundImage: `url(${cover})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-[#1a1a1a] rounded flex items-center justify-center">
                <Music className="w-5 h-5 opacity-40" />
              </div>
            )}

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00e461] animate-pulse" />
                <div className="text-sm font-semibold truncate text-white/90 hover:underline">
                  {nowPlaying.track.name}
                </div>
              </div>
              <div className="text-xs text-white/60 truncate hover:underline">
                {nowPlaying.track.artist}
              </div>
            </div>
          </div>

          {/* Liked + EQ */}
          <div className="flex items-center gap-3">
            {nowPlaying.track.isLiked && (
              <Heart className="w-4 h-4 fill-[#00e461] text-[#00e461]" />
            )}
            <Equalizer />
          </div>
        </div>
      </div>
    </>
  );
}
