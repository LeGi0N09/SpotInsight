import { spotifyFetch } from "../../../lib/spotify";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await spotifyFetch("/me/player/recently-played?limit=50");
    if (!res.ok) {
      return NextResponse.json({ data: { items: [] } }, { status: res.status });
    }
    const data = await res.json();

    // Save to Supabase if configured
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseKey && data.items) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/plays`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=ignore-duplicates",
          },
          body: JSON.stringify(
            data.items.map((item: any) => ({
              track_id: item.track.id,
              played_at: item.played_at,
              raw_json: item,
            }))
          ),
        });
      } catch (e) {
        console.error('[recently-played] DB error:', e);
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ data: { items: [] } }, { status: 401 });
  }
}
