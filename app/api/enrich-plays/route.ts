import { NextResponse } from "next/server";
import { spotifyFetch } from "../../lib/spotify";

interface PlayTrackRow {
  track_id: string;
}

export const revalidate = 0;

/** ───────────────────────────────────────────────
 *  MAIN FUNCTION
 *  Fetch missing track images → enrich Supabase plays
 *  ───────────────────────────────────────────────
 */
async function enrichPlays() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

    /** ───────────────────────────────
     *   1) FETCH ALL TRACKS WITHOUT IMAGES
     * ─────────────────────────────── */
    const allPlays: PlayTrackRow[] = [];
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

      const chunk: PlayTrackRow[] = await res.json();

      if (!Array.isArray(chunk) || chunk.length === 0) break;

      allPlays.push(...chunk);

      if (chunk.length < fetchLimit) break;
      offset += fetchLimit;
    }

    const uniqueTrackIds = [
      ...new Set(allPlays.map((p) => p.track_id).filter(Boolean)),
    ];

    if (uniqueTrackIds.length === 0) {
      return NextResponse.json({
        message: "All plays already have images",
        updated: 0,
      });
    }

    /** ───────────────────────────────
     *   2) PROCESS BATCHES OF 50 (Spotify API limit)
     * ─────────────────────────────── */
    let totalUpdated = 0;
    let failed = 0;

    for (let i = 0; i < uniqueTrackIds.length; i += 50) {
      const batch = uniqueTrackIds.slice(i, i + 50);

      try {
        const spotifyRes = await spotifyFetch(
          `/tracks?ids=${batch.join(",")}`
        );

        if (!spotifyRes.ok) {
          console.error(`[enrich-plays] Spotify batch failed at index ${i}`);
          failed += batch.length;
          continue;
        }

        const data = await spotifyRes.json();

        for (const track of data.tracks || []) {
          if (!track?.album?.images?.[0]?.url) continue;

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

            if (updateRes.ok) {
              totalUpdated++;
            } else {
              failed++;
            }
          } catch {
            console.error(`[enrich-plays] Failed updating track: ${track.id}`);
            failed++;
          }
        }
      } catch (err) {
        console.error(`[enrich-plays] Batch error at ${i}:`, err);
        failed += batch.length;
      }
    }

    /** ───────────────────────────────
     *   3) RETURN FINAL RESULTS
     * ─────────────────────────────── */
    return NextResponse.json({
      success: true,
      processed: uniqueTrackIds.length,
      updated: totalUpdated,
      failed,
    });
  } catch (error) {
    console.error("[enrich-plays] Unexpected error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

/** ───────────────────────────────────────────────
 *   EXPORT API HANDLERS
 * ─────────────────────────────────────────────── */
export async function POST() {
  return enrichPlays();
}

export async function GET() {
  return enrichPlays();
}
