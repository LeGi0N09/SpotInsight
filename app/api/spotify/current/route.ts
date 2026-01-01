import { spotifyFetch } from "../../../lib/spotify";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Try to get currently playing track
    const currentRes = await spotifyFetch("/me/player/currently-playing");

    const hasBody = currentRes.headers.get("content-length") !== "0";
    const contentType = currentRes.headers.get("content-type") || "";

    if (currentRes.ok && currentRes.status !== 204 && hasBody) {
      try {
        const currentData = contentType.includes("application/json")
          ? await currentRes.json()
          : null;

        if (currentData?.item) {
          return NextResponse.json({
            track: currentData.item,
            isPlaying: currentData.is_playing,
            source: "current",
          });
        }
      } catch (parseError) {
        console.warn(
          "[current] Failed to parse current track JSON:",
          parseError
        );
      }
    }

    // Fallback to recently played if nothing is currently playing
    const recentRes = await spotifyFetch("/me/player/recently-played?limit=1");

    if (recentRes.ok) {
      const recentData = await recentRes.json();
      const lastTrack = recentData?.items?.[0];

      if (lastTrack) {
        return NextResponse.json({
          track: lastTrack.track,
          isPlaying: false,
          source: "recent",
          playedAt: lastTrack.played_at,
        });
      }
    }

    return NextResponse.json(
      { track: null, isPlaying: false, error: "No track data" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { track: null, error: String(error) },
      { status: 200 }
    );
  }
}
