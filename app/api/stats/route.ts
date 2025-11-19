import { NextResponse } from "next/server";

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") || "alltime";
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  try {
    // Get latest snapshot
    const snapshotRes = await fetch(
      `${supabaseUrl}/rest/v1/snapshots?select=*&order=synced_at.desc&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const snapshots = await snapshotRes.json();
    const snapshot = snapshots[0];

    if (!snapshot) {
      return NextResponse.json({ error: "No data synced yet" }, { status: 404 });
    }

    // Get Spotify metadata for enrichment
    const spotifyTracks = snapshot.top_tracks_long || [];
    const spotifyArtists = snapshot.top_artists_long || [];

    // Get total play count
    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/plays?select=count`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: 'count=exact',
        },
      }
    );
    const countData = await countRes.json();
    const totalPlays = countData?.[0]?.count || 0;

    // Get aggregated stats from Supabase RPC function (100x faster)
    const statsRes = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_play_stats`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const statsData = await statsRes.json();

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

    // Fetch missing artist metadata from Spotify
    const artistsNeedingMetadata = topArtistsByPlays
      .filter(([artistName]) => !artistMetadata.has(artistName))
      .slice(0, 10)
      .map(([artistName]) => artistName);

    if (artistsNeedingMetadata.length > 0) {
      const { spotifyFetch } = await import('../../lib/spotify');
      for (const artistName of artistsNeedingMetadata) {
        try {
          const searchRes = await spotifyFetch(`/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`);
          if (searchRes.ok) {
            const data = await searchRes.json();
            const artist = data.artists?.items?.[0];
            if (artist) {
              artistMetadata.set(artistName, {
                id: artist.id,
                name: artist.name,
                images: artist.images,
                genres: artist.genres,
                followers: artist.followers,
                popularity: artist.popularity,
              });
            }
          }
        } catch {
          console.error(`[stats] Failed to fetch artist: ${artistName}`);
        }
      }
    }

    // Format artists with metadata
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

    const hasImportedData = totalPlays > 100;

    return NextResponse.json({
      filter,
      totalPlays,
      hasImportedData,
      topTracks: formattedTracks,
      topArtists: formattedArtists,
      topGenres,
      lastSynced: snapshot.synced_at,
    });
  } catch (error) {
    console.error('[stats] Error:', error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
