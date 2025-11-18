# 🎵 Spotify Analytics Dashboard

Modern, real-time Spotify analytics dashboard built with Next.js 15 that automatically tracks and visualizes your listening history.

## ✨ Features

- **📊 Real-time Dashboard** - Live KPIs, monthly charts, and top artists
- **🎧 Now Playing Widget** - Real-time playback with smooth progress bar
- **🤖 Auto-Sync** - Background cron job saves plays every 5 minutes
- **💡 Smart Insights** - Listening time, streaks, peak hours, skip rate, loyalty
- **📜 Activity Feed** - Recent 100 plays with time-ago format
- **🏥 Health Monitoring** - System uptime, cron status, performance metrics
- **⚡ Optimized Performance** - Static generation, skeleton loaders, optimistic UI
- **🎨 Beautiful UI** - Dark theme, responsive design, smooth animations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Spotify Developer Account
- Supabase Account

### 1. Install
```bash
cd spotify-frontend
npm install
```

### 2. Spotify Setup
1. Create app at [Spotify Dashboard](https://developer.spotify.com/dashboard)
2. Add redirect: `http://127.0.0.1:3000/api/auth/callback`
3. Run `node test-token.js` to get refresh token

### 3. Database Setup
1. Create [Supabase](https://supabase.com) project
2. Run SQL files in order:
   - `supabase-schema.sql`
   - `supabase-health-system.sql`
   - `supabase-indexes.sql`
   - `supabase-migration.sql` (if upgrading)

### 4. Environment Variables
Create `.env.local`:
```env
# Spotify (no access token needed - auto-refreshes)
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/callback
SPOTIFY_REFRESH_TOKEN=your_refresh_token

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# App
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
CRON_SECRET=your_random_secret
```

### 5. Run
```bash
npm run dev
```
Visit `http://127.0.0.1:3000`

### 6. Local Cron (Development)
```bash
npm run cron
```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **API**: Spotify Web API
- **Icons**: Lucide React

### Key Features

**Auto-Sync System**
- Runs every 5 minutes via Vercel Cron
- Uses Spotify's `after` parameter for efficiency
- Fetches up to 50 new tracks per run
- In-memory deduplication before DB insert
- Logs all executions to `cron_logs` table

**Token Management**
- Access tokens auto-refresh (50-min cache)
- SHA256 hashed CRON_SECRET
- Rate limiting (1 req/min)
- Monitoring with alerts

**Performance Optimizations**
- Static generation with revalidation (60s-300s)
- Database abstraction layer (`lib/db.ts`)
- Composite indexes for fast queries
- Skeleton loaders for instant perceived performance
- Optimistic UI updates

**Monitoring & Alerts**
- Performance tracking (API, DB, cron, tokens)
- Auto-alerts on failures
- Success rate tracking
- `/api/monitoring` endpoint

## 📁 Project Structure

```
app/
├── api/
│   ├── cron/          # Auto-sync job
│   ├── health/        # System health
│   ├── insights/      # Listening insights
│   ├── monitoring/    # Performance stats
│   ├── now-playing/   # Current playback
│   ├── plays/         # Recent plays
│   ├── stats/         # Top tracks/artists
│   └── sync/          # Manual sync
├── activity/          # Activity feed
├── artists/           # Top artists
├── health/            # Health monitor
├── insights/          # Insights page
├── tracks/            # Top tracks
└── lib/
    ├── spotify.ts     # Spotify API client
    └── time.ts        # IST utilities
components/
├── NowPlaying.tsx     # Real-time widget
├── Sidebar.tsx        # Navigation
├── Skeleton.tsx       # Loading states
└── Topbar.tsx         # Filter bar
lib/
├── db.ts              # Database layer
└── monitoring.ts      # Performance tracking
```

## 🔒 Security

- ✅ Auto-refreshing tokens (never stored)
- ✅ SHA256 hashed secrets
- ✅ Rate limiting on cron endpoint
- ✅ Service key backend-only
- ✅ Input validation on all endpoints
- ✅ Monitoring with auto-alerts

## 📊 Database

**Tables**
- `plays` - Individual play records (UNIQUE: user_id, track_id, played_at)
- `snapshots` - Spotify rankings snapshots
- `cron_logs` - Job execution history
- `system_health` - API monitoring

**Views**
- `monthly_stats` - Aggregated monthly data
- `artist_stats` - Artist play counts
- `listening_streaks` - Consecutive listening days
- `cron_uptime` - Daily uptime percentages

**Indexes**
- `idx_plays_user_played_at` - Fast user queries
- `idx_plays_track_id` - Track lookups
- `idx_cron_logs_executed_at` - Recent jobs

## 🎯 Key Endpoints

| Endpoint | Cache | Purpose |
|----------|-------|---------|
| `/api/cron` | - | Auto-sync (protected) |
| `/api/stats` | 60s | Top tracks/artists |
| `/api/insights` | 120s | Listening insights |
| `/api/health` | 30s | System health |
| `/api/monitoring` | 0s | Performance stats |
| `/api/now-playing` | - | Current playback |

## 🐛 Troubleshooting

**No data showing?**
- Click "Sync Data" in sidebar
- Check tokens are valid
- Verify Supabase connection

**Cron not working?**
- Check `/health` page
- Verify `CRON_SECRET` is set
- Run `supabase-migration.sql` if upgrading

**Token errors?**
- Run `node test-token.js`
- Update `SPOTIFY_REFRESH_TOKEN`
- Restart dev server

## 📈 Performance

- **First Load**: ~1-2s (with skeleton loaders)
- **Cached Pages**: <100ms (static generation)
- **API Response**: ~50-200ms (with indexes)
- **Cron Job**: ~500-1500ms per run
- **Database Queries**: <50ms (optimized)

## 🚀 Production Deployment

1. Deploy to Vercel
2. Add environment variables
3. Cron runs automatically (no setup needed)
4. Monitor via `/health` page
5. Check `/api/monitoring` for performance

## 📝 Notes

- Use `127.0.0.1` not `localhost` (Spotify requirement)
- Play counts only show if > 0
- All timestamps display in IST
- Health page shows last 7 days uptime
- Cron frequency: Edit `vercel.json`

## 🎁 Future Improvements

See `IMPROVEMENTS.md` for:
- Energy/mood graphs
- Listening clusters
- Music compatibility
- Table partitioning (1M+ rows)
- Advanced analytics

## 📄 License

MIT

---

**Built with ❤️ using Spotify Web API**
