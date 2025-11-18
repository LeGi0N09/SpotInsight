import { spotifyFetch } from "../../../lib/spotify";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const timeRange = url.searchParams.get("time_range") || "medium_term";
  const limit = url.searchParams.get("limit") || "20";

  try {
    const res = await spotifyFetch(`/me/top/artists?limit=${limit}&time_range=${timeRange}`);
    if (!res.ok) {
      return NextResponse.json({ items: [] }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }
}
