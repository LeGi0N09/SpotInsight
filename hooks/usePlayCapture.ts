import { useEffect, useRef } from "react";

interface CaptureResponse {
  success: boolean;
  message: string;
  track?: {
    id: string;
    name: string;
    artist: string;
  };
}

/**
 * Hook to automatically capture currently playing tracks
 * Polls the capture-play endpoint every 10 seconds while the page is active
 */
export function usePlayCapture() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCaptureRef = useRef<string | null>(null);

  useEffect(() => {
    console.log("[usePlayCapture] Hook initialized");

    const capturePlay = async () => {
      try {
        console.log("[usePlayCapture] Checking for track to capture...");
        const res = await fetch("/api/spotify/capture-play", {
          cache: "no-store",
        });

        console.log("[usePlayCapture] Response status:", res.status);
        const data: CaptureResponse = await res.json();
        console.log("[usePlayCapture] Response data:", data);

        if (data.success && data.track) {
          lastCaptureRef.current = data.track.id;
          console.log("✓ Captured:", data.track.name, "by", data.track.artist);
        } else {
          console.log("[usePlayCapture] Not captured:", data.message);
        }
      } catch (error) {
        console.error("[usePlayCapture] Failed to capture play:", error);
      }
    };

    // Initial capture
    capturePlay();

    // Set up polling interval (every 10 seconds)
    intervalRef.current = setInterval(capturePlay, 10000);
    console.log("[usePlayCapture] Polling started (every 10 seconds)");

    // Cleanup
    return () => {
      if (intervalRef.current) {
        console.log("[usePlayCapture] Cleaning up...");
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
