import { monitor } from '../../lib/monitoring';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function refreshAccessToken() {
  const startTime = Date.now();
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!refreshToken) throw new Error("No refresh token");

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
    monitor.track({
      type: 'token_refresh',
      name: 'spotify',
      duration: Date.now() - startTime,
      success: false,
      error: 'Failed to refresh token',
    });
    throw new Error("Failed to refresh token");
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + 50 * 60 * 1000,
  };
  
  monitor.track({
    type: 'token_refresh',
    name: 'spotify',
    duration: Date.now() - startTime,
    success: true,
  });
  
  return data.access_token;
}

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }
  return await refreshAccessToken();
}

export async function spotifyFetch(path: string, opts: RequestInit = {}) {
  let token = await getAccessToken();

  let res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (res.status === 401) {
    token = await refreshAccessToken();
    res = await fetch(`https://api.spotify.com/v1${path}`, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  }

  return res;
}
