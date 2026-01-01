import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const plays = await db.plays.getLatest(limit);

    return NextResponse.json({
      success: true,
      count: plays.length,
      plays,
    });
  } catch (error) {
    console.error("[latest-plays] Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
