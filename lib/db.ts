const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  "Content-Type": "application/json",
};

export const db = {
  plays: {
    insert: async (plays: Record<string, unknown>[]) => {
      const res = await fetch(`${supabaseUrl}/rest/v1/plays`, {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=ignore-duplicates" },
        body: JSON.stringify(plays),
      });
      return res.ok;
    },
  },

  cronLogs: {
    insert: async (log: {
      job_name: string;
      status: string;
      plays_saved?: number;
      duration_ms?: number;
      error_message?: string;
      executed_at?: string;
    }) => {
      const res = await fetch(`${supabaseUrl}/rest/v1/cron_logs`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify(log),
      });
      return res.ok;
    },
  },

  snapshots: {
    insert: async (snapshot: Record<string, unknown>) => {
      const res = await fetch(`${supabaseUrl}/rest/v1/snapshots`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify(snapshot),
      });
      return res.ok;
    },
  },
};
