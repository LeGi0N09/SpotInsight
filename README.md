# Spotify Analytics Dashboard

A personal Spotify analytics dashboard built with Next.js that visualizes your listening history, top artists, tracks, and genres.

## Features

- 📊 **Dashboard Overview**: KPIs showing total plays, top artists, tracks, and genres
- 🎵 **Top Tracks Page**: Detailed view of your most played songs with play counts
- 🎤 **Top Artists Page**: Your favorite artists with follower counts and popularity scores
- 🎸 **Top Genres Page**: Music genres you listen to most
- 💡 **Insights Page**: Personalized listening statistics (total hours, streaks, peak times, artist loyalty)
- 📜 **Activity Feed**: Recent 100 plays with time-ago format, grouped by date
- 🎧 **Now Playing Widget**: Real-time currently playing track with live progress bar
- 🤖 **Auto-Sync Background Job**: Cron job runs every 5 minutes to save plays automatically
- 📈 **Time-based Filtering**: View stats for All Time, Last 6 Months, or Last 4 Weeks
- 📥 **Import Data**: Upload Spotify extended streaming history for **accurate play counts**
- 🔄 **Sync Data**: Fetch latest rankings from Spotify API (updates every sync)
- 🎨 **Dark Theme**: Pure black design with smooth animations and custom scrollbar
- ⚡ **Real-time Notifications**: Custom on-screen sync status (no popups)

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **APIs**: Spotify Web API
- **Charts**: Recharts
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+
- Spotify Developer Account
- Supabase Account

## Setup Instructions

### 1. Clone Repository

```bash
git clone <repository-url>
cd spotify-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://127.0.0.1:3000/api/auth/callback`
4. Note your Client ID and Client Secret
5. Required scopes:
   - `user-read-private`
   - `user-read-email`
   - `user-read-recently-played`
   - `user-top-read`
   - `user-read-currently-playing` (for Now Playing widget)
   - `user-read-playback-state` (for Now Playing widget)

### 4. Get Spotify Tokens

Run the token generation script:

```bash
node test-token.js
```

Follow the authorization flow and copy the access and refresh tokens.

### 5. Supabase Setup

1. Create a new Supabase project
2. Run the schema from `supabase-schema.sql`:

```sql
-- Run the complete schema from supabase-schema.sql
-- Includes: plays, snapshots, track_map, user_profiles, materialized views, indexes
```

See `supabase-schema.sql` for full schema with:
- Plays table with UNIQUE constraint on (user_id, track_id, played_at)
- Snapshots table for API rankings
- Track_map for ID normalization
- User_profiles cache table
- Materialized views (monthly_stats, artist_stats)
- Performance indexes
- Listening streaks view

### 6. Environment Variables

Create `.env.local` file:

```env
# Spotify API
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/callback

# Personal Tokens (from test-token.js)
SPOTIFY_ACCESS_TOKEN=your_access_token
SPOTIFY_REFRESH_TOKEN=your_refresh_token

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Site URL
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/callback
NEXT_PUBLIC_SPOTIFY_SCOPES=user-read-private user-read-email user-read-recently-played user-top-read user-read-currently-playing user-read-playback-state

# Cron Secret (for auto-sync)
CRON_SECRET=your_random_secret_key
```

### 7. Run Development Server

```bash
npm run dev
```

Visit `http://127.0.0.1:3000`

## System Architecture

### Data Flow Overview

```
Spotify API → Auto-Sync Cron (every 5 min) → Supabase plays table → Dashboard UI
                                            ↓
                                    Now Playing Widget (display only)
```

**Key Principle:** 
- Cron job handles ALL database writes (from recently-played API with accurate timestamps)
- Now Playing widget only displays real-time playback (no database writes)
- This prevents duplicate entries while maintaining live UI updates

### Authentication Flow

1. User visits `/api/auth/login`
2. Redirects to Spotify authorization
3. Spotify redirects back to `/api/auth/callback`
4. Tokens stored in cookies (secure: false for dev, sameSite: lax)
5. Middleware protects routes by checking cookies

### Auto-Sync Background Job (Primary Data Source)

**Runs every 5 minutes via Vercel Cron**

1. Cron hits `/api/cron` with Bearer token authentication
2. Fetches last 10 recently-played tracks from Spotify API
3. Saves to `plays` table with:
   - Actual `played_at` timestamp from Spotify
   - `source='auto-sync'`
   - UNIQUE constraint prevents duplicates: (user_id, track_id, played_at)
4. Runs silently in background, no user interaction needed
5. Captures all plays even when dashboard is closed

**Why this works:**
- Spotify keeps last 50 tracks in recently-played history
- Cron runs every 5 minutes, fetches last 10
- Even if song completes between runs, it stays in history until pushed out by 50+ newer tracks
- No plays are missed

### Manual Data Sync Flow

1. Click "Sync Data" in sidebar
2. Shows custom notification (not alert popup)
3. Calls `/api/sync` endpoint
4. Fetches from Spotify API:
   - Top 50 artists (short/medium/long term)
   - Top 50 tracks (short/medium/long term)
   - Last 50 recently played tracks
5. Stores in Supabase:
   - **snapshots table**: New row with all rankings (history preserved)
   - **plays table**: Only new plays added (duplicates ignored via UNIQUE constraint)
6. Shows success notification with counts
7. Auto-reloads page after 2 seconds

**Important:** Sync does NOT delete old data. Snapshots accumulate, plays are deduplicated.

### Now Playing Widget Flow

1. Widget polls `/api/now-playing` every 5 seconds
2. API tries `currently-playing` endpoint first (requires new scopes)
3. Falls back to `recently-played` if not currently playing
4. Returns track data with progress information
5. Widget displays:
   - Album artwork
   - Track name and artist
   - Live progress bar (updates every 5 seconds)
   - Pulsing play icon when active
6. **Widget does NOT save to database** (prevents duplicates)
7. All database writes handled by cron job

### Import Flow (Required for Accurate Counts)

1. Request extended streaming history:
   - Go to Spotify Account > Privacy Settings
   - Request "Extended streaming history"
   - Wait 30 days for email with download link
2. Download JSON files (contains ALL your plays)
3. Go to `/import` page in dashboard
4. Upload JSON files (can upload multiple)
5. Backend parses and stores in `plays` table
6. Now you have **real play counts** instead of just rankings

**File Format:** `StreamingHistory_music_*.json`

### Insights Page Flow

1. Frontend calls `/api/insights`
2. Backend queries `plays` table and calculates:
   - **Total Listening Time**: Sum of ms_played converted to hours
   - **Current Streak**: Consecutive days with plays (uses listening_streaks view)
   - **Peak Listening Time**: Hour of day with most plays
   - **Artist Loyalty**: % of plays from top artist
   - **Active Days**: Total unique days with plays
3. Returns JSON with all metrics
4. Frontend displays in grid with Lucide icons

### Activity Feed Flow

1. Frontend calls `/api/plays`
2. Backend fetches last 100 plays ordered by played_at DESC
3. Returns array of plays with track metadata
4. Frontend groups by date and displays with time-ago format
5. Shows track name, artist, and relative time ("2m ago", "5h ago")

### Stats API Flow

1. Frontend calls `/api/stats?filter=alltime|year|month`
2. Backend queries latest snapshot from Supabase:
   - `alltime`: top_tracks_long, top_artists_long
   - `year`: top_tracks_medium, top_artists_medium
   - `month`: top_tracks_short, top_artists_short
3. Counts plays per track/artist from `plays` table
4. Shows real play counts (not just rankings)
5. Enriches with Spotify metadata (images, followers, popularity)
6. Returns formatted JSON

### Time Range Mapping

- **All Time** → `long_term` (several years)
- **Last 6 Months** → `medium_term` (~6 months)
- **Last 4 Weeks** → `short_term` (~4 weeks)

## Project Structure

```
spotify-frontend/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── callback/route.ts    # OAuth callback
│   │   │   └── login/route.ts       # OAuth initiation (with new scopes)
│   │   ├── cron/route.ts            # Auto-sync background job (every 5 min)
│   │   ├── import/route.ts          # Import streaming history
│   │   ├── insights/route.ts        # Calculate listening insights
│   │   ├── now-playing/route.ts     # Get currently playing track
│   │   ├── plays/route.ts           # Fetch recent plays for activity feed
│   │   ├── spotify/
│   │   │   ├── me/route.ts          # User profile
│   │   │   └── monthly/route.ts     # Monthly stats
│   │   ├── stats/route.ts           # Main stats endpoint
│   │   └── sync/route.ts            # Manual sync Spotify data
│   ├── activity/page.tsx            # Activity feed page (recent 100 plays)
│   ├── artists/page.tsx             # Top artists page
│   ├── genres/page.tsx              # Top genres page
│   ├── import/page.tsx              # Import data page
│   ├── insights/page.tsx            # Insights page (stats, streaks, loyalty)
│   ├── tracks/page.tsx              # Top tracks page
│   ├── globals.css                  # Global styles + animations + scrollbar
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Dashboard home
├── components/
│   ├── GenreTreemap.tsx             # Genre visualization
│   ├── KPI.tsx                      # KPI card component
│   ├── Leaderboard.tsx              # Top items list
│   ├── NowPlaying.tsx               # Now playing widget (display only)
│   ├── Sidebar.tsx                  # Navigation sidebar with icons
│   ├── TimeSeriesChart.tsx          # Chart component
│   └── Topbar.tsx                   # Top bar with filter
├── lib/
│   ├── mock-data.ts                 # Mock data for testing
│   └── spotify.ts                   # Spotify API client
├── scripts/
│   └── cleanup-duplicates.ts        # Remove duplicate plays
├── middleware.ts                    # Route protection
├── next.config.ts                   # Next.js config
├── supabase-cleanup.sql             # SQL to remove duplicates
├── supabase-schema.sql              # Full database schema
├── test-token.js                    # Token generator
└── vercel.json                      # Cron job configuration
```

## API Endpoints

### `/api/auth/login`
- Redirects to Spotify OAuth

### `/api/auth/callback`
- Handles OAuth callback
- Sets cookies with tokens

### `/api/sync`
- Fetches data from Spotify API
- Stores in Supabase
- Returns snapshot data

### `/api/stats?filter=alltime|year|month`
- Returns top tracks, artists, genres
- Filtered by time range

### `/api/import`
- POST endpoint
- Accepts JSON streaming history
- Stores in plays table

### `/api/cron`
- GET endpoint (protected by CRON_SECRET)
- Runs every 5 minutes via Vercel Cron
- Fetches last 10 recently-played tracks
- Saves to database with source='auto-sync'
- Returns success status

### `/api/now-playing`
- GET endpoint
- Returns currently playing track with progress
- Falls back to recently-played if nothing playing
- Used by Now Playing widget

### `/api/insights`
- GET endpoint
- Calculates listening insights from plays table
- Returns total hours, streak, peak time, loyalty, active days

### `/api/plays`
- GET endpoint
- Returns last 100 plays ordered by played_at
- Used by activity feed

### `/api/spotify/me`
- Returns user profile

### `/api/spotify/monthly`
- Returns monthly listening stats

## Database Schema

### `snapshots` Table
**Purpose:** Store Spotify API rankings snapshots

**Behavior:**
- New row created on each sync (history preserved)
- Contains top 50 artists/tracks for 3 time ranges
- Stats API uses latest snapshot only
- Old snapshots remain for historical analysis

**Columns:**
- `top_artists_short/medium/long`: JSONB arrays
- `top_tracks_short/medium/long`: JSONB arrays
- `recently_played`: Last 50 plays
- `synced_at`: Timestamp

### `plays` Table
**Purpose:** Store individual play records for accurate counts

**Behavior:**
- Populated by auto-sync cron job (every 5 minutes)
- Can also import streaming history for historical data
- UNIQUE constraint on `(user_id, track_id, played_at)` prevents duplicates
- Never deleted, only grows
- Indexed on user_id, track_id, played_at for performance

**Columns:**
- `track_id`: Spotify track ID
- `track_name`: Track name
- `artist_name`: Artist name
- `played_at`: Exact timestamp of play (from Spotify API)
- `ms_played`: Duration in milliseconds
- `source`: 'auto-sync', 'import', 'sync', or 'widget'
- `raw_json`: Full track metadata

**Key Insight:** This table is the source of truth for play counts.

### Materialized Views

**monthly_stats**: Aggregated plays by month
**artist_stats**: Aggregated plays by artist
**listening_streaks**: Consecutive days with plays

**Refresh:** Call `SELECT refresh_stats_views();` to update

### `track_map` Table
**Purpose:** Normalize track IDs (handle duplicates/variations)

### `user_profiles` Table
**Purpose:** Cache user profile data for performance

## Key Features Explained

### Auto-Sync Background Job

**How It Works:**
- Vercel Cron runs `/api/cron` every 5 minutes
- Fetches last 10 recently-played tracks from Spotify
- Saves to database with actual `played_at` timestamps
- UNIQUE constraint prevents duplicates
- Runs even when dashboard is closed

**Why 5 Minutes?**
- Spotify keeps last 50 tracks in recently-played history
- Average song is 3-4 minutes
- Fetching every 5 minutes ensures no plays are missed
- Even if you listen to 10 songs in 5 minutes, they're all captured

**Data Accuracy:**
- Uses Spotify's actual `played_at` timestamp (not current time)
- Prevents duplicates via database constraint
- Captures all plays automatically

### Now Playing Widget

**Display Only - No Database Writes:**
- Polls `/api/now-playing` every 5 seconds for smooth progress bar
- Shows currently playing track with live progress
- Pulsing play icon when active
- Album artwork and track info
- **Does NOT save to database** (prevents duplicates)
- All saves handled by cron job

### Import Historical Data (Optional)

**For Historical Analysis:**
- Request extended streaming history from Spotify (30-day wait)
- Import via `/import` page
- Fills in plays before auto-sync was enabled
- One-time import, not needed regularly

### Why 127.0.0.1 Instead of localhost?
Spotify's new policy requires loopback IP addresses (127.0.0.1) instead of localhost for redirect URIs.

### How Are Play Counts Calculated?

**WITHOUT Imported Data:**
- Shows **rankings only** (e.g., "Rank #1", "Rank #2")
- Spotify API provides top 50 tracks/artists based on listening affinity
- No actual play count numbers available

**WITH Imported Data:**
- Shows **real play counts** (e.g., "247 plays")
- Imported streaming history contains every single play
- Stats API counts plays per track/artist from database
- 100% accurate historical data

### Time Filter Implementation
- Filter dropdown in topbar
- Changes API query parameter
- Fetches different time range data from Supabase
- Updates all dashboard components

## Data Accuracy Guide

### What's Accurate Without Import
✅ Artist/track rankings (Spotify's algorithm)
✅ Follower counts
✅ Popularity scores
✅ Genre classifications
✅ Album artwork
✅ Time-based filtering (short/medium/long term)

### What's NOT Accurate Without Import
❌ Play counts (shows null or rank instead)
❌ Total listening time
❌ Historical trends
❌ Exact play timestamps

### After Importing Streaming History
✅ **Everything above PLUS:**
✅ Real play counts per track/artist
✅ Complete listening history
✅ Accurate total plays
✅ Play timestamps
✅ Monthly/yearly trends

## Customization

### Change Theme Colors
Edit `app/globals.css` and component files:
- Background: `#000000` (pure black)
- Cards: `#111111`, `#0e0e0e`
- Accent: `#00e461` (Spotify green)
- Scrollbar: `#2a2a2a`

### Add More Stats
1. Modify `/api/stats` to include new data
2. Update frontend components to display
3. Add new KPI cards or sections

### Change Time Ranges
Edit filter options in `components/Topbar.tsx` and update API logic in `/api/stats`.

### Adjust Auto-Sync Frequency
Edit `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron",
    "schedule": "*/5 * * * *"  // Every 5 minutes (current)
    // "schedule": "*/10 * * * *"  // Every 10 minutes
    // "schedule": "0 * * * *"     // Every hour
  }]
}
```

**Note:** More frequent = better accuracy, but uses more API calls

## Troubleshooting

### "Module not found: lucide-react"
```bash
npm install lucide-react
```

### "Cross origin request detected"
Add to `next.config.ts`:
```js
experimental: {
  allowedDevOrigins: ['http://127.0.0.1:3000'],
}
```

### No Data Showing
1. Click "Sync Data" in sidebar (or visit `/api/sync`)
2. Check Supabase `snapshots` table has data
3. Verify tokens in `.env.local` are valid
4. Check browser console for errors

### Token Expired
1. Run `node test-token.js` to get fresh tokens
2. Update `SPOTIFY_ACCESS_TOKEN` and `SPOTIFY_REFRESH_TOKEN` in `.env.local`
3. Restart dev server

### Now Playing Widget Not Working
1. Check if you have new scopes: `user-read-currently-playing` and `user-read-playback-state`
2. Re-authorize by visiting `/api/auth/login` to get new tokens with updated scopes
3. Verify tokens in `.env.local` include new scopes

### Duplicate Plays in Database
1. Run `supabase-cleanup.sql` in Supabase SQL Editor
2. Removes duplicates within 5-minute windows
3. Keeps only most recent play per track per window
4. Check that cron job is NOT saving currently-playing (only recently-played)

### Auto-Sync Not Running
1. Verify `CRON_SECRET` is set in environment variables
2. Check Vercel deployment logs for cron execution
3. Ensure `/api/cron` endpoint is accessible
4. Verify Supabase credentials are correct

### Play Counts Not Updating
1. Check if auto-sync cron is running (Vercel logs)
2. Verify plays are being added to database (Supabase dashboard)
3. Check for duplicate prevention (UNIQUE constraint)
4. Ensure Spotify tokens are valid and have correct scopes

## Performance Tips

1. **Auto-sync handles play tracking** - no manual intervention needed
2. **Manual sync** only for updating rankings (optional)
3. **Import once** for historical data (optional)
4. **Use time filters** to reduce data load
5. **Materialized views** for faster queries (refresh periodically)

## Known Limitations

1. **Spotify API rate limits**: 50 requests per hour (auto-sync uses ~12/hour)
2. **Recent plays limit**: API returns max 50 plays (cron fetches 10 every 5 min)
3. **Streaming history delay**: Takes 30 days to receive from Spotify (optional)
4. **Cron job dependency**: Requires Vercel deployment for auto-sync
5. **Personal use only**: Not designed for multi-user
6. **Progress bar accuracy**: Updates every 5 seconds (not real-time millisecond precision)

## FAQ

**Q: How does auto-sync work?**
A: Cron job runs every 5 minutes, fetches last 10 recently-played tracks, saves to database with actual timestamps. Runs even when dashboard is closed.

**Q: Will I miss plays between cron runs?**
A: No. Spotify keeps last 50 tracks in history. Even if you listen to 10 songs in 5 minutes, they're all captured in the next run.

**Q: Why doesn't Now Playing widget save to database?**
A: To prevent duplicates. Widget polls every 5 seconds for smooth UI, but cron job handles all database writes with accurate timestamps.

**Q: How often should I manually sync?**
A: Not needed if auto-sync is enabled. Manual sync is for updating rankings (top artists/tracks), not play counts.

**Q: Will sync delete my old data?**
A: No. Snapshots accumulate, plays are deduplicated. Nothing is deleted.

**Q: Can I use localhost instead of 127.0.0.1?**
A: No. Spotify's new policy requires loopback IP (127.0.0.1) for redirect URIs.

**Q: Do I need to import streaming history?**
A: Optional. Auto-sync captures all plays going forward. Import is only for historical data before auto-sync was enabled.

**Q: What's the difference between sync and auto-sync?**
A: Manual sync updates rankings (top artists/tracks). Auto-sync runs in background every 5 minutes to save plays. Both use Spotify API.

## License

MIT

## Credits

Built with ❤️ using Spotify Web API

## Support

For issues or questions:
1. Check troubleshooting section
2. Verify environment variables
3. Check browser console for errors
4. Ensure Spotify tokens are valid
