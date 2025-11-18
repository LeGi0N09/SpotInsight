import { spotifyFetch } from "../../../lib/spotify";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await spotifyFetch("/recommendations/available-genre-seeds");
    if (!res.ok) {
      return NextResponse.json({ genres: [] }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ genres: [] }, { status: 401 });
  }
}
