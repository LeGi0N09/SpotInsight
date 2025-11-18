"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Music } from "lucide-react";

export default function NowPlaying() {
  const [nowPlaying, setNowPlaying] = useState<any>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      const res = await fetch("/api/now-playing");
      const data = await res.json();
      setNowPlaying(data);
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 5000); // Poll every 5 seconds for live updates

    return () => clearInterval(interval);
  }, []);

  if (!nowPlaying) {
    return (
      <div className="bg-[#0e0e0e] rounded-2xl p-4 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-[#1a1a1a] rounded flex items-center justify-center">
            <Music className="w-6 h-6 opacity-40" />
          </div>
          <div className="flex-1">
            <div className="text-sm opacity-60">Now Playing</div>
            <div className="text-xs opacity-40 mt-1">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return `${Math.floor(diffMinutes / 60)}h ago`;
  };

  if (!nowPlaying.isPlaying) {
    return (
      <div className="bg-[#0e0e0e] rounded-2xl p-4 border border-white/5">
        <div className="flex items-center gap-3">
          {nowPlaying.track?.image ? (
            <img src={nowPlaying.track.image} alt={nowPlaying.track.name} className="w-16 h-16 rounded opacity-60" />
          ) : (
            <div className="w-16 h-16 bg-[#1a1a1a] rounded flex items-center justify-center">
              <Pause className="w-6 h-6 opacity-40" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm opacity-60">Last Played</div>
            <div className="text-xs font-medium truncate">{nowPlaying.track?.name || 'Unknown'}</div>
            <div className="text-xs opacity-40 mt-1">{nowPlaying.track?.playedAt ? formatTimeAgo(nowPlaying.track.playedAt) : 'Play something on Spotify'}</div>
          </div>
        </div>
      </div>
    );
  }

  const progress = nowPlaying.track.progress && nowPlaying.track.duration 
    ? (nowPlaying.track.progress / nowPlaying.track.duration) * 100 
    : 0;

  return (
    <div className="bg-[#0e0e0e] rounded-2xl p-4 border border-[#00e461]/20 animate-fadeIn">
      <div className="flex items-center gap-3 mb-2">
        <div className="relative">
          {nowPlaying.track.image ? (
            <img src={nowPlaying.track.image} alt={nowPlaying.track.name} className="w-16 h-16 rounded" />
          ) : (
            <div className="w-16 h-16 bg-[#1a1a1a] rounded flex items-center justify-center">
              <Music className="w-6 h-6 opacity-40" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#00e461] rounded-full flex items-center justify-center animate-pulse">
            <Play className="w-3 h-3 text-black fill-black" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{nowPlaying.track.name}</div>
          <div className="text-xs opacity-60 truncate">{nowPlaying.track.artist}</div>
          <div className="text-xs text-[#00e461] mt-1">🎵 Playing Live</div>
        </div>
      </div>
      <div className="w-full bg-[#1a1a1a] rounded-full h-1">
        <div className="bg-[#00e461] h-1 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
