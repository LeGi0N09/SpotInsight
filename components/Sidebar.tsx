'use client';

import { LayoutDashboard, RefreshCw, HelpCircle, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('Syncing data from Spotify...');
    
    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      
      if (data.success) {
        setSyncMessage(`✓ Synced: ${data.counts.tracks_long} tracks, ${data.counts.artists_long} artists, ${data.counts.recent_plays} recent plays`);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setSyncMessage('✗ Sync failed. Please try again.');
        setTimeout(() => setSyncMessage(''), 3000);
      }
    } catch (error) {
      setSyncMessage('✗ Error syncing data');
      setTimeout(() => setSyncMessage(''), 3000);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <button 
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] bg-[#0e0e0e] p-2 rounded-lg border border-white/10"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-[45]"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[50]
        w-56 bg-[#0e0e0e] p-3 flex flex-col
        transform transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {syncMessage && (
        <div className="absolute top-3 left-full ml-3 bg-[#00e461] text-black px-4 py-2 rounded-lg text-xs font-medium shadow-lg z-50 whitespace-nowrap animate-slideIn">
          {syncMessage}
        </div>
      )}
      <div className="flex items-center gap-2 px-2 mb-6">
        <div className="w-8 h-8 rounded-full bg-[#00e461] flex items-center justify-center font-bold text-black text-sm">
          S
        </div>
        <div>
          <div className="text-sm font-semibold">Spotify</div>
          <div className="text-xs opacity-60">Dashboard</div>
        </div>
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

        <a href="/insights" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/5 text-sm transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span>Insights</span>
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

        <button 
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/5 text-sm transition-colors w-full text-left disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing...' : 'Sync Data'}</span>
        </button>
      </nav>

      <div className="flex items-center gap-2 px-3 py-2 text-xs opacity-60 hover:opacity-100 cursor-pointer transition-opacity">
        <HelpCircle className="w-4 h-4" />
        <span>Help</span>
      </div>
    </aside>
    </>
  );
}
