import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET() {
  try {
    const plays = await db.plays.getRecent(500);
    return NextResponse.json(plays);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
