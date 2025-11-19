import { NextResponse } from "next/server";
import { spotifyFetch } from "../../lib/spotify";

async function enrichArtists() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

    // Get top artists from database
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

    if (!statsData.artistStats) {
      return NextResponse.json({ message: "No artists found", updated: 0 });
    }

    // Get top 20 artists by play count
    const topArtists = statsData.artistStats
      .sort((a: {play_count: number}, b: {play_count: number}) => b.play_count - a.play_count)
      .slice(0, 20)
      .map((a: {artist: string}) => a.artist?.trim())
      .filter(Boolean);

    const artistMetadata: Record<string, {image: string; id: string; genres: string[]; followers: number; popularity: number}> = {};
    let enriched = 0;

    // Search for each artist on Spotify
    for (const artistName of topArtists) {
      const searchRes = await spotifyFetch(`/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`);
      
      if (!searchRes.ok) continue;

      const data = await searchRes.json();
      const artist = data.artists?.items?.[0];
      
      if (artist) {
        artistMetadata[artistName] = {
          image: artist.images?.[0]?.url || '',
          id: artist.id,
          genres: artist.genres || [],
          followers: artist.followers?.total || 0,
          popularity: artist.popularity || 0,
        };
        enriched++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      enriched, 
      total: topArtists.length,
      metadata: artistMetadata 
    });
  } catch (error) {
    console.error('[enrich-artists] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST() {
  return enrichArtists();
}

export async function GET() {
  return enrichArtists();
}
