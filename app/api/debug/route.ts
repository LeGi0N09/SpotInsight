import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  try {
    // Check plays table
    const playsRes = await fetch(`${supabaseUrl}/rest/v1/plays?select=*&limit=5`, { headers });
    const plays = await playsRes.json();

    // Count total plays
    const countRes = await fetch(`${supabaseUrl}/rest/v1/plays?select=count`, { headers });
    const countData = await countRes.json();

    // Check snapshots table
    const snapshotsRes = await fetch(`${supabaseUrl}/rest/v1/snapshots?select=*&order=synced_at.desc&limit=1`, { headers });
    const snapshots = await snapshotsRes.json();

    // Sample track from snapshot
    const snapshot = snapshots[0];
    const sampleTrack = snapshot?.top_tracks_long?.[0];

    return NextResponse.json({
      plays_table: {
        total_count: countData[0]?.count || 0,
        sample_records: plays,
        has_track_id: plays[0]?.track_id ? "✅" : "❌",
        has_artist_name: plays[0]?.artist_name ? "✅" : "❌",
        has_ms_played: plays[0]?.ms_played ? "✅" : "❌",
      },
      snapshots_table: {
        total_snapshots: snapshots.length,
        last_sync: snapshot?.synced_at,
        tracks_in_snapshot: snapshot?.top_tracks_long?.length || 0,
        sample_track: sampleTrack ? {
          id: sampleTrack.id,
          name: sampleTrack.name,
          artist: sampleTrack.artists?.[0]?.name,
        } : null,
      },
      diagnosis: {
        issue: countData[0]?.count < 100 ? "Only sync data (50 plays), no imported history" : "Has imported data",
        solution: countData[0]?.count < 100 ? "Import streaming history via /import page" : "Data looks good",
      }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
