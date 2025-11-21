import { NextResponse } from "next/server";

export const revalidate = 30;

// ─────────────── TYPES ─────────────── //

interface PlayRow {
  played_at: string | null;
  created_at: string;
  source: string | null;
}

interface SnapshotRow {
  snapshot_date: string;
}

interface CronLog {
  executed_at: string;
  status: "success" | "failed";
  plays_saved?: number | null;
}

interface CronHistoryRow extends CronLog {
  id: string;
  error_message?: string | null;
}

interface RecentRun {
  timestamp: string;
  saved: number;
  success: boolean;
}

interface DailyUptimeValue {
  total: number;
  success: number;
  failed: number;
  plays: number;
}

type DailyUptimeMap = Record<string, DailyUptimeValue>;

// ─────────────── HANDLER ─────────────── //

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  try {
    // ───── Fetch Everything in Parallel (super fast) ───── //
    const [
      lastPlayRes,
      totalRes,
      snapshotRes,
      recentRunsRes,
      cronLogsRes,
      cronHistoryRes,
    ] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/plays?select=played_at,created_at,source&order=created_at.desc&limit=1`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/plays?select=count`, { headers: { ...headers, Prefer: "count=exact" } }),
      fetch(`${supabaseUrl}/rest/v1/snapshots?select=snapshot_date&order=snapshot_date.desc&limit=1`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/plays?select=created_at,source&source=eq.auto-sync&order=created_at.desc&limit=10`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/cron_logs?select=executed_at,status,plays_saved&order=executed_at.desc&limit=2000`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/cron_logs?select=*&order=executed_at.desc&limit=1000`, { headers }),
    ]);

    const [lastPlay, totalData, snapshot, recentRuns, cronLogs, cronHistory] =
      await Promise.all([
        lastPlayRes.json(),
        totalRes.json(),
        snapshotRes.json(),
        recentRunsRes.json(),
        cronLogsRes.json(),
        cronHistoryRes.json(),
      ]);

    const last = (lastPlay as PlayRow[])[0] ?? null;
    const totalPlays = totalData?.[0]?.count ?? 0;

    // ─────────────── Last Cron Run ─────────────── //
    const lastCronRun = last?.created_at ?? null;
    const minutesSinceLastRun = lastCronRun
      ? Math.floor((Date.now() - new Date(lastCronRun).getTime()) / 60000)
      : null;

    // ─────────────── Group recent runs ─────────────── //
    const groupedRuns: RecentRun[] = [];
    (recentRuns as PlayRow[]).forEach((play) => {
      const minuteStamp = new Date(play.created_at).toISOString().slice(0, 16);
      const group = groupedRuns.find((r) => r.timestamp.startsWith(minuteStamp));


      if (group) {
        group.saved++;
      } else {
        groupedRuns.push({
          timestamp: play.created_at,
          saved: 1,
          success: true,
        });
      }
    });

    // ─────────────── 30-Day Uptime Grouping ─────────────── //
    const dailyUptime: DailyUptimeMap = {};

    (cronLogs as CronLog[]).forEach((log) => {
      const date = log.executed_at.split("T")[0];

      const day = (dailyUptime[date] ??= {
        total: 0,
        success: 0,
        failed: 0,
        plays: 0,
      });

      day.total++;
      if (log.status === "success") {
        day.success++;
        day.plays += log.plays_saved ?? 0;
      } else {
        day.failed++;
      }
    });

    // ─────────────── 24 Hour Uptime ─────────────── //
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const last24h = (cronHistory as CronHistoryRow[]).filter(
      (log) => log.executed_at >= oneDayAgo
    );

    const successCount = last24h.filter((l) => l.status === "success").length;
    const failedCount = last24h.filter((l) => l.status === "failed").length;

    const uptimePercentage =
      last24h.length > 0
        ? parseFloat(((successCount / last24h.length) * 100).toFixed(2))
        : 100;

    return NextResponse.json({
      status: "healthy",
      uptime: {
        percentage: uptimePercentage,
        last24h: last24h.length,
        successful: successCount,
        failed: failedCount,
      },
      cron: {
        lastRun: lastCronRun,
        minutesSinceLastRun,
        status:
          failedCount > 0
            ? "degraded"
            : minutesSinceLastRun && minutesSinceLastRun > 10
            ? "delayed"
            : "active",
        history: cronHistory as CronHistoryRow[],
      },
      database: {
        totalPlays,
        lastSnapshot: (snapshot as SnapshotRow[])?.[0]?.snapshot_date ?? null,
      },
      recentRuns: groupedRuns.slice(0, 10),
      dailyUptime,
      failedJobs: (cronHistory as CronHistoryRow[]).filter(
        (l) => l.status === "failed"
      ),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", error: String(err) },
      { status: 500 }
    );
  }
}
