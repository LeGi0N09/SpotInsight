// /app/api/enrich-artists/route.ts
import { NextResponse } from "next/server";
import { spotifyFetch } from "../../lib/spotify";

export const revalidate = 0;

type ArtistStatRow = { artist: string; play_count: number };

type SpotifyArtist = {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
  genres?: string[];
  followers?: { total: number };
  popularity?: number;
};

interface CacheRow {
  id: string;
  name: string;
  image_url?: string | null;
  genres?: string[] | null;
  followers?: number | null;
  popularity?: number | null;
  last_synced?: string | null;
  created_at?: string | null;
}

// CONFIG
const SUPABASE_BATCH_UPSERT_SIZE = 20; // upsert in small groups
const SPOTIFY_BATCH_SIZE = 5; // concurrency (requests at once)
const SPOTIFY_REQUEST_DELAY_MS = 250; // small delay between batches to be safe

// Helper sleep
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Query Supabase REST with fetch
 * (returns parsed JSON or null on error)
 */
async function supabaseFetch(url: string, opts: RequestInit) {
  try {
    const res = await fetch(url, opts);
    const json = await res.json();
    return { ok: res.ok, status: res.status, json };
  } catch (err) {
    console.error("[supabaseFetch] error", err);
    return { ok: false, status: 0, json: null };
  }
}

async function enrichArtistsHandler() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  try {
    // 1) Fetch aggregated artist stats (RPC)
    const statsRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_play_stats`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!statsRes.ok) {
      const body = await statsRes.text();
      console.error("[enrich-artists] get_play_stats failed:", statsRes.status, body);
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }

    const statsJson = await statsRes.json();
    const artistStats: ArtistStatRow[] = statsJson?.artistStats ?? [];

    if (artistStats.length === 0) {
      return NextResponse.json({ success: true, enriched: 0, total: 0, message: "No artists" });
    }

    // 2) Choose top N artists (20)
    const topArtists = artistStats
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, 20)
      .map((r) => (r.artist ?? "").trim())
      .filter(Boolean);

    // result accumulators
    const metadata: Record<string, CacheRow> = {};
    let enriched = 0;
    const skippedFromCache: string[] = [];
    const newlyFetched: string[] = [];
    const failed: string[] = [];

    // 3) Process artists in batches with concurrency control
    // We'll check cache (case-insensitive exact), then fuzzy ilike, then Spotify search
    for (let i = 0; i < topArtists.length; i += SPOTIFY_BATCH_SIZE) {
      const batch = topArtists.slice(i, i + SPOTIFY_BATCH_SIZE);

      // For each artist in the batch do the full pipeline concurrently
      const batchPromises = batch.map(async (artistName) => {
        // 3A) Try exact case-insensitive match first using ilike with exact string
        // Supabase REST: filter syntax - name=ilike.<value>
        const encodedExact = encodeURIComponent(artistName);
        const exactUrl = `${supabaseUrl}/rest/v1/artist_cache?select=*&name=ilike.${encodedExact}`;
        const exactRes = await supabaseFetch(exactUrl, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        });

        if (exactRes.ok && Array.isArray(exactRes.json) && exactRes.json.length > 0) {
          // use first exact match
          const row: CacheRow = exactRes.json[0];
          metadata[artistName] = row;
          skippedFromCache.push(artistName);
          return;
        }

        // 3B) Try fuzzy contains (ILIKE %artist%)
        // safer fallback before hitting Spotify
        const encodedLike = encodeURIComponent(`%${artistName}%`);
        const likeUrl = `${supabaseUrl}/rest/v1/artist_cache?select=*&name=ilike.${encodedLike}&limit=1`;
        const likeRes = await supabaseFetch(likeUrl, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        });

        if (likeRes.ok && Array.isArray(likeRes.json) && likeRes.json.length > 0) {
          const row: CacheRow = likeRes.json[0];
          metadata[artistName] = row;
          skippedFromCache.push(artistName);
          return;
        }

        // 3C) Cache miss → query Spotify (accurate search with artist: prefix)
        // Use spotifyFetch helper (should include auth)
        const query = `/search?q=artist:${encodeURIComponent(artistName)}&type=artist&limit=1`;
        const spotifyRes = await spotifyFetch(query);

        if (!spotifyRes.ok) {
          console.error(`[enrich-artists] Spotify search failed for "${artistName}"`, spotifyRes.status);
          failed.push(artistName);
          return;
        }

        const spotifyJson = await spotifyRes.json();
        const artist: SpotifyArtist | undefined = spotifyJson?.artists?.items?.[0];

        if (!artist) {
          failed.push(artistName);
          return;
        }

        // build cache row
        const rowToUpsert: CacheRow = {
          id: artist.id,
          name: artistName,
          image_url: artist.images?.[0]?.url ?? null,
          genres: artist.genres ?? null,
          followers: artist.followers?.total ?? null,
          popularity: artist.popularity ?? null,
          last_synced: new Date().toISOString(),
        };

        // Upsert into artist_cache using Supabase REST (resolution=merge-duplicates)
        // We POST an array with one object and ask Supabase to merge duplicates on primary key (id)
        const upsertRes = await supabaseFetch(`${supabaseUrl}/rest/v1/artist_cache`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=representation",
          },
          body: JSON.stringify([rowToUpsert]),
        });

        if (!upsertRes.ok) {
          console.error(`[enrich-artists] Upsert failed for "${artistName}"`, upsertRes.status, upsertRes.json);
          failed.push(artistName);
          return;
        }

        // take returned row if present
        const returned = Array.isArray(upsertRes.json) && upsertRes.json[0] ? (upsertRes.json[0] as CacheRow) : rowToUpsert;
        metadata[artistName] = returned;
        newlyFetched.push(artistName);
        enriched++;
      });

      // Wait for this batch to finish before continuing (simple concurrency)
      await Promise.all(batchPromises);

      // Sleep a bit between batches to avoid crossing Spotify rate limits
      if (i + SPOTIFY_BATCH_SIZE < topArtists.length) {
        await sleep(SPOTIFY_REQUEST_DELAY_MS);
      }
    }

    // Return summary
    return NextResponse.json({
      success: true,
      total: topArtists.length,
      enriched,
      cached_skipped: skippedFromCache.length,
      newlyFetched,
      failed,
      metadata,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[enrich-artists] unexpected error", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return enrichArtistsHandler();
}
export async function POST() {
  return enrichArtistsHandler();
}
