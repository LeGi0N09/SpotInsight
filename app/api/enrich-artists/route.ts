import { NextResponse } from "next/server";
import { spotifyFetch } from "../../lib/spotify";

export const revalidate = 0;

// ───────────────────────────────
// TYPES
// ───────────────────────────────

interface ArtistStat {
  artist: string;
  play_count: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
  genres?: string[];
  followers?: { total: number };
  popularity?: number;
}

interface EnrichedArtist {
  id: string;
  image: string;
  genres: string[];
  followers: number;
  popularity: number;
}

// ───────────────────────────────
// HANDLER
// ───────────────────────────────

async function enrichArtists() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

    // Fetch aggregated DB stats
    const statsRes = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_play_stats`,
      {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        },
      }
    );

    const statsData: { artistStats?: ArtistStat[] } = await statsRes.json();

    if (!statsData.artistStats || statsData.artistStats.length === 0) {
      return NextResponse.json({ message: "No artists found", enriched: 0 });
    }

    // Pick top 20 artists
    const topArtists: string[] = statsData.artistStats
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, 20)
      .map((a) => a.artist.trim())
      .filter(Boolean);

    // Parallel Spotify search
    const results = await Promise.all(
      topArtists.map(async (name: string): Promise<{ name: string; data: EnrichedArtist | null }> => {
        const query = `/search?q=artist:${encodeURIComponent(name)}&type=artist&limit=1`;
        const res = await spotifyFetch(query);

        if (!res.ok) return { name, data: null };

        const json: { artists?: { items?: SpotifyArtist[] } } = await res.json();
        const artist = json.artists?.items?.[0];

        if (!artist) return { name, data: null };

        const enriched: EnrichedArtist = {
          id: artist.id,
          image: artist.images?.[0]?.url ?? "",
          genres: artist.genres ?? [],
          followers: artist.followers?.total ?? 0,
          popularity: artist.popularity ?? 0
        };

        return { name, data: enriched };
      })
    );

    // Convert array to object
    const metadata: Record<string, EnrichedArtist> = {};

    results.forEach((entry) => {
      if (entry.data) {
        metadata[entry.name] = entry.data;
      }
    });

    const enrichedCount = Object.keys(metadata).length;

    return NextResponse.json({
      success: true,
      enriched: enrichedCount,
      total: topArtists.length,
      metadata
    });

  } catch (error) {
    console.error("[enrich-artists] Error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

// ───────────────────────────────
// ROUTES
// ───────────────────────────────

export async function POST() {
  return enrichArtists();
}

export async function GET() {
  return enrichArtists();
}
