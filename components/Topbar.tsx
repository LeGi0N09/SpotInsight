'use client';

import { Calendar, Bell } from 'lucide-react';
import { useState } from 'react';

interface ProfileResponse {
  display_name?: string;
  id?: string;
  images?: Array<{ url: string }>;
}

interface TopbarProps {
  profile: ProfileResponse;
  onFilterChange?: (filter: string) => void;
  currentFilter?: string;
}

export default function Topbar({ profile, onFilterChange, currentFilter = 'alltime' }: TopbarProps) {
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const initials = profile.display_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const filters = [
    { value: 'alltime', label: 'All Time' },
    { value: 'year', label: 'Last 6 Months' },
    { value: 'month', label: 'Last 4 Weeks' },
  ];

  return (
    <div className="flex items-center justify-end bg-[#0e0e0e] px-4 sm:px-6 py-3 border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="relative">
          <button 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-2 bg-[#171717] px-3 py-1.5 rounded-full text-xs hover:bg-[#1f1f1f] transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{filters.find(f => f.value === currentFilter)?.label}</span>
          </button>
          {showFilterMenu && (
            <div className="absolute top-full mt-1 right-0 bg-[#171717] rounded-lg shadow-lg py-1 z-[70] border border-white/10">
              {filters.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => {
                    onFilterChange?.(filter.value);
                    setShowFilterMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-xs hover:bg-[#1f1f1f] transition-colors whitespace-nowrap"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="p-2 rounded-full bg-[#171717] hover:bg-[#1f1f1f] transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <div className="text-xs opacity-60 hidden sm:block">{profile.display_name || 'User'}</div>
        {profile.images?.[0]?.url ? (
          <img
            src={profile.images[0].url}
            alt={profile.display_name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#00e461] text-black flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
        )}
      </div>
    </div>
  );
}
