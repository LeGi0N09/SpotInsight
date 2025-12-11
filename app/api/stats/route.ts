import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ───────────────────── TYPES ───────────────────── //

interface TrackStat {
  track_id: string;
  play_count: number;
  total_time?: number;
  track_name: string;
  artist_name: string;
  album_image?: string;
}

interface ArtistStat {
  artist: string;
  play_count: number;
  total_time?: number;
}

interface StatsRPCResponse {
  trackStats?: TrackStat[];
  artistStats?: ArtistStat[];
}

interface SnapshotTrack {
  id: string;
  name?: string;
  artists?: { name: string }[];
  album?: { images?: { url: string }[] };
  duration_ms?: number;
  popularity?: number;
}

interface SnapshotArtist {
  id: string;
  name: string;
  images?: { url: string }[];
  genres?: string[];
  followers?: { total: number };
  popularity?: number;
}

interface SnapshotRow {
  synced_at: string;
  top_tracks_long?: SnapshotTrack[];
  top_artists_long?: SnapshotArtist[];
}

export async function GET(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || 'all';

  try {
    // FETCH SNAPSHOT + STATS + ARTIST CACHE IN PARALLEL
    const [snapshotRes, statsRes, artistCacheRes] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/snapshots?select=*&order=synced_at.desc&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      ),
      fetch(`${supabaseUrl}/rest/v1/rpc/get_play_stats`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ time_range: range }),
      }),
      fetch(`${supabaseUrl}/rest/v1/artist_cache?select=*&limit=100000`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }),
    ]);

    const snapshots: SnapshotRow[] = await snapshotRes.json();
    const statsData: StatsRPCResponse = await statsRes.json();
    const artistCache: any[] = await artistCacheRes.json();
    const snapshot = snapshots[0];
    
    console.log(`📦 Artist cache has ${artistCache.length} entries`);

    if (!snapshot) {
      return NextResponse.json({ error: "No synced snapshot" }, { status: 404 });
    }

    // REAL TOTAL PLAYS — FROM `plays` TABLE
    const totalPlaysRes = await fetch(
      `${supabaseUrl}/rest/v1/plays?select=count`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "count=exact",
        },
      }
    );

    const totalPlaysJson = await totalPlaysRes.json();
    const totalPlays = totalPlaysJson?.[0]?.count || 0;

    // TRACK + ARTIST LOOKUP BUILDING
    const trackPlayCounts: Record<string, number> = {};
    const trackTotalTime: Record<string, number> = {};
    const trackNames: Record<string, string> = {};
    const trackArtists: Record<string, string> = {};
    const trackImages: Record<string, string> = {};

    const artistPlayCounts: Record<string, number> = {};
    const artistTotalTime: Record<string, number> = {};

    for (const t of statsData.trackStats ?? []) {
      trackPlayCounts[t.track_id] = t.play_count;
      trackTotalTime[t.track_id] = t.total_time ?? 0;
      trackNames[t.track_id] = t.track_name;
      trackArtists[t.track_id] = t.artist_name;
      if (t.album_image) trackImages[t.track_id] = t.album_image;
    }

    for (const a of statsData.artistStats ?? []) {
      const name = a.artist.trim();
      artistPlayCounts[name] = a.play_count;
      artistTotalTime[name] = a.total_time ?? 0;
    }

    // SORT RANKING
    const topTracksByPlays = Object.entries(trackPlayCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);

    const topArtistsByPlays = Object.entries(artistPlayCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);

    // MAP METADATA
    const spotifyTracks = snapshot.top_tracks_long ?? [];
    const spotifyArtists = snapshot.top_artists_long ?? [];

    const trackMeta = new Map(spotifyTracks.map((t) => [t.id, t]));
    
    // Build artist metadata map from snapshot + cache
    const artistMeta = new Map(
      spotifyArtists.map((a) => [a.name.toLowerCase(), a])
    );
    
    // Add ALL cached artists (overwrite snapshot if cache is newer)
    let cacheUsed = 0;
    for (const cached of artistCache) {
      const key = cached.name.toLowerCase();
      artistMeta.set(key, {
        id: cached.id,
        name: cached.name,
        images: cached.image_url ? [{ url: cached.image_url }] : [],
        genres: cached.genres || [],
        followers: { total: cached.followers || 0 },
        popularity: cached.popularity || 0,
      });
      cacheUsed++;
    }
    console.log(`✅ Using ${spotifyArtists.length} from snapshot + ${cacheUsed} from cache = ${artistMeta.size} total`)

    // FORMAT TRACKS
    const formattedTracks = topTracksByPlays.map(([trackId, playCount], i) => {
      const meta = trackMeta.get(trackId);

      return {
        id: trackId,
        name: meta?.name ?? trackNames[trackId] ?? "Unknown Track",
        artist:
          meta?.artists?.map((a) => a.name).join(", ") ??
          trackArtists[trackId] ??
          "Unknown Artist",
        image: meta?.album?.images?.[0]?.url ?? trackImages[trackId],
        rank: i + 1,
        playCount,
        totalTimeMs: trackTotalTime[trackId] ?? 0,
        duration: meta?.duration_ms,
        popularity: meta?.popularity ?? 0,
      };
    });

    // FORMAT ARTISTS
    const formattedArtists = topArtistsByPlays.map(([name, playCount], i) => {
      const key = name.toLowerCase();
      const snapMeta = artistMeta.get(key);
      
      if (!snapMeta && i < 10) {
        console.log(`⚠️  Missing metadata for #${i+1}: ${name}`);
      }

      return {
        id: snapMeta?.id ?? name,
        name,
        image: snapMeta?.images?.[0]?.url,
        genres: snapMeta?.genres ?? [],
        followers: snapMeta?.followers?.total ?? null,
        popularity: snapMeta?.popularity ?? null,
        rank: i + 1,
        playCount,
        totalTimeMs: artistTotalTime[name] ?? 0,
      };
    });
    console.log(`🎤 Formatted ${formattedArtists.length} artists\n`);

    // GENRE COUNTS
    const genreCounts: Record<string, number> = {};
    for (const artist of formattedArtists) {
      for (const g of artist.genres ?? []) {
        genreCounts[g] = (genreCounts[g] ?? 0) + 1;
      }
    }

    const topGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count }));

    // Count unique artists and tracks using RPC
    const [artistCountRes, trackCountRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/rpc/count_unique_artists`, {
        method: 'POST',
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }),
      fetch(`${supabaseUrl}/rest/v1/rpc/count_unique_tracks`, {
        method: 'POST',
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
    ]);
    
    const totalArtists = await artistCountRes.json();
    const totalTracks = await trackCountRes.json();

    return NextResponse.json({
      totalPlays,
      totalArtists,
      totalTracks,
      topTracks: formattedTracks,
      topArtists: formattedArtists,
      topGenres,
      lastSynced: snapshot.synced_at,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
