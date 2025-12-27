import { NextResponse } from "next/server";

interface Track {
  track_id: string;
  track_name: string;
  artist_name: string;
  album_image?: string;
  created_at: string;
}

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const url = new URL(req.url);

  // Get query parameters
  const range = url.searchParams.get("range") || "all"; // all, month, year, custom
  const startDate = url.searchParams.get("startDate"); // ISO date string
  const endDate = url.searchParams.get("endDate"); // ISO date string

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  try {
    // Calculate date range
    let startDateStr = "";
    let endDateStr = new Date().toISOString();

    if (range === "month" || (range === "custom" && startDate && endDate)) {
      if (range === "month") {
        const now = new Date();
        startDateStr = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        ).toISOString();
      } else {
        startDateStr = startDate || "";
      }
      if (range === "custom" && endDate) {
        endDateStr = endDate;
      }
    } else if (range === "year") {
      const now = new Date();
      startDateStr = new Date(now.getFullYear(), 0, 1).toISOString();
    }

    // 1. Get all plays from plays table (paginate through all records)
    const plays: Track[] = [];
    let offset = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = `${supabaseUrl}/rest/v1/plays?select=track_id,track_name,artist_name,album_image,created_at&offset=${offset}&limit=${pageSize}`;

      // Add date filters
      if (startDateStr) {
        query += `&created_at=gte.${startDateStr}`;
      }
      if (endDateStr) {
        query += `&created_at=lte.${endDateStr}`;
      }

      const playsRes = await fetch(query, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      const batch: Track[] = await playsRes.json();

      if (!Array.isArray(batch) || batch.length === 0) {
        hasMore = false;
      } else {
        plays.push(...batch);
        if (batch.length < pageSize) {
          hasMore = false;
        } else {
          offset += pageSize;
        }
      }
    }

    if (plays.length === 0) {
      return NextResponse.json({
        totalPlays: 0,
        totalArtists: 0,
        totalTracks: 0,
        topArtists: [],
        topTracks: [],
        topGenres: [],
        lastSynced: null,
      });
    }

    // 2. Calculate stats from plays table
    const totalPlays = plays.length;
    const uniqueTracks = new Set(plays.map((p) => p.track_id)).size;
    const uniqueArtists = new Set(plays.map((p) => p.artist_name)).size;

    // 3. Count artists
    const artistCounts: Record<string, number> = {};
    plays.forEach((p) => {
      if (p.artist_name) {
        artistCounts[p.artist_name] = (artistCounts[p.artist_name] ?? 0) + 1;
      }
    });

    const topArtists = Object.entries(artistCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([name, count], i) => ({
        id: name,
        name,
        playCount: count,
        rank: i + 1,
        genres: [],
      }));

    // 4. Count tracks
    const trackCounts: Record<
      string,
      { name: string; artist: string; image?: string; count: number }
    > = {};
    plays.forEach((p) => {
      if (p.track_id) {
        trackCounts[p.track_id] = trackCounts[p.track_id] || {
          name: p.track_name || "Unknown",
          artist: p.artist_name || "Unknown",
          image: p.album_image,
          count: 0,
        };
        trackCounts[p.track_id].count++;
      }
    });

    const topTracks = Object.entries(trackCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 20)
      .map(([id, data], i) => ({
        id,
        name: data.name,
        artist: data.artist,
        image: data.image,
        playCount: data.count,
        rank: i + 1,
      }));

    // Get last synced timestamp from most recent play
    const lastSynced = plays[plays.length - 1]?.created_at || null;

    return NextResponse.json({
      totalPlays,
      totalArtists: uniqueArtists,
      totalTracks: uniqueTracks,
      topTracks,
      topArtists,
      topGenres: [],
      lastSynced,
    });
  } catch (err) {
    console.error("[stats]", err);
    return NextResponse.json(
      {
        error: String(err),
        totalPlays: 0,
        totalArtists: 0,
        totalTracks: 0,
        topArtists: [],
        topTracks: [],
        topGenres: [],
      },
      { status: 200 }
    );
  }
}
