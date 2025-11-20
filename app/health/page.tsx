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
      const [healthRes, profileRes] = await Promise.all([
        fetch(`/api/health`),
        fetch(`/api/spotify/me`, { cache: "no-store" }),
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

              {/* All Cron Jobs - Pass/Fail Icons by Date */}
              <div className="bg-[#0e0e0e] rounded-2xl p-6 border border-white/5">
                <h2 className="text-lg font-semibold mb-4">All Cron Jobs</h2>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {(() => {
                    const grouped: Record<string, any[]> = {};
                    health.cron?.history?.forEach((log: any) => {
                      const date = new Date(log.executed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      if (!grouped[date]) grouped[date] = [];
                      grouped[date].push(log);
                    });
                    return Object.entries(grouped).map(([date, logs]) => (
                      <div key={date} className="flex items-center gap-4 py-3 px-4 bg-[#111111] rounded-lg hover:bg-[#1a1a1a] transition-colors">
                        <div className="w-24 text-sm font-semibold opacity-70">{date}</div>
                        <div className="flex-1 flex items-center gap-1.5">
                          {logs.map((log: any, i: number) => (
                            <div 
                              key={i} 
                              className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
                                log.status === 'success' ? 'bg-[#00e461]' : 'bg-red-500'
                              }`}
                              title={`${new Date(log.executed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}\n${log.plays_saved || 0} songs synced\n${log.duration_ms}ms`}
                            >
                              {log.status === 'success' ? (
                                <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="text-xs opacity-60">{logs.length} runs</div>
                      </div>
                    ));
                  })() || <div className="text-center py-8 opacity-60 text-sm">No cron job history</div>}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
