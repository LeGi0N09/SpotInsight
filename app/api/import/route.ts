import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const data = await req.json();
    
    // Expecting array of streaming history entries
    const plays = data.map((entry: any) => ({
      track_id: entry.spotify_track_uri?.split(':')[2] || `unknown_${Date.now()}`,
      played_at: entry.ts || entry.endTime,
      raw_json: {
        track: {
          id: entry.spotify_track_uri?.split(':')[2],
          name: entry.master_metadata_track_name || entry.trackName,
          artists: [{
            name: entry.master_metadata_album_artist_name || entry.artistName
          }],
          album: {
            name: entry.master_metadata_album_album_name
          }
        },
        ms_played: entry.ms_played || entry.msPlayed
      }
    }));

    // Insert into Supabase
    const res = await fetch(`${supabaseUrl}/rest/v1/plays`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates",
      },
      body: JSON.stringify(plays),
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      imported: plays.length 
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
