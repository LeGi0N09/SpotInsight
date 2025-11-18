import { spotifyFetch } from "../../../lib/spotify";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [profile, topArtistsLong, topTracksLong, recent] = await Promise.all([
      spotifyFetch("/me").then(r => r.json()),
      spotifyFetch("/me/top/artists?limit=50&time_range=long_term").then(r => r.json()),
      spotifyFetch("/me/top/tracks?limit=50&time_range=long_term").then(r => r.json()),
      spotifyFetch("/me/player/recently-played?limit=50").then(r => r.json()),
    ]);

    return NextResponse.json({
      profile: {
        name: profile.display_name,
        email: profile.email,
        country: profile.country,
        followers: profile.followers?.total,
        product: profile.product,
        image: profile.images?.[0]?.url,
      },
      allTimeTopArtists: topArtistsLong.items || [],
      allTimeTopTracks: topTracksLong.items || [],
      recentlyPlayed: recent.items || [],
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
