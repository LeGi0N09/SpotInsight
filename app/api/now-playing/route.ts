import { spotifyFetch } from "../../lib/spotify";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Try currently playing first
    const currentRes = await spotifyFetch("/me/player/currently-playing");
    
    if (currentRes.ok && currentRes.status === 200) {
      const data = await currentRes.json();
      
      if (data.is_playing && data.item) {
        // Check if track is liked
        let isLiked = false;
        try {
          const likedRes = await spotifyFetch(`/me/tracks/contains?ids=${data.item.id}`);
          if (likedRes.ok) {
            const likedData = await likedRes.json();
            isLiked = likedData[0] || false;
          }
        } catch {}
        
        return NextResponse.json({
          isPlaying: true,
          track: {
            id: data.item.id,
            name: data.item.name,
            artist: data.item.artists?.map((a: any) => a.name).join(", "),
            album: data.item.album?.name,
            image: data.item.album?.images?.[0]?.url,
            duration: data.item.duration_ms,
            progress: data.progress_ms,
            playedAt: new Date().toISOString(),
            isLiked,
          },
        });
      }
    }

    // Fallback to recently played
    const recentRes = await spotifyFetch("/me/player/recently-played?limit=1");
    
    if (!recentRes.ok) {
      return NextResponse.json({ isPlaying: false });
    }

    const recentData = await recentRes.json();
    const lastTrack = recentData.items?.[0];
    
    if (!lastTrack) {
      return NextResponse.json({ isPlaying: false });
    }

    return NextResponse.json({
      isPlaying: false,
      track: {
        id: lastTrack.track.id,
        name: lastTrack.track.name,
        artist: lastTrack.track.artists?.map((a: any) => a.name).join(", "),
        album: lastTrack.track.album?.name,
        image: lastTrack.track.album?.images?.[0]?.url,
        duration: lastTrack.track.duration_ms,
        progress: 0,
        playedAt: lastTrack.played_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ isPlaying: false, error: String(error) });
  }
}

export async function POST(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    
    await fetch(`${supabaseUrl}/rest/v1/plays`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates",
      },
      body: JSON.stringify({
        track_id: body.track.id,
        track_name: body.track.name,
        artist_name: body.track.artist,
        played_at: body.track.playedAt || new Date().toISOString(),
        ms_played: body.track.duration,
        source: 'widget',
        raw_json: body,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
