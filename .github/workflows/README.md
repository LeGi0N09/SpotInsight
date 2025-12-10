# GitHub Actions Setup

## Overview

Two GitHub Actions keep your Spotify data synced - completely free!

1. **sync-plays.yml** - Every 10 minutes
2. **sync-artists.yml** - Weekly (Sundays at 3 AM UTC)

## Setup

### 1. Add Secret to GitHub

Go to your repo: **Settings → Secrets and variables → Actions → New repository secret**

Add:
- **Name**: `APP_URL`
- **Value**: `https://your-app.vercel.app` (your deployed Vercel URL)

### 2. Enable Actions

Go to: **Actions** tab → Enable workflows

### 3. Manual Trigger (Optional)

Go to: **Actions** → Select workflow → **Run workflow**

## How It Works

GitHub Actions call your deployed API endpoints:
- `/api/cron` - Syncs recent plays
- `/api/sync-artists` - Updates artist metadata

## Benefits vs Vercel Cron

✅ **Free** - Unlimited GitHub Actions minutes for public repos
✅ **Frequent** - Every 10 minutes (vs 6 hours on Vercel Hobby)
✅ **Reliable** - Exact timing guaranteed
✅ **No limits** - Not restricted by Vercel plan

## Monitoring

Check workflow runs: **Actions** tab in your GitHub repo

## Troubleshooting

**Workflow failing?**
- Verify `APP_URL` secret is set correctly
- Check your app is deployed and accessible
- View logs in Actions tab
