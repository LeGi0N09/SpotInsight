/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
  experimental: {
    allowedDevOrigins: ['http://127.0.0.1:3000'],
  },
};

module.exports = nextConfig;
