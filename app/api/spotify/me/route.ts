import { spotifyFetch } from "../../../lib/spotify";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await spotifyFetch("/me");
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "No auth" }, { status: 401 });
  }
}
