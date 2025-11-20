import { NextResponse } from "next/server";

export const revalidate = 30; // Revalidate every 30 seconds

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  try {
    // Get last play added (any source)
    const lastPlayRes = await fetch(
      `${supabaseUrl}/rest/v1/plays?select=played_at,created_at,source&order=created_at.desc&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const lastPlay = await lastPlayRes.json();

    // Get total plays
    const totalRes = await fetch(
      `${supabaseUrl}/rest/v1/plays?select=count`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "count=exact",
        },
      }
    );
    const totalData = await totalRes.json();

    // Get last snapshot
    const snapshotRes = await fetch(
      `${supabaseUrl}/rest/v1/snapshots?select=snapshot_date&order=snapshot_date.desc&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const snapshot = await snapshotRes.json();

    const lastCronRun = lastPlay?.[0]?.created_at;
    const minutesSinceLastRun = lastCronRun 
      ? Math.floor((Date.now() - new Date(lastCronRun).getTime()) / 60000)
      : null;

    // Get last 10 cron runs
    const recentRunsRes = await fetch(
      `${supabaseUrl}/rest/v1/plays?select=created_at,source&source=eq.auto-sync&order=created_at.desc&limit=10`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const recentRuns = await recentRunsRes.json();

    // Group by timestamp (within 1 minute = same run)
    const groupedRuns: any[] = [];
    recentRuns?.forEach((play: any) => {
      const timestamp = new Date(play.created_at).toISOString().slice(0, 16); // Group by minute
      const existing = groupedRuns.find(r => r.timestamp.startsWith(timestamp));
      if (existing) {
        existing.saved++;
      } else {
        groupedRuns.push({
          timestamp: play.created_at,
          saved: 1,
          success: true,
        });
      }
    });

    // Get daily uptime from cron_logs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const cronLogsRes = await fetch(
      `${supabaseUrl}/rest/v1/cron_logs?select=executed_at,status,plays_saved&executed_at=gte.${thirtyDaysAgo.toISOString()}&order=executed_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const cronLogs = await cronLogsRes.json();

    // Group by day with success/failure counts
    const dailyUptime: Record<string, any> = {};
    cronLogs?.forEach((log: any) => {
      const date = new Date(log.executed_at).toISOString().split('T')[0];
      if (!dailyUptime[date]) {
        dailyUptime[date] = { total: 0, success: 0, failed: 0, plays: 0 };
      }
      dailyUptime[date].total++;
      if (log.status === 'success') {
        dailyUptime[date].success++;
        dailyUptime[date].plays += log.plays_saved || 0;
      } else {
        dailyUptime[date].failed++;
      }
    });

    // Get all cron logs (success + failed)
    const cronHistoryRes = await fetch(
      `${supabaseUrl}/rest/v1/cron_logs?select=*&order=executed_at.desc&limit=1000`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const cronHistory = await cronHistoryRes.json();
    const failedJobs = cronHistory?.filter((log: any) => log.status === 'failed') || [];
    
    // Calculate uptime percentage (last 24h) - only count actual failures, not 0 plays
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentLogs = cronHistory?.filter((log: any) => log.executed_at >= oneDayAgo) || [];
    const successCount = recentLogs.filter((log: any) => log.status === 'success').length;
    const failedCount = recentLogs.filter((log: any) => log.status === 'failed').length;
    const uptimePercentage = recentLogs.length > 0 ? (successCount / recentLogs.length * 100).toFixed(2) : "100";

    return NextResponse.json({
      status: "healthy",
      uptime: {
        percentage: parseFloat(uptimePercentage),
        last24h: recentLogs.length,
        successful: successCount,
        failed: recentLogs.length - successCount,
      },
      cron: {
        lastRun: lastCronRun || null,
        minutesSinceLastRun,
        status: failedCount > 0 ? "degraded" : (minutesSinceLastRun && minutesSinceLastRun > 10 ? "delayed" : "active"),
        history: cronHistory || [],
      },
      database: {
        totalPlays: totalData?.[0]?.count || 0,
        lastSnapshot: snapshot?.[0]?.snapshot_date || null,
      },
      recentRuns: groupedRuns.slice(0, 10),
      dailyUptime,
      failedJobs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ 
      status: "error",
      error: String(error) 
    }, { status: 500 });
  }
}
