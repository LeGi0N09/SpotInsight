# Security Guidelines

## Environment Variables

**NEVER commit these files:**
- `.env`
- `.env.local`
- `.env.production`
- Any file containing API keys or secrets

**Always use:**
- `.env.example` for documentation
- GitHub Secrets for Actions
- Vercel Environment Variables for deployment

## Required Secrets

### Local Development
Copy `.env.example` to `.env.local` and fill in:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `CRON_SECRET`

### GitHub Actions
Add to: **Settings → Secrets and variables → Actions**
- `APP_URL` - Your deployed app URL

### Vercel Deployment
Add to: **Project Settings → Environment Variables**
- All variables from `.env.example`

## Security Checklist

✅ `.env*` files in `.gitignore`
✅ No hardcoded credentials in code
✅ API routes validate requests
✅ Cron endpoints check `CRON_SECRET` in production
✅ Supabase RLS policies enabled
✅ GitHub repo secrets configured

## What's Safe to Commit

✅ Source code
✅ Configuration files (without secrets)
✅ `.env.example` (template only)
✅ Documentation
✅ SQL schema files

## What's NOT Safe to Commit

❌ `.env` files
❌ API keys
❌ Database credentials
❌ OAuth tokens
❌ Private keys
❌ Passwords

## Reporting Security Issues

If you find a security vulnerability, please email: [your-email]
Do NOT create a public GitHub issue.
