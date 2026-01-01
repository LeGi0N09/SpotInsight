import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const imageUrl = url.searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  try {
    // Only allow Spotify image domains
    const urlObj = new URL(imageUrl);
    if (
      !urlObj.hostname.includes("scdn.co") &&
      !urlObj.hostname.includes("spotifycdn.com")
    ) {
      return NextResponse.json(
        { error: "Invalid image domain" },
        { status: 403 }
      );
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": response.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("[image-proxy]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
