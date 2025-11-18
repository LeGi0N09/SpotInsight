import { NextResponse } from "next/server";
import { spotifyFetch } from "../../lib/spotify";
import { db } from "../../../lib/db";

async function enrichPlays() {
  try {
    const plays = await db.plays.getRecent(100);
    const playsWithoutImages = plays.filter((p: any) => !p.album_image);
    
    if (playsWithoutImages.length === 0) {
      return NextResponse.json({ message: "All plays have images", updated: 0 });
    }

    const trackIds = [...new Set(playsWithoutImages.map((p: any) => p.track_id))].slice(0, 50);
    const res = await spotifyFetch(`/tracks?ids=${trackIds.join(',')}`);
    
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch from Spotify" }, { status: 500 });
    }

    const data = await res.json();
    const trackMap = new Map();
    
    data.tracks?.forEach((track: any) => {
      if (track?.album?.images?.[0]?.url) {
        trackMap.set(track.id, {
          album_image: track.album.images[0].url,
          duration_ms: track.duration_ms,
        });
      }
    });

    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
    
    let updated = 0;
    for (const play of playsWithoutImages) {
      const enrichment = trackMap.get(play.track_id);
      if (enrichment) {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/plays?id=eq.${play.id}`,
          {
            method: "PATCH",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(enrichment),
          }
        );
        if (res.ok) updated++;
      }
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST() {
  return enrichPlays();
}

export async function GET() {
  return enrichPlays();
}
