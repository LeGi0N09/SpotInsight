import { NextResponse } from "next/server";

export const revalidate = 300; // Cache for 5 minutes
export const dynamic = 'force-static';

let cachedData: any = null;
let cacheTime = 0;
const CACHE_DURATION = 60000; // 1 minute

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") || "alltime";
  
  // Return cached data if available and fresh
  if (cachedData && Date.now() - cacheTime < CACHE_DURATION) {
    return NextResponse.json(cachedData);
  }
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  try {
    // Fetch snapshot and stats in parallel
    const [snapshotRes, statsRes] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/snapshots?select=*&order=synced_at.desc&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      ),
      fetch(
        `${supabaseUrl}/rest/v1/rpc/get_play_stats`,
        {
          method: 'POST',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      ),
    ]);

    const [snapshots, statsData] = await Promise.all([
      snapshotRes.json(),
      statsRes.json()
    ]);
    
    const snapshot = snapshots[0];

    if (!snapshot) {
      return NextResponse.json({ error: "No data synced yet" }, { status: 404 });
    }

    const spotifyTracks = snapshot.top_tracks_long || [];
    const spotifyArtists = snapshot.top_artists_long || [];

    // Convert to lookup maps
    const trackPlayCounts: Record<string, number> = {};
    const trackTotalTime: Record<string, number> = {};
    const artistNameCounts: Record<string, number> = {};
    const artistNameTime: Record<string, number> = {};

    const trackNames: Record<string, string> = {};
    const trackArtists: Record<string, string> = {};
    const trackImages: Record<string, string> = {};

    if (statsData.trackStats) {
      for (const track of statsData.trackStats) {
        trackPlayCounts[track.track_id] = track.play_count;
        trackTotalTime[track.track_id] = track.total_time || 0;
        trackNames[track.track_id] = track.track_name;
        trackArtists[track.track_id] = track.artist_name;
        if (track.album_image) {
          trackImages[track.track_id] = track.album_image;
        }
      }
    }

    if (statsData.artistStats) {
      for (const artist of statsData.artistStats) {
        const artistName = artist.artist?.trim();
        if (artistName) {
          artistNameCounts[artistName] = artist.play_count;
          artistNameTime[artistName] = artist.total_time || 0;
        }
      }
    }

    // Sort tracks and artists by play count from database
    const topTracksByPlays = Object.entries(trackPlayCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);
    
    const topArtistsByPlays = Object.entries(artistNameCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);

    // Create metadata lookup
    type SpotifyTrack = { id: string; name?: string; artists?: Array<{name: string}>; album?: {images?: Array<{url: string}>}; duration_ms?: number; popularity?: number };
    type SpotifyArtist = { id: string; name: string; images?: Array<{url: string}>; genres?: string[]; followers?: {total: number}; popularity?: number };
    
    const trackMetadata = new Map(spotifyTracks.map((t: SpotifyTrack) => [t.id, t]));
    const artistMetadata = new Map(spotifyArtists.map((a: SpotifyArtist) => [a.name, a]));

    // Format tracks with metadata
    const formattedTracks = topTracksByPlays.map(([trackId, playCount], i) => {
      const meta = trackMetadata.get(trackId) as SpotifyTrack | undefined;
      return {
        id: trackId,
        name: meta?.name || trackNames[trackId] || 'Unknown Track',
        artist: meta?.artists?.map((a: {name: string}) => a.name).join(", ") || trackArtists[trackId] || 'Unknown Artist',
        image: meta?.album?.images?.[0]?.url || trackImages[trackId],
        rank: i + 1,
        playCount,
        totalTimeMs: trackTotalTime[trackId] || 0,
        duration: meta?.duration_ms,
        popularity: meta?.popularity || 0,
      };
    });

    // Get artist cache from database
    const artistCacheRes = await fetch(
      `${supabaseUrl}/rest/v1/artist_cache?select=*`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const artistCache = await artistCacheRes.json();
    const artistCacheMap = new Map(artistCache.map((a: any) => [a.name.toLowerCase(), a]));

    // Format artists with metadata from cache or snapshot
   const formattedArtists = topArtistsByPlays.map(([artistName, playCount], i) => {
  const meta = artistMetadata.get(artistName) as SpotifyArtist | undefined;

  return {
    id: meta?.id || artistName,
    name: artistName,
    image: meta?.images?.[0]?.url,
    genres: meta?.genres || [],
    rank: i + 1,
    playCount,
    totalTimeMs: artistNameTime[artistName] || 0,
    followers: meta?.followers?.total,
    popularity: meta?.popularity,
  };
});


    // Extract genres from top artists
    const genreCounts: Record<string, number> = {};
    for (const artist of formattedArtists) {
      for (const genre of artist.genres || []) {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      }
    }

    const topGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count }));

    // Calculate total plays from aggregated data (faster than separate count query)
    const totalPlays = Object.values(trackPlayCounts).reduce((sum, count) => sum + count, 0);
    const hasImportedData = totalPlays > 100;

    const result = {
      filter,
      totalPlays,
      hasImportedData,
      topTracks: formattedTracks,
      topArtists: formattedArtists,
      topGenres,
      lastSynced: snapshot.synced_at,
    };
    
    // Cache the result
    cachedData = result;
    cacheTime = Date.now();

    return NextResponse.json(result);
  } catch (error) {
    console.error('[stats] Error:', error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
