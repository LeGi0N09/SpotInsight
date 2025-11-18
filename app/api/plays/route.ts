import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/plays?select=*&order=played_at.desc&limit=100`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    const plays = await res.json();
    return NextResponse.json(plays);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
