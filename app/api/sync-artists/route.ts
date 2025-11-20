import { NextResponse } from "next/server";
import { spotifyFetch } from "../../lib/spotify";

export async function GET() {
  return syncArtists();
}

export async function POST() {
  return syncArtists();
}

async function syncArtists() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  try {
    // Get snapshot with Spotify artist data
    const snapshotRes = await fetch(
      `${supabaseUrl}/rest/v1/snapshots?select=top_artists_long&order=synced_at.desc&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    
    const snapshots = await snapshotRes.json();
    const spotifyArtists = snapshots[0]?.top_artists_long || [];
    
    // Get database artist names
    const statsRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_play_stats`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    const statsData = await statsRes.json();
    const artistNames = statsData.artistStats?.map((a: any) => a.artist) || [];

    let synced = 0;
    let fromSnapshot = 0;
    let searched = 0;
    
    // First, cache all Spotify artists from snapshot
    const snapshotArtistNames = new Set(spotifyArtists.map((a: any) => a.name.toLowerCase()));
    
    for (const artist of spotifyArtists) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/artist_cache?id=eq.${artist.id}`, {
          method: 'DELETE',
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        });
        
        const insertRes = await fetch(`${supabaseUrl}/rest/v1/artist_cache`, {
          method: 'POST',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: artist.id,
            name: artist.name,
            image_url: artist.images?.[0]?.url || null,
            genres: artist.genres || [],
            followers: artist.followers?.total || 0,
            popularity: artist.popularity || 0,
            last_synced: new Date().toISOString(),
          }),
        });
        
        if (insertRes.ok) {
          synced++;
          fromSnapshot++;
        }
      } catch (err) {
        console.error(`Failed to cache artist ${artist.name}:`, err);
      }
    }
    
    // Search for remaining artists not in snapshot
    for (const artistName of artistNames) {
      if (snapshotArtistNames.has(artistName.toLowerCase())) continue;
      
      try {
        const searchRes = await spotifyFetch(`/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`);
        if (!searchRes.ok) continue;
        
        const searchData = await searchRes.json();
        const artist = searchData.artists?.items?.[0];
        
        if (artist) {
          await fetch(`${supabaseUrl}/rest/v1/artist_cache?name=eq.${encodeURIComponent(artistName)}`, {
            method: 'DELETE',
            headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          });
          
          const insertRes = await fetch(`${supabaseUrl}/rest/v1/artist_cache`, {
            method: 'POST',
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: artist.id,
              name: artistName,
              image_url: artist.images?.[0]?.url || null,
              genres: artist.genres || [],
              followers: artist.followers?.total || 0,
              popularity: artist.popularity || 0,
              last_synced: new Date().toISOString(),
            }),
          });
          
          if (insertRes.ok) {
            synced++;
            searched++;
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`Failed to search artist ${artistName}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      synced, 
      fromSnapshot,
      searched,
      totalArtists: artistNames.length
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
