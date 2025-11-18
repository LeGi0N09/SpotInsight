"use client";

import { useEffect, useState } from "react";
import { Activity, Database } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { toIST } from "../../lib/time";

export default function HealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [profile, setProfile] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      const base = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";
      const [healthRes, profileRes] = await Promise.all([
        fetch(`${base}/api/health`),
        fetch(`${base}/api/spotify/me`, { cache: "no-store" }),
      ]);
      setHealth(healthRes.ok ? await healthRes.json() : null);
      setProfile(profileRes.ok ? await profileRes.json() : {});
    };

    fetchData();
    const interval = setInterval(() => {
      fetch("/api/health").then(res => res.json()).then(setHealth);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-24 pt-16 lg:pt-4">
          <h1 className="text-xl sm:text-2xl font-bold mb-6">System Health</h1>

          {!health ? (
            <div className="text-center py-20 opacity-60">Loading...</div>
          ) : (
            <>
              {/* Status Banner */}
              <div className={`rounded-2xl p-6 mb-6 border-2 ${
                health.cron?.status === 'degraded' ? 'bg-red-500/10 border-red-500/30' : 'bg-[#00e461]/10 border-[#00e461]/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full animate-pulse ${health.cron?.status === 'degraded' ? 'bg-red-500' : 'bg-[#00e461]'}`} />
                    <div>
                      <div className="text-2xl font-bold">{health.cron?.status === 'degraded' ? 'Degraded' : 'Operational'}</div>
                      <div className="text-xs opacity-60 mt-1">{toIST(health.timestamp)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{health.uptime?.percentage || 100}%</div>
                    <div className="text-xs opacity-60">{health.uptime?.successful}/{health.uptime?.last24h} runs</div>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#0e0e0e] rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${health.cron?.status === 'degraded' ? 'bg-red-500' : 'bg-[#00e461]'}`} />
                    <div className="font-semibold">Cron Job</div>
                  </div>
                  <div className="text-xs opacity-60">{health.cron?.minutesSinceLastRun}m ago</div>
                </div>
                <div className="bg-[#0e0e0e] rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full bg-[#00e461]" />
                    <div className="font-semibold">Database</div>
                  </div>
                  <div className="text-xs opacity-60">{health.database?.totalPlays} plays</div>
                </div>
                <div className="bg-[#0e0e0e] rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full bg-[#00e461]" />
                    <div className="font-semibold">Spotify API</div>
                  </div>
                  <div className="text-xs opacity-60">~50ms</div>
                </div>
              </div>

              {/* Last 7 Days */}
              <div className="bg-[#0e0e0e] rounded-2xl p-6 border border-white/5 mb-6">
                <h2 className="text-lg font-semibold mb-4">Last 7 Days</h2>
                <div className="space-y-2">
                  {Array.from({ length: 7 }).reverse().map((_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    const dayData = health.dailyUptime?.[dateStr];
                    if (!dayData) return null;
                    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-16 text-xs opacity-60">{monthDay}</div>
                        <div className="flex-1 bg-white/5 rounded h-6 overflow-hidden relative">
                          <div className="h-full bg-[#00e461]" style={{ width: `${(dayData.success/dayData.total)*100}%` }} />
                        </div>
                        <div className="text-xs font-mono w-16">{dayData.success}/{dayData.total}</div>
                        <div className="text-xs opacity-60 w-16">{dayData.plays}p</div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              </div>

              {/* Recent Jobs */}
              <div className="bg-[#0e0e0e] rounded-2xl p-6 border border-white/5">
                <h2 className="text-lg font-semibold mb-4">Recent Jobs</h2>
                <div className="space-y-2">
                  {health.cron?.history?.slice(0, 10).map((log: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 bg-[#111111] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-[#00e461]' : 'bg-red-500'}`} />
                        <div className="text-xs font-mono opacity-60">{toIST(log.executed_at)}</div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="font-mono">{log.plays_saved}p</div>
                        {log.duration_ms && <div className="opacity-60">{log.duration_ms}ms</div>}
                      </div>
                    </div>
                  )) || <div className="text-center py-8 opacity-60 text-sm">No history</div>}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
