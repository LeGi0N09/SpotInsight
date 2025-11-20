import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export const revalidate = 30;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const plays = await db.plays.getRecent(Math.min(limit, 500));
    return NextResponse.json(plays);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
