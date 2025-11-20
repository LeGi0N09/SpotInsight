import { NextResponse } from "next/server";
import { spotifyFetch } from "../../lib/spotify";
import { db } from "../../../lib/db";

async function enrichPlays() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

    // Get distinct track IDs without images in chunks
    let allPlays: Array<{track_id: string}> = [];
    let offset = 0;
    const fetchLimit = 1000;
    
    while (true) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/plays?select=track_id&album_image=is.null&limit=${fetchLimit}&offset=${offset}`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      const chunk = await res.json();
      if (!Array.isArray(chunk) || chunk.length === 0) break;
      allPlays = allPlays.concat(chunk);
      if (chunk.length < fetchLimit) break;
      offset += fetchLimit;
    }
    
    const uniqueTrackIds = [...new Set(allPlays.map((p) => p.track_id).filter(Boolean))];
    
    if (uniqueTrackIds.length === 0) {
      return NextResponse.json({ message: "All plays have images", updated: 0 });
    }

    // Process in batches of 50 (Spotify API limit)
    let totalUpdated = 0;
    let failed = 0;
    
    for (let i = 0; i < uniqueTrackIds.length; i += 50) {
      const batch = uniqueTrackIds.slice(i, i + 50);
      
      try {
        const spotifyRes = await spotifyFetch(`/tracks?ids=${batch.join(',')}`);
        
        if (!spotifyRes.ok) {
          console.error(`[enrich-plays] Spotify API error for batch ${i}`);
          failed += batch.length;
          continue;
        }

        const data = await spotifyRes.json();
        
        for (const track of data.tracks || []) {
          if (track?.album?.images?.[0]?.url) {
            try {
              const updateRes = await fetch(
                `${supabaseUrl}/rest/v1/plays?track_id=eq.${track.id}`,
                {
                  method: "PATCH",
                  headers: {
                    apikey: supabaseKey,
                    Authorization: `Bearer ${supabaseKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    album_image: track.album.images[0].url,
                    duration_ms: track.duration_ms,
                  }),
                }
              );
              if (updateRes.ok) totalUpdated++;
            } catch (e) {
              console.error(`[enrich-plays] Failed to update track ${track.id}`);
              failed++;
            }
          }
        }
      } catch (e) {
        console.error(`[enrich-plays] Error processing batch ${i}:`, e);
        failed += batch.length;
      }
    }

    return NextResponse.json({ success: true, updated: totalUpdated, processed: uniqueTrackIds.length, failed });
  } catch (error) {
    console.error('[enrich-plays] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST() {
  return enrichPlays();
}

export async function GET() {
  return enrichPlays();
}
