// app/api/spotify/monthly-agg/route.ts
import { spotifyFetch } from "../../../lib/spotify";
import { NextResponse } from "next/server";

interface RecentlyPlayedItem {
  played_at: string;
}

interface RecentlyPlayedResponse {
  items: RecentlyPlayedItem[];
}

export async function GET() {
  try {
    const res = await spotifyFetch("/me/player/recently-played?limit=50");

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch recently played" },
        { status: res.status }
      );
    }

    const data: RecentlyPlayedResponse = await res.json();

    if (!Array.isArray(data.items)) {
      return NextResponse.json([]);
    }

    const counts: Record<string, { plays: number; sortKey: string }> = {};

    data.items.forEach((item) => {
      if (!item.played_at) return;
      
      const dt = new Date(item.played_at);
      if (isNaN(dt.getTime())) return;

      const sortKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const displayKey = dt.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });

      if (!counts[sortKey]) {
        counts[sortKey] = { plays: 0, sortKey };
      }
      counts[sortKey].plays++;
    });

    const arr = Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, { plays }]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          month: date.toLocaleString("en-US", { month: "short", year: "numeric" }),
          plays,
        };
      });

    return NextResponse.json(arr);
  } catch (error) {
    console.error("[monthly-agg] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
