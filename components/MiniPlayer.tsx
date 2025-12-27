"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Music, Play } from "lucide-react";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { images: Array<{ url: string }> };
  external_urls: { spotify: string };
}

interface CurrentTrack {
  track: SpotifyTrack | null;
  isPlaying: boolean;
  source?: "current" | "recent";
  playedAt?: string;
  error?: string;
}

export default function MiniPlayer() {
  const [current, setCurrent] = useState<CurrentTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        const res = await fetch("/api/spotify/current");
        const data = await res.json();
        console.log("[MiniPlayer] Raw response:", data);

        if (data?.track) {
          console.log("[MiniPlayer] Track found:", {
            name: data.track.name,
            artist: data.track.artists?.[0]?.name,
            hasImages: !!data.track.album?.images?.length,
            imageUrl: data.track.album?.images?.[0]?.url,
          });
        }

        setCurrent(data);
      } catch (error) {
        console.error("[MiniPlayer] Fetch error:", error);
        setCurrent({ track: null, isPlaying: false, error: String(error) });
      } finally {
        setLoading(false);
      }
    };

    fetchCurrent();
    const interval = setInterval(fetchCurrent, 5000);
    return () => clearInterval(interval);
  }, []);

  // Reset loader when track id changes (must be before any returns)
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [current?.track?.id]);

  if (loading) {
    console.log("[MiniPlayer] Still loading...");
    return null;
  }

  if (!current?.track) {
    console.log("[MiniPlayer] No track data:", current);
    return null;
  }

  const { track, isPlaying } = current;
  const artistName = track.artists?.[0]?.name || "Unknown Artist";
  const imageUrl = track.album?.images?.[0]?.url;

  console.log("[MiniPlayer] Rendering with:", {
    trackName: track.name,
    artistName,
    imageUrl,
  });

  return (
    <a
      href={track.external_urls?.spotify || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-0 left-0 right-0 lg:left-20 bg-[#121212] border-t border-[#282828] hover:bg-[#1a1a1a] text-white px-3 sm:px-6 py-3 flex items-center gap-2 sm:gap-4 cursor-pointer transition-colors group z-[60]"
    >
      {/* Album Art - always visible */}
      <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded shadow-lg overflow-hidden bg-[#282828]">
        {imageUrl && !imageError && (
          <Image
            src={imageUrl}
            alt={track.name}
            fill
            sizes="(max-width: 640px) 48px, 56px"
            className={`object-cover ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onError={() => {
              console.log("[MiniPlayer] Image failed to load:", imageUrl);
              setImageError(true);
            }}
            onLoadingComplete={(img) => {
              const ok = img.naturalWidth > 0;
              setImageLoaded(ok);
            }}
            priority
          />
        )}

        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Music className="w-5 h-5 sm:w-6 sm:h-6 text-[#b3b3b3]" />
          </div>
        )}

        {isPlaying && imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-2 bg-[#00e461] animate-pulse" />
              <div
                className="w-0.5 h-3 bg-[#00e461] animate-pulse"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-0.5 h-2 bg-[#00e461] animate-pulse"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Track Info - responsive */}
      <div className="flex-1 min-w-0 hidden sm:block">
        <h3 className="font-medium text-sm text-white truncate">
          {track.name}
        </h3>
        <p className="text-xs text-[#b3b3b3] truncate">{artistName}</p>
      </div>

      {/* Mobile only - compact track info */}
      <div className="flex-1 min-w-0 sm:hidden">
        <h3 className="font-medium text-xs text-white truncate">
          {track.name}
        </h3>
      </div>

      {/* Status Badge - hide on mobile */}
      {isPlaying && (
        <div className="hidden sm:flex flex-shrink-0 items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-full">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-2 bg-[#00e461] animate-pulse" />
            <div
              className="w-0.5 h-3 bg-[#00e461] animate-pulse"
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className="w-0.5 h-2 bg-[#00e461] animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
          <span className="text-xs text-[#00e461] font-medium whitespace-nowrap">
            Playing
          </span>
        </div>
      )}

      {/* Playing indicator for mobile */}
      {isPlaying && (
        <div className="sm:hidden flex-shrink-0 flex gap-0.5">
          <div className="w-0.5 h-2 bg-[#00e461] animate-pulse" />
          <div
            className="w-0.5 h-3 bg-[#00e461] animate-pulse"
            style={{ animationDelay: "0.1s" }}
          />
          <div
            className="w-0.5 h-2 bg-[#00e461] animate-pulse"
            style={{ animationDelay: "0.2s" }}
          />
        </div>
      )}

      {/* Not playing icon - mobile only */}
      {!isPlaying && (
        <div className="sm:hidden flex-shrink-0">
          <Play className="w-4 h-4 text-[#b3b3b3]" />
        </div>
      )}
    </a>
  );
}
