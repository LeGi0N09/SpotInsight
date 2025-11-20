'use client';

import { LayoutDashboard, HelpCircle, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button - hide when sidebar is open */}
      {!mobileOpen && (
        <button 
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-[40] bg-[#0e0e0e] p-2.5 rounded-xl border border-[#00e461]/20 shadow-lg backdrop-blur-sm"
        >
          <Menu className="w-5 h-5 text-[#00e461]" />
        </button>
      )}

      {/* Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[45]"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[50]
        w-64 bg-gradient-to-b from-[#0e0e0e] to-[#050505] p-4 flex flex-col
        border-r border-[#00e461]/10
        transform transition-transform duration-300 ease-out
        ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-full bg-[#00e461] flex items-center justify-center font-bold text-black text-sm">
            S
          </div>
          <div>
            <div className="text-sm font-semibold">Spotify</div>
            <div className="text-xs opacity-60">Dashboard</div>
          </div>
        </div>
        <button 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5 text-[#00e461]" />
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        <a href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/5 text-sm transition-colors">
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </a>
        <a href="/artists" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/5 text-sm transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 12c2.209 0 4-1.791 4-4s-1.791-4-4-4-4 1.791-4 4 1.791 4 4 4z" />
            <path d="M3 20c0-3 4-5 9-5s9 2 9 5" strokeLinecap="round" />
          </svg>
          <span>Top Artists</span>
        </a>
        <a href="/tracks" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/5 text-sm transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
          <span>Top Tracks</span>
        </a>
        <a href="/activity" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/5 text-sm transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Activity</span>
        </a>
        <a href="/health" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/5 text-sm transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <span>Health</span>
        </a>
      </nav>

      <div className="flex items-center gap-2 px-3 py-2 text-xs opacity-60 hover:opacity-100 cursor-pointer transition-opacity">
        <HelpCircle className="w-4 h-4" />
        <span>Help</span>
      </div>
    </aside>
    </>
  );
}
