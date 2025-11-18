import { spotifyFetch } from "../../lib/spotify";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const currentRes = await spotifyFetch("/me/player/currently-playing");
    
    let currentData = null;
    if (currentRes.status === 200) {
      currentData = await currentRes.json();
    }

    const recentRes = await spotifyFetch("/me/player/recently-played?limit=1");
    let recentData = null;
    if (recentRes.ok) {
      recentData = await recentRes.json();
    }

    return NextResponse.json({
      currentlyPlaying: {
        status: currentRes.status,
        data: currentData,
      },
      recentlyPlayed: {
        status: recentRes.status,
        data: recentData,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
