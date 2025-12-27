"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

interface CronLog {
  id: string;
  job_name: string;
  status: string;
  plays_saved?: number;
  error_message?: string;
  executed_at: string;
  duration_ms?: number;
}

interface HealthStatus {
  status: string;
  lastSync: string;
  plays_count: number;
  cron_logs: CronLog[];
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [toast, setToast] = useState<null | {
    type: "success" | "error";
    message: string;
  }>(null);
  const formatDate = (d: string | number | Date) => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      }).format(new Date(d));
    } catch {
      return new Date(d).toLocaleString();
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = autoRefresh ? setInterval(fetchStatus, 5000) : undefined;
    return () => clearInterval(interval);
  }, [autoRefresh]);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      setHealth(data);
      setError("");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function triggerSync() {
    try {
      const res = await fetch("/api/sync", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        const saved = data.plays_saved ?? 0;
        const processed = data.total_plays_processed ?? 0;
        const duration = data.duration_ms ?? 0;
        setToast({
          type: "success",
          message: `Sync successful • Saved ${saved} new \u2022 Processed ${processed} \u2022 ${duration}ms`,
        });
      } else {
        setToast({
          type: "error",
          message: `Sync failed: ${data?.error || res.statusText}`,
        });
      }
      setTimeout(() => setToast(null), 5000);
      fetchStatus();
    } catch (err) {
      setToast({ type: "error", message: `Sync failed: ${String(err)}` });
      setTimeout(() => setToast(null), 5000);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Topbar profile={{}} />

        <main className="flex-1 overflow-y-auto px-6 py-6 pb-24">
          {toast && (
            <div
              className={`fixed right-6 top-6 z-50 px-4 py-3 rounded-lg border shadow-lg ${
                toast.type === "success"
                  ? "bg-[#00e461]/10 border-[#00e461] text-[#00e461]"
                  : "bg-red-900/10 border-red-500 text-red-400"
              }`}
            >
              {toast.message}
            </div>
          )}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">Sync Status</h2>
                <p className="text-sm opacity-60 mt-1">
                  Monitor cron jobs and data syncing • Times shown in your local
                  timezone
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    autoRefresh
                      ? "bg-[#00e461] text-black hover:bg-[#00d455]"
                      : "bg-[#333] text-white hover:bg-[#444]"
                  }`}
                >
                  {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
                </button>
                <button
                  onClick={triggerSync}
                  className="px-4 py-2 bg-[#00e461] text-black rounded-lg font-medium hover:bg-[#00d455] transition-colors"
                >
                  Sync Now
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500 p-4 rounded-lg mb-6">
              <p className="text-red-300">Error: {error}</p>
            </div>
          )}

          {health && (
            <>
              {/* System Status */}
              <div className="bg-[#111111] rounded-2xl p-6 border border-[#1a1a1a] mb-6">
                <h3 className="text-lg font-bold mb-4">System Status</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm opacity-60">Status</div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-3 h-3 rounded-full bg-[#00e461]" />
                      <span className="font-semibold capitalize">
                        {health.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-60">Total Plays</div>
                    <div className="text-2xl font-bold mt-2">
                      {health.plays_count.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-60">Last Sync</div>
                    <div className="text-sm font-mono mt-2">
                      {formatDate(health.lastSync)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cron Job Logs */}
              <div className="bg-[#111111] rounded-2xl p-6 border border-[#1a1a1a]">
                <h3 className="text-lg font-bold mb-4">Recent Cron Jobs</h3>

                {health.cron_logs.length === 0 ? (
                  <div className="text-center py-8 opacity-50">
                    No cron jobs executed yet
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {health.cron_logs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-4 rounded-lg border ${
                          log.status === "success"
                            ? "bg-[#00e461]/10 border-[#00e461] text-[#00e461]"
                            : "bg-red-900/10 border-red-500 text-red-400"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold">{log.job_name}</div>
                            <div className="text-xs opacity-70 mt-1">
                              {formatDate(log.executed_at)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-sm font-bold capitalize ${
                                log.status === "success"
                                  ? "text-[#00e461]"
                                  : "text-red-400"
                              }`}
                            >
                              {log.status}
                            </div>
                            {log.duration_ms && (
                              <div className="text-xs opacity-60 mt-1">
                                {log.duration_ms}ms
                              </div>
                            )}
                          </div>
                        </div>

                        {log.plays_saved && (
                          <div className="mt-2 text-sm">
                            ✓ Saved {log.plays_saved} plays
                          </div>
                        )}

                        {log.error_message && (
                          <div className="mt-2 text-sm font-mono bg-black/30 p-2 rounded">
                            {log.error_message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Help Section */}
              <div className="bg-[#111111] rounded-2xl p-6 border border-[#1a1a1a] mt-6">
                <h3 className="text-lg font-bold mb-4">
                  How to Set Up Cron Jobs
                </h3>
                <div className="space-y-4 text-sm opacity-80">
                  <div>
                    <p className="font-semibold text-white mb-2">
                      1. Local Testing
                    </p>
                    <code className="block bg-black/50 p-3 rounded text-[#00e461] text-xs">
                      npm run cron
                    </code>
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-2">
                      2. Vercel Cron
                    </p>
                    <p>
                      Cron jobs run automatically via{" "}
                      <code className="bg-[#333] px-2 py-1 rounded text-xs">
                        /api/cron
                      </code>
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-2">
                      3. External Cron
                    </p>
                    <code className="block bg-black/50 p-3 rounded text-[#00e461] text-xs">
                      curl https://your-domain.com/api/sync
                    </code>
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-2">
                      Data Accuracy
                    </p>
                    <p>
                      The app fetches recently-played tracks (last 50) every
                      sync. For full accuracy, run cron jobs every{" "}
                      <span className="font-semibold">15-30 minutes</span>.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
