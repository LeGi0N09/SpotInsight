import { NextResponse } from "next/server";

export const revalidate = 30;

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  try {
    // Fetch everything in parallel - all with safe limits
    const [playsRes, snapshotRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/plays?select=count`, {
        headers: { ...headers, Prefer: "count=exact" },
      }),
      fetch(
        `${supabaseUrl}/rest/v1/snapshots?select=synced_at&order=synced_at.desc&limit=1`,
        { headers }
      ),
    ]);

    const [playsData, snapshots] = await Promise.all([
      playsRes.json(),
      snapshotRes.json(),
    ]);

    const plays_count = playsData?.[0]?.count || 0;
    const lastSnapshot = snapshots?.[0]?.synced_at || null;
    const lastSync = lastSnapshot || new Date().toISOString();

    return NextResponse.json({
      status: "online",
      lastSync,
      plays_count,
    });
  } catch (error) {
    console.error("[health]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
