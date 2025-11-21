/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",   // Spotify album images
      },
    ],
  },
};

module.exports = nextConfig;
