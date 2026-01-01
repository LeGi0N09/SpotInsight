import { spotifyFetch } from "../../../lib/spotify";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  "Content-Type": "application/json",
};

export async function POST() {
  try {
    // Fetch all plays from database
    const playsRes = await fetch(`${supabaseUrl}/rest/v1/plays?select=*`, {
      headers,
    });

    if (!playsRes.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch plays" },
        { status: 500 }
      );
    }

    const plays = await playsRes.json();
    let updated = 0;
    const updates: Record<string, string | number>[] = [];

    // Process plays in batches
    for (const play of plays) {
      // Skip if already has image and duration
      if (play.image_url && play.duration_ms) {
        continue;
      }

      try {
        // Fetch track details from Spotify
        const trackRes = await spotifyFetch(`/tracks/${play.track_id}`);
        if (!trackRes.ok) {
          console.warn(
            `[migrate-plays] Failed to fetch track ${play.track_id}`
          );
          continue;
        }

        const track = await trackRes.json();

        const updateData: Record<string, string | number> = {
          id: play.id,
        };

        // Add image if missing
        if (!play.image_url && track.album?.images?.[0]?.url) {
          updateData.image_url = track.album.images[0].url;
        }

        // Add duration if missing
        if (!play.duration_ms && track.duration_ms) {
          updateData.duration_ms = track.duration_ms;
        }

        if (Object.keys(updateData).length > 1) {
          updates.push(updateData);
        }
      } catch (e) {
        // Skip tracks that fail to fetch
      }

      // Rate limiting - small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Update in Supabase
    if (updates.length > 0) {
      const updateRes = await fetch(`${supabaseUrl}/rest/v1/plays`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify(updates),
      });

      if (!updateRes.ok) {
        const error = await updateRes.text();
        return NextResponse.json(
          { success: false, error: "Failed to update plays", details: error },
          { status: 500 }
        );
      }

      updated = updates.length;
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete. Updated ${updated} plays.`,
      total: plays.length,
      updated,
    });
  } catch (error) {
    console.error("[migrate-plays] Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
