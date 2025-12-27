import { spotifyFetch } from "../../lib/spotify";
import { NextResponse } from "next/server";

async function safeFetch(path: string) {
  try {
    const res = await spotifyFetch(path);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch (e) {
    console.error(`[sync] Failed to fetch ${path}:`, e);
    return null;
  }
}

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const userId = process.env.SYNC_USER_ID || "default_user";

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const startTime = Date.now();

  try {
    console.log("[sync] Starting sync...");

    // Fetch Spotify data in parallel
    const [recent, artistsLong, tracksLong] = await Promise.all([
      safeFetch("/me/player/recently-played?limit=50"),
      safeFetch("/me/top/artists?limit=50&time_range=long_term"),
      safeFetch("/me/top/tracks?limit=50&time_range=long_term"),
    ]);

    if (!recent || !recent.items || recent.items.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No recently played tracks",
        duration_ms: Date.now() - startTime,
      });
    }

    const timestamp = new Date().toISOString();

    // Save snapshot (metadata cache)
    await fetch(`${supabaseUrl}/rest/v1/snapshots`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        synced_at: timestamp,
        top_artists_long: artistsLong?.items || [],
        top_tracks_long: tracksLong?.items || [],
      }),
    }).catch((e) => console.error("[sync] Snapshot save failed:", e));

    // Save plays - filter out duplicates first
    const plays = recent.items.map((item: any) => ({
      user_id: userId,
      track_id: item.track.id,
      track_name: item.track.name,
      artist_name: item.track.artists?.[0]?.name,
      album_image: item.track.album?.images?.[0]?.url,
      played_at: item.played_at,
      ms_played: item.track.duration_ms,
    }));

    // Get existing plays to avoid duplicates
    const existingRes = await fetch(
      `${supabaseUrl}/rest/v1/plays?select=played_at,track_id,user_id&order=played_at.desc&limit=2000`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const existing = existingRes.ok ? await existingRes.json() : [];
    const existingKey = new Set(
      existing.map((p: any) => `${p.user_id}|${p.track_id}|${p.played_at}`)
    );

    // Filter to only new plays
    const newPlays = plays.filter(
      (p: any) => !existingKey.has(`${p.user_id}|${p.track_id}|${p.played_at}`)
    );

    let playRes: Response;
    let playsSaved = 0;

    if (newPlays.length > 0) {
      playRes = await fetch(
        `${supabaseUrl}/rest/v1/plays?on_conflict=user_id,track_id,played_at`,
        {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation,resolution=ignore-duplicates",
          },
          body: JSON.stringify(newPlays),
        }
      );
      // Count actual inserted rows; if parsing fails, fall back to attempted count
      try {
        const inserted = await playRes.json();
        playsSaved = Array.isArray(inserted)
          ? inserted.length
          : newPlays.length;
      } catch {
        playsSaved = newPlays.length;
      }
    } else {
      // No new plays, but still success
      playRes = new Response(JSON.stringify({ success: true }), {
        status: 200,
      });
      playsSaved = 0;
    }

    const duration_ms = Date.now() - startTime;

    // Log this sync
    await fetch(`${supabaseUrl}/rest/v1/cron_logs`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        job_name: "sync",
        status: playRes.ok ? "success" : "failed",
        plays_saved: playsSaved,
        duration_ms,
        executed_at: timestamp,
        error_message: !playRes.ok ? await playRes.text() : null,
      }),
    }).catch(() => null);

    return NextResponse.json({
      success: playRes.ok,
      plays_saved: playsSaved,
      new_plays: playsSaved,
      total_plays_processed: plays.length,
      duration_ms,
      synced_at: timestamp,
    });
  } catch (error) {
    const duration_ms = Date.now() - startTime;
    const errorMsg = String(error);

    // Log failure
    await fetch(`${supabaseUrl}/rest/v1/cron_logs`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        job_name: "sync",
        status: "failed",
        duration_ms,
        executed_at: new Date().toISOString(),
        error_message: errorMsg,
      }),
    }).catch(() => null);

    console.error("[sync] Error:", error);
    return NextResponse.json({ error: errorMsg, duration_ms }, { status: 500 });
  }
}
