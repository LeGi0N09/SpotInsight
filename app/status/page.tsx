"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

interface HealthStatus {
  status: string;
  lastSync: string;
  plays_count: number;
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, []);

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
          <div className="mb-8">
            <div>
              <h2 className="text-3xl font-bold">Sync Status</h2>
              <p className="text-sm opacity-60 mt-1">
                Monitor data syncing • Times shown in your local timezone
              </p>
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
            </>
          )}
        </main>
      </div>
    </div>
  );
}
