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

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    console.log('[sync] Starting sync...');

    const profile = await safeFetch("/me");
    const artistsShort = await safeFetch("/me/top/artists?limit=50&time_range=short_term");
    const artistsMedium = await safeFetch("/me/top/artists?limit=50&time_range=medium_term");
    const artistsLong = await safeFetch("/me/top/artists?limit=50&time_range=long_term");
    const tracksShort = await safeFetch("/me/top/tracks?limit=50&time_range=short_term");
    const tracksMedium = await safeFetch("/me/top/tracks?limit=50&time_range=medium_term");
    const tracksLong = await safeFetch("/me/top/tracks?limit=50&time_range=long_term");
    const recent = await safeFetch("/me/player/recently-played?limit=50");
    const genres = await safeFetch("/recommendations/available-genre-seeds");

    const timestamp = new Date().toISOString();

    // Save snapshot
    const saveRes = await fetch(`${supabaseUrl}/rest/v1/snapshots`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        synced_at: timestamp,
        profile: profile || {},
        top_artists_short: artistsShort?.items || [],
        top_artists_medium: artistsMedium?.items || [],
        top_artists_long: artistsLong?.items || [],
        top_tracks_short: tracksShort?.items || [],
        top_tracks_medium: tracksMedium?.items || [],
        top_tracks_long: tracksLong?.items || [],
        recently_played: recent?.items || [],
        available_genres: genres?.genres || [],
      }),
    });

    if (!saveRes.ok) {
      console.error('[sync] Failed to save snapshot:', await saveRes.text());
    }

    // Save recent plays with enhanced data
    if (recent?.items) {
      await fetch(`${supabaseUrl}/rest/v1/plays`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates",
        },
        body: JSON.stringify(
          recent.items.map((item: any) => ({
            track_id: item.track.id,
            track_name: item.track.name,
            artist_name: item.track.artists?.[0]?.name,
            played_at: item.played_at,
            ms_played: item.track.duration_ms,
            source: 'sync',
            raw_json: item,
          }))
        ),
      });
    }

    // Refresh materialized views for fast stats
    try {
      await fetch(`${supabaseUrl}/rest/v1/rpc/refresh_stats_views`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
    } catch (e) {
      console.log('[sync] Materialized views refresh skipped (may not exist yet)');
    }

    return NextResponse.json({ 
      success: true, 
      synced_at: timestamp,
      counts: {
        profile: profile?.display_name || 'N/A',
        artists_short: artistsShort?.items?.length || 0,
        artists_medium: artistsMedium?.items?.length || 0,
        artists_long: artistsLong?.items?.length || 0,
        tracks_short: tracksShort?.items?.length || 0,
        tracks_medium: tracksMedium?.items?.length || 0,
        tracks_long: tracksLong?.items?.length || 0,
        recent_plays: recent?.items?.length || 0,
        genres: genres?.genres?.length || 0,
      }
    });
  } catch (error) {
    console.error('[sync] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
