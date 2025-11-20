"use client";

import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

export default function InsightsPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar profile={{}} />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 pt-16 lg:pt-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Insights</h2>
          <div className="bg-[#111111] rounded-2xl p-8 text-center">
            <p className="opacity-60">Coming Soon</p>
          </div>
        </main>
      </div>
    </div>
  );
}
