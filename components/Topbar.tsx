"use client";

import { Bell } from "lucide-react";

interface ProfileResponse {
  display_name?: string;
  id?: string;
  images?: Array<{ url: string }>;
}

interface TopbarProps {
  profile: ProfileResponse;
}

export default function Topbar({ profile }: TopbarProps) {
  const name = profile?.display_name ?? "User";

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarUrl = profile?.images?.[0]?.url ?? null;

  return (
    <div className="flex items-center justify-end px-4 sm:px-6 py-3 bg-[#0e0e0e] border-b border-white/5 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        {/* Notification */}
        <button
          className="p-2 rounded-full bg-[#161616] hover:bg-[#1f1f1f] border border-white/5 
                     transition-all active:scale-95 shadow-sm"
        >
          <Bell className="w-4 h-4 opacity-80" />
        </button>

        {/* Username */}
        <div className="hidden sm:block text-sm text-white/80">{name}</div>

        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-9 h-9 rounded-full object-cover border border-white/10 shadow-inner"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#00e461] text-black flex items-center justify-center text-xs font-bold shadow-inner">
            {initials}
          </div>
        )}
      </div>
    </div>
  );
}
