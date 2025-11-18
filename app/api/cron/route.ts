import { NextResponse } from "next/server";
import { spotifyFetch } from "../../lib/spotify";

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  try {
    // Get recent plays
    const recentRes = await spotifyFetch("/me/player/recently-played?limit=10");
    let recentCount = 0;
    
    if (recentRes.ok) {
      const recent = await recentRes.json();
      
      if (recent.items) {
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
              source: 'auto-sync',
              raw_json: item,
            }))
          ),
        });
        recentCount = recent.items.length;
      }
    }

    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      recentPlays: recentCount,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
