"use client";

export default function LoginPage() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0d1517] to-[#05090b] text-white">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold">Spotify Dashboard</h1>
        <p className="text-zinc-400 text-lg">Track your listening habits and discover insights</p>
        <a
          href="/api/auth/login"
          className="inline-block mt-8 px-8 py-4 bg-green-500 text-black rounded-xl text-lg font-semibold hover:bg-green-400 transition-all"
        >
          Login with Spotify
        </a>
      </div>
    </div>
  );
}
