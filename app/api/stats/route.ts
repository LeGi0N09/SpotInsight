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

    // Select data based on filter
    let topTracks = [];
    let topArtists = [];

    if (filter === "alltime") {
      topTracks = snapshot.top_tracks_long || [];
      topArtists = snapshot.top_artists_long || [];
    } else if (filter === "year") {
      topTracks = snapshot.top_tracks_medium || [];
      topArtists = snapshot.top_artists_medium || [];
    } else if (filter === "month") {
      topTracks = snapshot.top_tracks_short || [];
      topArtists = snapshot.top_artists_short || [];
    }

    // Get play counts from plays table
    const playsRes = await fetch(
      `${supabaseUrl}/rest/v1/plays?select=track_id,artist_name,ms_played`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const plays = await playsRes.json();

    // Count plays by ID and artist name
    const trackPlayCounts: Record<string, number> = {};
    const trackTotalTime: Record<string, number> = {};
    const artistNameCounts: Record<string, number> = {};
    const artistNameTime: Record<string, number> = {};

    for (const play of plays) {
      const duration = play.ms_played || 180000;
      
      if (play.track_id) {
        trackPlayCounts[play.track_id] = (trackPlayCounts[play.track_id] || 0) + 1;
        trackTotalTime[play.track_id] = (trackTotalTime[play.track_id] || 0) + duration;
      }
      
      if (play.artist_name) {
        const artistKey = play.artist_name.toLowerCase().trim();
        artistNameCounts[artistKey] = (artistNameCounts[artistKey] || 0) + 1;
        artistNameTime[artistKey] = (artistNameTime[artistKey] || 0) + duration;
      }
    }

    // Extract genres
    const genreCounts: Record<string, number> = {};
    for (const artist of topArtists) {
      for (const genre of artist.genres || []) {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      }
    }

    const topGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count }));

    const hasImportedData = plays.length > 100;

    const formattedTracks = topTracks.map((track: any, i: number) => ({
      id: track.id,
      name: track.name,
      artist: track.artists?.map((a: any) => a.name).join(", "),
      image: track.album?.images?.[0]?.url,
      rank: i + 1,
      playCount: hasImportedData ? (trackPlayCounts[track.id] || 0) : null,
      totalTimeMs: hasImportedData ? (trackTotalTime[track.id] || 0) : null,
      duration: track.duration_ms,
      popularity: track.popularity,
    }));

    const formattedArtists = topArtists.map((artist: any, i: number) => {
      const artistKey = artist.name?.toLowerCase().trim();
      return {
        id: artist.id,
        name: artist.name,
        image: artist.images?.[0]?.url,
        genres: artist.genres,
        rank: i + 1,
        playCount: hasImportedData ? (artistNameCounts[artistKey] || 0) : null,
        totalTimeMs: hasImportedData ? (artistNameTime[artistKey] || 0) : null,
        followers: artist.followers?.total,
        popularity: artist.popularity,
      };
    });

    return NextResponse.json({
      filter,
      totalPlays: plays.length || 0,
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
