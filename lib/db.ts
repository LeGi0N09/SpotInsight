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

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[db.plays.insert] Failed:", res.status, errorText);
        throw new Error(`Database insert failed: ${res.status} - ${errorText}`);
      }

      return res.ok;
    },

    getLatestByTrackId: async (trackId: string, limit: number = 1) => {
      const encodedTrackId = encodeURIComponent(trackId);
      const res = await fetch(
        `${supabaseUrl}/rest/v1/plays?track_id=eq.${encodedTrackId}&order=played_at.desc&limit=${limit}`,
        {
          method: "GET",
          headers,
        }
      );
      return res.ok ? await res.json() : [];
    },

    getLatest: async (limit: number = 50) => {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/plays?order=played_at.desc&limit=${limit}`,
        {
          method: "GET",
          headers,
        }
      );
      return res.ok ? await res.json() : [];
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
