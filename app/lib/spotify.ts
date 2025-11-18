async function refreshAccessToken() {
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  // Update the access token in env (for this session only)
  process.env.SPOTIFY_ACCESS_TOKEN = data.access_token;
  
  return data.access_token;
}

export async function spotifyFetch(path: string, opts: RequestInit = {}) {
  let access = process.env.SPOTIFY_ACCESS_TOKEN;

  if (!access) {
    access = await refreshAccessToken();
  }

  let res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Authorization: `Bearer ${access}`,
    },
    cache: "no-store",
  });

  // If token expired, refresh and retry
  if (res.status === 401) {
    access = await refreshAccessToken();
    res = await fetch(`https://api.spotify.com/v1${path}`, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        Authorization: `Bearer ${access}`,
      },
      cache: "no-store",
    });
  }

  return res;
}
