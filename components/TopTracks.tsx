"use client";

import Image from "next/image";
import { Music } from "lucide-react";

interface Track {
  id: string;
  name: string;
  artist: string;
  image?: string;
  playCount: number;
}

export default function TopTracks({ tracks }: { tracks: Track[] }) {
  return (
    <div className="bg-[#111111] rounded-xl p-6 border border-[#1a1a1a]">
      <h3 className="text-lg font-bold mb-4">Top Tracks</h3>
      <div className="space-y-2">
        {tracks.slice(0, 10).map((track, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1a1a1a] transition-colors"
          >
            <div className="w-6 h-6 rounded bg-[#00e461] text-black flex items-center justify-center text-xs font-bold">
              {i + 1}
            </div>
            <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-[#1f1f1f]">
              {track.image ? (
                <Image
                  src={`/api/image-proxy?url=${encodeURIComponent(
                    track.image
                  )}`}
                  alt={track.name}
                  fill
                  sizes="40px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[#b3b3b3]">
                  <Music className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{track.name}</div>
              <div className="text-xs opacity-60 truncate">{track.artist}</div>
            </div>
            <div className="text-sm text-[#00e461] font-medium">
              {track.playCount}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
