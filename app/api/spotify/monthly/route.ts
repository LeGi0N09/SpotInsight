import { NextResponse } from "next/server";

export const revalidate = 300; // Revalidate every 5 minutes

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) return NextResponse.json([]);

  try {
    const res = await fetch(`${url}/rest/v1/plays?select=played_at`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    if (!res.ok) return NextResponse.json([]);

    const rows = await res.json();
    const map: Record<string, number> = {};

    for (const row of rows) {
      if (!row.played_at) continue;
      const date = new Date(row.played_at);
      if (isNaN(date.getTime())) continue;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + 1;
    }

    const result = Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, plays]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          month: date.toLocaleString("en-US", { month: "short", year: "numeric" }),
          plays,
        };
      });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}
