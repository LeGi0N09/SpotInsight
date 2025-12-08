# Cron Job Setup

## Overview

Two automated jobs keep your Spotify data fresh:

1. **Play History Sync** - Every 10 minutes
2. **Artist Metadata Sync** - Weekly (Sundays at 2 AM)

## Local Development

### Daily Play Sync (Every 10 minutes)
```bash
npm run cron
```
Runs in background, syncs recent plays from Spotify.

### Weekly Artist Sync (Manual)
```bash
npm run sync-artists
```
Takes 5-10 minutes, updates all artist metadata (followers, popularity, images).

## Production (Vercel)

Cron jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "*/10 * * * *"  // Every 10 minutes
    },
    {
      "path": "/api/sync-artists",
      "schedule": "0 2 * * 0"      // Sundays at 2 AM
    }
  ]
}
```

### Setup on Vercel:
1. Deploy your app to Vercel
2. Cron jobs auto-activate (Hobby plan: 1 cron, Pro: unlimited)
3. Set `CRON_SECRET` environment variable
4. Monitor at: https://vercel.com/[your-project]/settings/cron

## Manual Triggers

### Via Browser:
- Play sync: `http://localhost:3000/api/cron`
- Artist sync: `http://localhost:3000/api/sync-artists`

### Via Command:
```bash
# Sync plays
curl http://localhost:3000/api/cron

# Sync artists
curl -X POST http://localhost:3000/api/sync-artists
```

## How It Works

### Play History Sync (`/api/cron`)
1. Fetches last 50 plays from Spotify
2. Saves new plays to database
3. Automatically triggers artist metadata sync for new artists
4. Runs every 10 minutes

### Artist Metadata Sync (`/api/sync-artists`)
1. Checks existing cache (2,128+ artists)
2. Updates stale data (>7 days old)
3. Adds missing artists from plays table
4. Runs weekly to keep data fresh

## Monitoring

Check terminal logs for sync status:
```
🔄 Starting artist sync...
💾 Already cached: 2128 artists
⏰ 15 artists need refresh (>7 days old)
📊 Found 50 artists in snapshot
🎵 Found 2594 unique artists to sync

✅ Sync complete: 5 new, 15 updated, 2108 skipped
```

## Troubleshooting

**Cron not running?**
- Check `CRON_SECRET` is set
- Verify Vercel plan supports cron jobs
- Check logs in Vercel dashboard

**Artist metadata missing?**
- Run `npm run sync-artists` manually
- Check Spotify API rate limits
- Verify artist names match exactly

**Slow sync?**
- Normal for first run (2,594 artists × 200ms = ~8 min)
- Subsequent runs are fast (only updates stale data)
