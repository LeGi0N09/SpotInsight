import { NextResponse } from "next/server";
import { monitor } from "../../../lib/monitoring";

export const revalidate = 0;

export async function GET() {
  try {
    const stats = monitor.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
