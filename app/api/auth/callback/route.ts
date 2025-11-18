import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  console.log("🟢 CALLBACK - Code received");

  if (!code) {
    return NextResponse.redirect(new URL('/login', url.origin));
  }

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
    }),
  });

  if (!tokenRes.ok) {
    console.log("❌ Token exchange failed");
    return NextResponse.redirect(new URL('/login', url.origin));
  }

  const tokens = await tokenRes.json();

  console.log("\n\n🎉 SUCCESS! Copy these to .env.local:\n");
  console.log(`SPOTIFY_ACCESS_TOKEN=${tokens.access_token}`);
  console.log(`SPOTIFY_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log("\n\n");

  const res = NextResponse.redirect(new URL('/', url.origin));
  
  res.cookies.set("spotify_access", tokens.access_token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 3600,
  });

  res.cookies.set("spotify_refresh", tokens.refresh_token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
