import { NextResponse } from "next/server";

export const revalidate = 120; // Revalidate every 2 minutes

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  try {
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    const playsRes = await fetch(`${supabaseUrl}/rest/v1/plays?select=*`, { headers });
    const plays = await playsRes.json();

    if (!plays || plays.length === 0) {
      return NextResponse.json({ insights: [], message: "No data available" });
    }

    const insights = [];

    interface Play {
      ms_played?: number;
      played_at: string;
      artist_name?: string;
    }

    // Total listening time
    const totalMs = plays.reduce((sum: number, p: Play) => sum + (p.ms_played || 0), 0);
    const totalHours = Math.round(totalMs / 3600000);
    insights.push({
      type: "listening_time",
      title: "Total Listening Time",
      value: `${totalHours} hours`,
      description: `You've spent ${totalHours} hours listening to music`,
    });

    // Current streak
    const dates = [...new Set(plays.map((p: Play) => new Date(p.played_at).toDateString()))].sort() as string[];
    let currentStreak = 0;
    const today = new Date().toDateString();
    for (let i = dates.length - 1; i >= 0; i--) {
      const daysDiff = Math.floor((new Date(today).getTime() - new Date(dates[i]).getTime()) / 86400000);
      if (daysDiff === currentStreak) currentStreak++;
      else break;
    }
    insights.push({
      type: "streak",
      title: "Current Listening Streak",
      value: `${currentStreak} days`,
      description: currentStreak > 0 ? `You've listened ${currentStreak} days in a row` : "Start your streak today!",
    });

    // Peak time of day
    const hourCounts: Record<number, number> = {};
    plays.forEach((p: Play) => {
      const hour = new Date(p.played_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0];
    const timeOfDay = parseInt(peakHour[0]) < 12 ? "Morning" : parseInt(peakHour[0]) < 17 ? "Afternoon" : parseInt(peakHour[0]) < 21 ? "Evening" : "Night";
    insights.push({
      type: "peak_time",
      title: "Peak Listening Time",
      value: timeOfDay,
      description: `You listen most during ${timeOfDay.toLowerCase()} hours`,
    });

    // Artist loyalty
    const artistCounts: Record<string, number> = {};
    plays.forEach((p: Play) => {
      if (p.artist_name) artistCounts[p.artist_name] = (artistCounts[p.artist_name] || 0) + 1;
    });
    const topArtist = Object.entries(artistCounts).sort(([, a], [, b]) => b - a)[0];
    if (topArtist) {
      const loyaltyScore = Math.round((topArtist[1] / plays.length) * 100);
      insights.push({
        type: "loyalty",
        title: "Most Loyal To",
        value: topArtist[0],
        description: `${loyaltyScore}% of your plays are ${topArtist[0]}`,
      });
    }

    // Active days
    insights.push({
      type: "active_days",
      title: "Active Listening Days",
      value: `${dates.length} days`,
      description: `You've listened to music on ${dates.length} different days`,
    });

    // Skip detection
    const skips = plays.filter((p: Play) => (p.ms_played || 0) < 30000).length;
    const skipRate = plays.length > 0 ? Math.round((skips / plays.length) * 100) : 0;
    insights.push({
      type: "skip_rate",
      title: "Skip Rate",
      value: `${skipRate}%`,
      description: `You skipped ${skips} tracks (played < 30s)`,
    });

    return NextResponse.json({ insights, totalPlays: plays.length });
  } catch (error) {
    console.error("[insights] Error:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
