"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { TrendingUp, Flame, Clock, Heart, Calendar } from "lucide-react";

export default function InsightsPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const base = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";
      const [insightsRes, profileRes] = await Promise.all([
        fetch(`${base}/api/insights`, { cache: "no-store" }),
        fetch(`${base}/api/spotify/me`, { cache: "no-store" }),
      ]);
      const insightsData = insightsRes.ok ? await insightsRes.json() : { insights: [] };
      setInsights(insightsData.insights || []);
      setProfile(profileRes.ok ? await profileRes.json() : {});
      setLoading(false);
    }
    fetchData();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "listening_time": return <Clock className="w-6 h-6" />;
      case "streak": return <Flame className="w-6 h-6" />;
      case "peak_time": return <TrendingUp className="w-6 h-6" />;
      case "loyalty": return <Heart className="w-6 h-6" />;
      case "active_days": return <Calendar className="w-6 h-6" />;
      default: return <TrendingUp className="w-6 h-6" />;
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 pt-16 lg:pt-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Your Listening Insights</h2>
          {loading ? (
            <div className="text-center py-20 opacity-60">Loading insights...</div>
          ) : insights.length === 0 ? (
            <div className="bg-[#111111] rounded-2xl p-8 text-center">
              <p className="opacity-60 mb-4">No insights available yet</p>
              <p className="text-sm opacity-40">Import your streaming history to see personalized insights</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fadeIn">
              {insights.map((insight, i) => (
                <div key={i} className="bg-[#111111] rounded-2xl p-6 hover:bg-[#1a1a1a] transition-all">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#00e461]/10 rounded-lg text-[#00e461]">
                      {getIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm opacity-60 mb-1">{insight.title}</div>
                      <div className="text-2xl font-bold mb-2">{insight.value}</div>
                      <div className="text-sm opacity-70">{insight.description}</div>
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
