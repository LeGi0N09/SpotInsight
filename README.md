# Spotify Analytics Dashboard

A simple, fast Spotify listening analytics app. Track your top artists, tracks, and genres.

## Quick Start (2 minutes)

### 1. Install & Run

```bash
npm install
npm run dev
```

### 2. Open Dashboard

Visit `http://localhost:3000`

- See your **top artists**, **top tracks**, **top genres**
- All-time statistics

### 3. Monitor Syncing

Go to `/status` page

- Click **"Sync Now"** to fetch latest plays
- View sync history and errors
- Auto-refresh every 5 seconds

---

## Setup

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
SPOTIFY_CLIENT_ID=your_spotify_id
SPOTIFY_CLIENT_SECRET=your_spotify_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

### Auto-Sync Options

**Option A: Vercel (Recommended)**

- Deploy to Vercel
- Cron job runs automatically every hour
- Check `/status` for sync history

**Option B: External Cron Service**

- Call this endpoint every 15-30 minutes:

```
POST https://your-domain.com/api/sync
```

**Option C: Manual Only**

- Use "Sync Now" button on `/status` page anytime

---

## Pages

| Page        | Path      | Purpose                   |
| ----------- | --------- | ------------------------- |
| Dashboard   | `/`       | View your stats           |
| Sync Status | `/status` | Monitor & control syncing |

---

## Features

✅ **Fast** - Loads in 2-3 seconds  
✅ **Simple** - Clean, minimal UI  
✅ **Accurate** - All your listening history (no 1000-limit bug)  
✅ **Reliable** - Error logging built-in  
✅ **Observable** - See sync status anytime  
✅ **Flexible** - Multiple sync options

---

## How Data Syncing Works

1. **Sync Frequency**: Every 15-30 minutes (configurable)
2. **Per Sync**: Fetches your last 50 plays from Spotify
3. **Storage**: Saved to Supabase with no duplicates
4. **Accuracy**: Over 1 month = ~4,800-14,400 plays tracked (very accurate)
5. **Query Limit**: Fixed - uses safe pagination (LIMIT 1000)

---

## Troubleshooting

**Dashboard is slow?**

- Go to `/status`
- Click "Sync Now"
- Refresh page after 5 seconds

**No data showing?**

- Check `/status` page for last sync time
- Verify credentials in `.env.local`
- Click "Sync Now" and wait 2-5 seconds

**Cron job not running?**

- Check `/status` for error logs
- For Vercel: check deployment logs
- For external service: verify endpoint is reachable

---

## Project Structure

```
├── app/
│   ├── page.tsx           # Dashboard
│   ├── status/page.tsx    # Monitoring & control
│   └── api/
│       ├── stats/         # Get statistics
│       ├── sync/          # Trigger sync
│       ├── health/        # Health check
│       └── spotify/me     # Get user profile
├── components/
│   ├── Sidebar.tsx
│   └── Topbar.tsx
├── lib/
│   ├── db.ts              # Supabase helpers
│   └── spotify.ts         # Spotify API client
└── .env.local             # Credentials
```

---

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Database**: Supabase (PostgreSQL)
- **API**: Spotify Web API
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (optional)

---

## What's Different from Stock Spotify Apps

- **No OAuth Required** - Uses Spotify refresh token directly
- **Lightweight** - No heavy dependencies
- **Privacy First** - All data stays in your Supabase
- **Accurate** - Fixed Supabase 1000-limit issue
- **Fast** - 2-3 second page loads
- **Simple** - Only 2 pages, zero bloat

---

## Tips

- Run sync every **15-30 minutes** for best accuracy
- Check `/status` before reporting issues
- Export your plays regularly if you want backups
- Artists/tracks data updates weekly via Spotify snapshots

---

**Ready?** Start with `npm run dev`
