"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import NowPlaying from "../../components/NowPlaying";
import { Music, Clock } from "lucide-react";

export default function ActivityPage() {
  const [plays, setPlays] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(50);
  const [totalLoaded, setTotalLoaded] = useState(100);

  useEffect(() => {
    async function fetchData(showLoading = true) {
      if (showLoading) setLoading(true);
      const [playsRes, profileRes] = await Promise.all([
        fetch(`/api/plays?limit=${totalLoaded}`, { next: { revalidate: 30 } }),
        fetch(`/api/spotify/me`, { next: { revalidate: 3600 } }),
      ]);
      const newPlays = playsRes.ok ? await playsRes.json() : [];
      setPlays(newPlays);
      setProfile(profileRes.ok ? await profileRes.json() : {});
      setLoading(false);
    }
    fetchData();
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [totalLoaded]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const toIST = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const groupByDate = (plays: any[]) => {
    const groups: Record<string, any[]> = {};
    plays.forEach(play => {
      const date = new Date(play.played_at).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(play);
    });
    return groups;
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const visiblePlays = plays.slice(0, displayCount);
  const grouped = groupByDate(visiblePlays);
  const hasMore = displayCount < plays.length;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-24 pt-16 lg:pt-4">
          <NowPlaying />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6 mt-6">
            <h2 className="text-2xl sm:text-3xl font-bold">Recent Activity</h2>
            <div className="flex items-center gap-2 bg-[#00e461]/10 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-[#00e461] animate-pulse" />
              <span className="text-sm font-medium text-[#00e461]">{plays.length} plays</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 opacity-60">Loading activity...</div>
          ) : plays.length === 0 ? (
            <div className="bg-[#111111] rounded-2xl p-8 text-center">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="opacity-60 mb-2">No activity yet</p>
              <p className="text-sm opacity-40">Sync or import data to see your listening history</p>
            </div>
          ) : (
            <div className="space-y-8 animate-fadeIn">
              {Object.entries(grouped).map(([date, dayPlays]) => (
                <div key={date}>
                  <div className="text-sm font-bold opacity-70 mb-4 sticky top-0 bg-black/80 backdrop-blur-sm py-2 z-10">
                    {new Date(date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                  <div className="space-y-2">
                    {dayPlays.map((play, i) => (
                      <div key={i} className="group bg-[#0a0a0a] rounded-lg p-3 hover:bg-[#1a1a1a] transition-all cursor-pointer flex items-center gap-4">
                        {play.album_image ? (
                          <div className="relative flex-shrink-0">
                            <img 
                              src={play.album_image} 
                              alt={play.track_name} 
                              className="w-14 h-14 rounded shadow-lg"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                              <Music className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-[#00e461]/20 to-[#00e461]/5 rounded flex items-center justify-center flex-shrink-0">
                            <Music className="w-6 h-6 text-[#00e461]/60" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate text-white/95 group-hover:text-[#00e461] transition-colors">
                            {play.track_name || 'Unknown Track'}
                          </div>
                          <div className="text-sm text-white/60 truncate">
                            {play.artist_name || 'Unknown Artist'}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/50 flex-shrink-0">
                          {play.duration_ms && (
                            <span className="hidden sm:block">{formatDuration(play.duration_ms)}</span>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatTime(play.played_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {hasMore && (
                <div className="flex justify-center pt-4 gap-3">
                  <button
                    onClick={() => setDisplayCount(prev => prev + 50)}
                    className="bg-[#00e461] hover:bg-[#00e461]/90 text-black font-semibold px-6 py-3 rounded-full transition-all hover:scale-105 active:scale-95"
                  >
                    Show More ({plays.length - displayCount} remaining)
                  </button>
                  {displayCount >= plays.length && totalLoaded < 500 && (
                    <button
                      onClick={() => setTotalLoaded(prev => Math.min(prev + 100, 500))}
                      className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white font-semibold px-6 py-3 rounded-full transition-all hover:scale-105 active:scale-95"
                    >
                      Load More from Database
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
