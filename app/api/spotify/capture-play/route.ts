import { spotifyFetch } from "../../../lib/spotify";
import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get recently played to get accurate played_at timestamp
    const recentRes = await spotifyFetch("/me/player/recently-played?limit=1");

    if (!recentRes.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to get recently played" },
        { status: 200 }
      );
    }

    const recentData = await recentRes.json();
    const lastTrack = recentData?.items?.[0];

    if (!lastTrack) {
      return NextResponse.json(
        { success: false, message: "No recently played tracks" },
        { status: 200 }
      );
    }

    const track = lastTrack.track;
    const playedAt = lastTrack.played_at;
    const trackId = track.id;
    const trackName = track.name;
    const artistName = track.artists?.[0]?.name || "Unknown Artist";
    const albumImage = track.album?.images?.[0]?.url || null;
    const msPlayed = track.duration_ms;

    // Check for exact duplicate using track_id and played_at
    try {
      const recentPlays = await db.plays.getLatestByTrackId(trackId, 10);

      // Check if this exact play (same track_id AND played_at) already exists
      const exactMatch = recentPlays.find(
        (play: { played_at: string }) => play.played_at === playedAt
      );

      if (exactMatch) {
        return NextResponse.json(
          {
            success: false,
            message: "Track already captured (exact match)",
            trackId,
            trackName,
          },
          { status: 200 }
        );
      }
    } catch (dbError) {
      // If duplicate check fails, continue anyway - better to capture than lose data
      console.warn("[capture-play] Duplicate check failed:", dbError);
    }

    // Insert the play record
    try {
      const success = await db.plays.insert([
        {
          user_id: process.env.SYNC_USER_ID || "default_user",
          track_id: trackId,
          track_name: trackName,
          artist_name: artistName,
          album_image: albumImage,
          ms_played: msPlayed,
          played_at: playedAt,
        },
      ]);

      if (success) {
        return NextResponse.json({
          success: true,
          message: "Track captured successfully",
          track: {
            id: trackId,
            name: trackName,
            artist: artistName,
          },
        });
      }
    } catch (dbError) {
      const errorMsg =
        dbError instanceof Error ? dbError.message : String(dbError);

      // Check if it's a 409 constraint violation (duplicate entry)
      if (
        errorMsg.includes("409") ||
        errorMsg.includes("duplicate key") ||
        errorMsg.includes("23505")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Track already captured (duplicate)",
            trackId,
            trackName,
          },
          { status: 200 }
        );
      }

      console.error("[capture-play] Database error:", errorMsg);
      return NextResponse.json(
        { success: false, message: errorMsg },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to save track to database" },
      { status: 500 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[capture-play] Error:", errorMsg, error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
