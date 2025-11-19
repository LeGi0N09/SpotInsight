const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  "Content-Type": "application/json",
};

export const db = {
  plays: {
    getRecent: async (limit: number = 100) => {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/plays?select=*&order=played_at.desc&limit=${limit}`,
        { headers }
      );
      return res.json();
    },

    getLastPlayed: async () => {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/plays?select=played_at&order=played_at.desc&limit=1`,
        { headers }
      );
      const data = await res.json();
      return data?.[0]?.played_at || null;
    },

    insert: async (plays: Record<string, unknown>[]) => {
      const res = await fetch(`${supabaseUrl}/rest/v1/plays`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(plays),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },

    count: async () => {
      const res = await fetch(`${supabaseUrl}/rest/v1/plays?select=count`, {
        headers: { ...headers, Prefer: "count=exact" },
      });
      const data = await res.json();
      return data?.[0]?.count || 0;
    },

    getAll: async () => {
      const res = await fetch(`${supabaseUrl}/rest/v1/plays?select=*&limit=100000`, { headers });
      return res.json();
    },
  },

  cronLogs: {
    insert: async (log: {
      job_name: string;
      status: string;
      plays_saved?: number;
      duration_ms?: number;
      error_message?: string;
      response_data?: Record<string, unknown>;
    }) => {
      const res = await fetch(`${supabaseUrl}/rest/v1/cron_logs`, {
        method: "POST",
        headers,
        body: JSON.stringify(log),
      });
      return res.ok;
    },

    getRecent: async (limit: number = 20) => {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/cron_logs?select=*&order=executed_at.desc&limit=${limit}`,
        { headers }
      );
      return res.json();
    },
  },

  snapshots: {
    getLatest: async () => {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/snapshots?select=*&order=synced_at.desc&limit=1`,
        { headers }
      );
      const data = await res.json();
      return data?.[0] || null;
    },

    insert: async (snapshot: Record<string, unknown>) => {
      const res = await fetch(`${supabaseUrl}/rest/v1/snapshots`, {
        method: "POST",
        headers,
        body: JSON.stringify(snapshot),
      });
      return res.ok;
    },
  },
};
