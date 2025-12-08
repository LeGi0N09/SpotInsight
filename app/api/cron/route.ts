import { NextResponse } from "next/server";
import { spotifyFetch } from "../../lib/spotify";
import { db } from "../../../lib/db";
import { monitor } from "../../../lib/monitoring";
import crypto from "crypto";

type SpotifyTrack = {
  id: string;
  name: string;
  duration_ms: number;
  artists: { name: string }[];
};

type SpotifyPlayItem = {
  track: SpotifyTrack;
  played_at: string;
};

const lastCronRun: { timestamp: number } = { timestamp: 0 };

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');
    
    if (!providedSecret || !process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const expectedHash = crypto.createHash('sha256').update(process.env.CRON_SECRET).digest('hex');
    const providedHash = crypto.createHash('sha256').update(providedSecret).digest('hex');
    
    if (expectedHash !== providedHash) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Rate limiting: max once per minute
    if (Date.now() - lastCronRun.timestamp < 60000) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }
    lastCronRun.timestamp = Date.now();
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  const startTime = Date.now();
  
  try {
    const lastPlayedAt = await db.plays.getLastPlayed();

    const url = lastPlayedAt
      ? `/me/player/recently-played?limit=50&after=${new Date(lastPlayedAt).getTime()}`
      : `/me/player/recently-played?limit=50`;
    
    const recentRes = await spotifyFetch(url);
    let savedCount = 0;
    let skippedCount = 0;
    
    if (recentRes.ok) {
      const text = await recentRes.text();
      if (!text || text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        throw new Error('Spotify API returned HTML instead of JSON');
      }
      const recent = JSON.parse(text);
      
      if (recent.items) {
        const newPlays = recent.items;
        skippedCount = 0;

        if (newPlays.length > 0) {
          const validPlays = (newPlays as SpotifyPlayItem[])
            .filter((item) => {
              if (!item.track || !item.played_at) return false;
              if (!item.track.id || !item.track.name) return false;
              if (!item.track.duration_ms || item.track.duration_ms <= 0) return false;
              if (!item.track.artists?.[0]?.name) return false;
              return true;
            })
            .map((item) => ({
              user_id: 'default_user',
              track_id: item.track.id.trim(),
              track_name: item.track.name.trim(),
              artist_name: item.track.artists[0].name.trim(),
              album_image: (item as any).track?.album?.images?.[0]?.url || null,
              duration_ms: item.track.duration_ms,
              played_at: item.played_at,
              ms_played: Math.min(item.track.duration_ms, 3600000),
              source: 'auto-sync',
              raw_json: item,
            }));

          if (validPlays.length > 0) {
            const uniquePlays = validPlays.filter((play, index, self) =>
              index === self.findIndex(p => 
                p.track_id === play.track_id && p.played_at === play.played_at
              )
            );
            
            try {
              const inserted = await db.plays.insert(uniquePlays);
              savedCount = Array.isArray(inserted) ? inserted.length : 0;
            } catch (error) {
              const errorMsg = String(error);
              if (errorMsg.includes('duplicate key')) {
                savedCount = 0;
              } else {
                throw error;
              }
            }
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    
    // Sync artist metadata if new plays were saved
    let artistsSynced = 0;
    if (savedCount > 0) {
      try {
        const artistSyncRes = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/sync-artists`, {
          method: 'POST',
        });
        if (artistSyncRes.ok) {
          const artistData = await artistSyncRes.json();
          artistsSynced = artistData.synced || 0;
        }
      } catch (err) {
        console.error('Artist sync failed:', err);
      }
    }
    
    await db.cronLogs.insert({
      job_name: 'auto-sync',
      status: 'success',
      plays_saved: savedCount,
      duration_ms: duration,
      response_data: { saved: savedCount, skipped: skippedCount, artistsSynced },
    });

    monitor.track({
      type: 'cron_job',
      name: 'auto-sync',
      duration,
      success: true,
    });

    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      saved: savedCount,
      skipped: skippedCount,
      artistsSynced,
      duration: duration,
      lastPlayedAt: lastPlayedAt || null,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    await db.cronLogs.insert({
      job_name: 'auto-sync',
      status: 'failed',
      duration_ms: duration,
      error_message: errorMsg,
    }).catch(() => {});

    monitor.track({
      type: 'cron_job',
      name: 'auto-sync',
      duration,
      success: false,
      error: errorMsg,
    });

    return NextResponse.json({ 
      success: false,
      error: errorMsg,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  }
}
