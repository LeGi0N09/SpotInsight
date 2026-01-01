import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Simple in-memory cache
const statsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

export async function GET(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const url = new URL(req.url);

  // Get query parameters
  const range = url.searchParams.get("range") || "all";
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  // Create cache key
  const cacheKey = `${range}:${startDate}:${endDate}`;

  // Check cache
  const cached = statsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  try {
    // Calculate date range
    let startDateStr = "";
    let endDateStr = new Date().toISOString();
    let dateFilter = "";

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

    // Build date filter
    if (startDateStr) {
      dateFilter += `&created_at=gte.${startDateStr}`;
    }
    if (endDateStr) {
      dateFilter += `&created_at=lte.${endDateStr}`;
    }

    // Parallel fetch: count + last sync
    const [countRes, lastSyncRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/plays?select=id${dateFilter}`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "count=exact",
        },
      }),
      fetch(
        `${supabaseUrl}/rest/v1/plays?select=created_at${dateFilter}&order=created_at.desc&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      ),
    ]);

    let totalPlays = 0;
    if (countRes.ok) {
      const countHeader = countRes.headers.get("content-range");
      if (countHeader) {
        const match = countHeader.match(/\d+\/(\d+)/);
        totalPlays = match ? parseInt(match[1]) : 0;
      }
    }

    let lastSynced = null;
    if (lastSyncRes.ok) {
      const lastSyncData = await lastSyncRes.json();
      lastSynced = lastSyncData[0]?.created_at || null;
    }

    if (totalPlays === 0) {
      const result = {
        totalPlays: 0,
        totalArtists: 0,
        totalTracks: 0,
        topArtists: [],
        topTracks: [],
        topGenres: [],
        lastSynced: null,
      };
      statsCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return NextResponse.json(result);
    }

    let topArtists: any[] = [];
    let topTracks: any[] = [];
    let uniqueArtists = 0;
    let uniqueTracks = 0;

    // Get counts and top lists - paginate through ALL data for accuracy
    const artistMap = new Map<string, number>();
    const trackMap = new Map<
      string,
      { name: string; artist: string; image?: string; count: number }
    >();

    let offset = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const allDataRes = await fetch(
        `${supabaseUrl}/rest/v1/plays?select=track_id,track_name,artist_name,album_image${dateFilter}&offset=${offset}&limit=${pageSize}`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      if (!allDataRes.ok) {
        console.error(`[stats] Failed to fetch data at offset ${offset}`);
        break;
      }

      const batch = await allDataRes.json();
      if (!Array.isArray(batch) || batch.length === 0) {
        hasMore = false;
      } else {
        batch.forEach((play: any) => {
          // Count artists
          if (play.artist_name) {
            artistMap.set(
              play.artist_name,
              (artistMap.get(play.artist_name) || 0) + 1
            );
          }

          // Count tracks
          if (play.track_id) {
            if (!trackMap.has(play.track_id)) {
              trackMap.set(play.track_id, {
                name: play.track_name || "Unknown",
                artist: play.artist_name || "Unknown",
                image: play.album_image,
                count: 0,
              });
            }
            const track = trackMap.get(play.track_id)!;
            track.count++;
          }
        });

        if (batch.length < pageSize) {
          hasMore = false;
        } else {
          offset += pageSize;
        }
      }
    }

    uniqueArtists = artistMap.size;
    uniqueTracks = trackMap.size;

    // Get top 20 artists
    topArtists = Array.from(artistMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([name, count], i) => ({
        id: name,
        name,
        playCount: count,
        rank: i + 1,
        genres: [],
      }));

    // Get top 20 tracks
    topTracks = Array.from(trackMap.entries())
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

    // 5. Get genres from snapshots
    let topGenres: any[] = [];
    try {
      const snapshotRes = await fetch(
        `${supabaseUrl}/rest/v1/snapshots?select=top_artists_long&order=synced_at.desc&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      if (snapshotRes.ok) {
        const snapshots = await snapshotRes.json();
        if (snapshots && snapshots[0]?.top_artists_long) {
          const genreCounts: Record<string, number> = {};
          const topArtistNames = new Set(topArtists.map((a) => a.name));

          snapshots[0].top_artists_long.forEach((artist: any) => {
            if (
              artist.genres &&
              Array.isArray(artist.genres) &&
              topArtistNames.has(artist.name)
            ) {
              artist.genres.forEach((genre: string) => {
                genreCounts[genre] = (genreCounts[genre] || 0) + 1;
              });
            }
          });

          topGenres = Object.entries(genreCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([genre, count]) => ({ genre, count }));
        }
      }
    } catch (err) {
      console.error("[stats] Failed to fetch genres:", err);
    }

    const result = {
      totalPlays,
      totalArtists: uniqueArtists,
      totalTracks: uniqueTracks,
      topTracks,
      topArtists,
      topGenres,
      lastSynced,
    };

    // Cache the result
    statsCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
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
