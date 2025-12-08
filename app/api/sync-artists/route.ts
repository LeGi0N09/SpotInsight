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
    console.log('🔄 Starting artist sync...');
    
    // Get existing cache first
    const existingCacheRes = await fetch(`${supabaseUrl}/rest/v1/artist_cache?select=name`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    const existingCache = await existingCacheRes.json();
    const cachedNames = new Set(existingCache.map((c: any) => c.name.toLowerCase()));
    console.log(`💾 Already cached: ${cachedNames.size} artists`);
    
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
    console.log(`📊 Found ${spotifyArtists.length} artists in snapshot`);
    
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
    // Sort by play count (descending) - most played artists first
    const sortedArtists = (statsData.artistStats || []).sort((a: any, b: any) => b.play_count - a.play_count);
    const artistNames = sortedArtists.map((a: any) => a.artist);
    console.log(`🎵 Found ${artistNames.length} unique artists (sorted by play count)`);

    let synced = 0;
    let fromSnapshot = 0;
    let searched = 0;
    let skipped = 0;
    let updated = 0;
    
    // Get stale cache entries (older than 7 days)
    const staleRes = await fetch(
      `${supabaseUrl}/rest/v1/artist_cache?select=name&last_synced=lt.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    const staleCache = await staleRes.json();
    const staleNames = new Set(staleCache.map((c: any) => c.name.toLowerCase()));
    console.log(`⏰ ${staleNames.size} artists need refresh (>7 days old)`);
    
    // First, cache all Spotify artists from snapshot
    const snapshotArtistNames = new Set(spotifyArtists.map((a: any) => a.name.toLowerCase()));
    console.log('\n💾 Syncing snapshot artists...');
    
    for (const artist of spotifyArtists) {
      const isStale = staleNames.has(artist.name.toLowerCase());
      const isCached = cachedNames.has(artist.name.toLowerCase());
      
      if (isCached && !isStale) {
        skipped++;
        continue;
      }
      
      try {
        if (isCached) {
          await fetch(`${supabaseUrl}/rest/v1/artist_cache?name=eq.${encodeURIComponent(artist.name)}`, {
            method: 'DELETE',
            headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          });
        }
        
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
          if (isStale) {
            updated++;
            console.log(`  🔄 ${artist.name} - ${artist.followers?.total || 0} followers (updated)`);
          } else {
            synced++;
            fromSnapshot++;
            console.log(`  ✓ ${artist.name} - ${artist.followers?.total || 0} followers`);
          }
        }
      } catch (err) {
        console.error(`  ✗ Failed to cache ${artist.name}:`, err);
      }
    }
    
    // Search for remaining artists not in snapshot (already sorted by play count)
    const missingArtists = artistNames.filter((name: string) => {
      const key = name.toLowerCase();
      return !snapshotArtistNames.has(key) && (!cachedNames.has(key) || staleNames.has(key));
    });
    console.log(`\n🔍 Searching for ${missingArtists.length} missing/stale artists (top artists first)...`);
    
    for (const artistName of missingArtists) {
      try {
        const searchRes = await spotifyFetch(`/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`);
        if (!searchRes.ok) continue;
        
        const searchData = await searchRes.json();
        const artist = searchData.artists?.items?.[0];
        
        if (artist) {
          const isStale = staleNames.has(artistName.toLowerCase());
          
          if (cachedNames.has(artistName.toLowerCase())) {
            await fetch(`${supabaseUrl}/rest/v1/artist_cache?name=eq.${encodeURIComponent(artistName)}`, {
              method: 'DELETE',
              headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
            });
          }
          
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
            if (isStale) {
              updated++;
              console.log(`  🔄 ${artistName} - ${artist.followers?.total || 0} followers (updated)`);
            } else {
              synced++;
              searched++;
              console.log(`  ✓ ${artistName} - ${artist.followers?.total || 0} followers`);
            }
          }
        } else {
          console.log(`  ⚠ ${artistName} - not found on Spotify`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`  ✗ Failed to search ${artistName}:`, err);
      }
    }

    console.log(`\n✅ Sync complete: ${synced} new (${fromSnapshot} snapshot, ${searched} searched), ${updated} updated, ${skipped} skipped\n`);
    
    return NextResponse.json({ 
      success: true, 
      synced, 
      updated,
      fromSnapshot,
      searched,
      skipped,
      totalArtists: artistNames.length
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
