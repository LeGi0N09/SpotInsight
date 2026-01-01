import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
      {
        protocol: "https",
        hostname: "image-cdn.spotifycdn.com",
      },
    ],
    domains: ["i.scdn.co", "image-cdn.spotifycdn.com"],
  },
  async headers() {
    // Allow Spotify image CDNs and required connections while keeping a sane baseline
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      [
        "img-src",
        "'self'",
        "data:",
        "blob:",
        "https://i.scdn.co",
        "https://image-cdn.spotifycdn.com",
        "https://*.scdn.co",
        "https://*.spotifycdn.com",
      ].join(" "),
      [
        "connect-src",
        "'self'",
        "https://api.spotify.com",
        "https://i.scdn.co",
        "https://*.scdn.co",
        "https://*.spotifycdn.com",
        "https://*.supabase.co",
        "https://*.supabase.net",
      ].join(" "),
      [
        "media-src",
        "'self'",
        "data:",
        "blob:",
        "https://i.scdn.co",
        "https://*.spotifycdn.com",
      ].join(" "),
      "frame-src 'self'",
      "base-uri 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
