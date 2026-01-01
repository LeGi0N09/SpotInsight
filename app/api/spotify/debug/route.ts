import { spotifyFetch } from "../../../lib/spotify";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check currently playing
    const currentRes = await spotifyFetch("/me/player/currently-playing");
    const currentData = currentRes.ok ? await currentRes.json() : null;

    // Check user info
    const meRes = await spotifyFetch("/me");
    const meData = meRes.ok ? await meRes.json() : null;

    return NextResponse.json({
      spotify: {
        user: meData?.display_name || "Unknown",
        currentlyPlaying: {
          isPlaying: currentData?.is_playing,
          trackName: currentData?.item?.name,
          artist: currentData?.item?.artists?.[0]?.name,
          trackId: currentData?.item?.id,
        },
      },
      supabase: {
        url: process.env.SUPABASE_URL ? "✓ Set" : "✗ Missing",
        key: process.env.SUPABASE_SERVICE_KEY ? "✓ Set" : "✗ Missing",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
