import { NextResponse } from "next/server";

export const revalidate = 300; // Revalidate every 5 minutes

export async function GET(req: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || 'all';

  try {
    // Use RPC function for instant aggregation (100x faster than fetching 54k rows)
    const res = await fetch(`${url}/rest/v1/rpc/get_monthly_plays`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const data = await res.json();
    const result = data.map((row: {month_key: string; plays: number}) => {
      const [year, month] = row.month_key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return {
        month: date.toLocaleString("en-US", { month: "short", year: "numeric" }),
        plays: row.plays,
      };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}
