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

  useEffect(() => {
    async function fetchData() {
      const base = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";

      const [playsRes, profileRes] = await Promise.all([
        fetch(`${base}/api/plays`, { cache: "no-store" }),
        fetch(`${base}/api/spotify/me`, { cache: "no-store" }),
      ]);

      setPlays(playsRes.ok ? await playsRes.json() : []);
      setProfile(profileRes.ok ? await profileRes.json() : {});
      setLoading(false);
    }
    fetchData();
  }, []);

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

  const groupByDate = (plays: any[]) => {
    const groups: Record<string, any[]> = {};
    plays.forEach(play => {
      const date = new Date(play.played_at).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(play);
    });
    return groups;
  };

  const grouped = groupByDate(plays);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto px-4 pb-4">
          <NowPlaying />
          
          <div className="flex items-center justify-between mb-4 mt-6">
            <h2 className="text-2xl font-bold">Recent Activity</h2>
            <div className="text-sm opacity-60">{plays.length} plays tracked</div>
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
            <div className="space-y-6 animate-fadeIn">
              {Object.entries(grouped).map(([date, dayPlays]) => (
                <div key={date}>
                  <div className="text-sm font-semibold opacity-60 mb-3 sticky top-0 bg-black py-2">
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                  <div className="space-y-2">
                    {dayPlays.map((play, i) => (
                      <div key={i} className="bg-[#111111] rounded-xl p-3 hover:bg-[#1a1a1a] transition-colors flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#00e461]/10 rounded flex items-center justify-center flex-shrink-0">
                          <Music className="w-5 h-5 text-[#00e461]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{play.track_name || 'Unknown Track'}</div>
                          <div className="text-sm opacity-60 truncate">{play.artist_name || 'Unknown Artist'}</div>
                        </div>
                        <div className="flex items-center gap-2 text-xs opacity-60 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {formatTime(play.played_at)}
                        </div>
                      </div>
                    ))}
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
