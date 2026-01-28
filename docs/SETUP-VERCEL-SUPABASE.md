# Vercel + Supabase Setup Guide - 15 Minutes to Live

**Cost**: €0/month (FREE forever)
**Time**: 15 minutes
**Difficulty**: Easy ⭐⭐☆☆☆

---

## What You'll Get

✅ Live website at `https://blackfire-service.vercel.app`
✅ PostgreSQL + TimescaleDB database (Supabase)
✅ Authentication system (Supabase Auth)
✅ Automatic SSL certificate
✅ Global CDN
✅ Automatic deployments from Git
✅ Professional infrastructure
✅ Zero monthly costs

---

## Prerequisites

- GitHub account
- 15 minutes of time
- That's it! No credit card needed for free tiers

---

## Step 1: Supabase Setup (5 minutes)

### 1.1 Create Supabase Account

1. Go to https://supabase.com
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email
4. Verify email if needed

### 1.2 Create New Project

1. Click **"New Project"**
2. Fill in details:
   - **Organization**: Create new or select existing
   - **Name**: `blackfire-service`
   - **Database Password**: Click "Generate a password" and **SAVE IT**
   - **Region**: Choose closest to your users (e.g., `Europe West (Frankfurt)`)
   - **Pricing Plan**: **Free** (already selected)

3. Click **"Create new project"**
4. Wait 2-3 minutes while Supabase provisions your database

### 1.3 Get API Keys

Once project is ready:

1. Click on **"Settings"** (gear icon in sidebar)
2. Click **"API"** in the left menu
3. Copy these values (you'll need them):

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANT**: Save these in a secure place!

### 1.4 Set Up Database Schema

1. In Supabase Dashboard, click **"SQL Editor"** in sidebar
2. Click **"New query"**
3. Copy the content from `supabase/migrations/20260128000001_initial_schema.sql`
4. Paste into SQL Editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)
6. Wait for confirmation: "Success. No rows returned"

✅ **Database is ready!**

---

## Step 2: GitHub Setup (2 minutes)

### 2.1 Create GitHub Repository

**If you haven't already:**

1. Go to https://github.com/new
2. Repository name: `blackfire-service`
3. Description: "Stock investment analysis platform"
4. Visibility: **Private** (recommended) or Public
5. Click **"Create repository"**

### 2.2 Push Your Code

```bash
# In your project directory
cd /Users/robin/Documents/4_AI/Blackfire_service

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Blackfire Service"

# Add remote (replace with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/blackfire-service.git

# Push to GitHub
git branch -M main
git push -u origin main
```

✅ **Code is on GitHub!**

---

## Step 3: Vercel Setup (5 minutes)

### 3.1 Create Vercel Account

1. Go to https://vercel.com/signup
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub

### 3.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. Find `blackfire-service` repository
3. Click **"Import"**

### 3.3 Configure Project

**Framework Preset**: Next.js (automatically detected)
**Root Directory**: `./` (leave default)
**Build Command**: `pnpm build` or leave default
**Output Directory**: Leave default

### 3.4 Add Environment Variables

Click **"Environment Variables"** and add these:

**Required Variables:**

```bash
# Supabase URLs and Keys (from Step 1.3)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stock Data API (Free - get from https://www.alphavantage.co/support/#api-key)
ALPHA_VANTAGE_API_KEY=demo

# App URL (will update after deployment)
NEXT_PUBLIC_APP_URL=https://blackfire-service.vercel.app
```

**Optional Variables (add later):**

```bash
# AI APIs (only if you want AI features)
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# OAuth (for Google/GitHub login)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_secret
```

### 3.5 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes while Vercel builds and deploys
3. You'll see: **"Congratulations! Your project has been deployed."**

✅ **You're LIVE!** 🎉

---

## Step 4: Get Free Alpha Vantage API Key (2 minutes)

1. Go to https://www.alphavantage.co/support/#api-key
2. Enter email and click **"GET FREE API KEY"**
3. Copy the API key
4. Go back to Vercel Dashboard
5. Project Settings → Environment Variables
6. Find `ALPHA_VANTAGE_API_KEY`
7. Edit and replace `demo` with your real key
8. Redeploy: Deployments → Click "..." → Redeploy

---

## Step 5: Verify Everything Works (1 minute)

### 5.1 Open Your Site

Click the **"Visit"** button in Vercel or go to:
```
https://blackfire-service.vercel.app
```

### 5.2 Test Health Endpoint

```bash
curl https://blackfire-service.vercel.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-28T...",
  "uptime": 123.45
}
```

### 5.3 Test Database Connection

1. Go to your site
2. Try to sign up (if auth page exists)
3. Or check Supabase Dashboard → Table Editor → Should see your tables

✅ **Everything works!**

---

## Step 6: Configure Custom Domain (Optional)

### 6.1 Add Domain in Vercel

1. In Vercel Dashboard → Project → Settings → Domains
2. Enter your domain: `blackfire-service.com`
3. Follow instructions to add DNS records

### 6.2 Update Environment Variable

```bash
NEXT_PUBLIC_APP_URL=https://blackfire-service.com
```

Redeploy after changing.

**Note**: Custom domains require Vercel Pro ($20/month) or you can use the free `.vercel.app` domain.

---

## Project Structure for Vercel

Your project is already configured correctly:

```
✅ next.config.ts - Configured for Vercel
✅ package.json - Scripts ready
✅ src/app/ - Next.js App Router
✅ src/lib/supabase/ - Supabase clients
✅ .gitignore - Excludes .env files
```

---

## Environment Variables Reference

### Required for Production

| Variable | Where to Get | Example |
|----------|--------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | `eyJhbGc...` |
| `ALPHA_VANTAGE_API_KEY` | https://www.alphavantage.co/support/#api-key | `YOUR_KEY` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL | `https://your-app.vercel.app` |

### Optional (Add When Needed)

| Variable | When to Add | Where to Get |
|----------|-------------|--------------|
| `OPENAI_API_KEY` | AI features | https://platform.openai.com/api-keys |
| `ANTHROPIC_API_KEY` | AI features | https://console.anthropic.com/ |
| `GOOGLE_CLIENT_ID` | Google OAuth | https://console.cloud.google.com/ |
| `GITHUB_CLIENT_ID` | GitHub OAuth | https://github.com/settings/developers |

---

## Automatic Deployments

Now configured! Every time you push to GitHub:

```bash
git add .
git commit -m "Add new feature"
git push

# Vercel automatically deploys in ~2 minutes
```

View deployments at: https://vercel.com/your-username/blackfire-service

---

## Free Tier Limits

### Vercel (Hobby Plan)

✅ **What's Included:**
- Unlimited deployments
- 100 GB bandwidth/month (~500K page views)
- 100 GB-hours serverless function execution
- 1000 image optimizations/month
- Automatic SSL
- Git integration
- Preview deployments

⚠️ **Limitations:**
- No custom domains (need Pro for $20/mo)
- "Powered by Vercel" badge
- 10 second serverless function timeout

### Supabase (Free Plan)

✅ **What's Included:**
- 500 MB database storage
- 2 GB file storage
- 50,000 monthly active users
- Unlimited API requests
- 2 GB egress bandwidth
- 7 day automatic backups
- Community support

⚠️ **Limitations:**
- Project pauses after 1 week of inactivity
- Daily backup only (not point-in-time recovery)
- 2 concurrent PostgreSQL connections

### When Will You Hit Limits?

**500 MB Database** = Storage for:
- ~50,000 companies with full data
- ~1M stock price records (with TimescaleDB compression)
- ~10,000 user portfolios
- Should last you **6-12 months** easily

**100 GB Bandwidth** =
- ~500,000 page views per month
- ~5,000-10,000 active users
- Plenty for starting out!

---

## Cost Upgrade Path

### Month 0-6: Stay FREE (€0/month)
- Use free tiers
- Perfect for 2-100 users
- ~50K companies database

### Month 6-12: Add Supabase Pro ($25/month)
**Upgrade when:**
- Database > 500 MB
- Need more than 50K MAUs
- Want point-in-time recovery
- Project pause is annoying

**You get:**
- 8 GB database
- 100 GB file storage
- 100 GB egress
- 7-day point-in-time recovery
- No project pause
- Daily backups
- Email support

### Month 12+: Add Vercel Pro ($20/month)
**Upgrade when:**
- Need custom domain
- Need commercial license
- Want passwordless deployments
- Need advanced analytics

**Total: $45/month** for 50-200 users

---

## Monitoring Your Usage

### Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Check usage:
   - **Database**: Settings → Database → Size
   - **Bandwidth**: Reports → Database
   - **Auth**: Authentication → Users → Count

### Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select project → Analytics
3. Check:
   - **Bandwidth**: Usage tab
   - **Function executions**: Usage tab
   - **Page views**: Analytics tab

---

## Local Development

### Set Up Local Environment

```bash
# Copy environment template
cp .env.example .env.local

# Add your Supabase credentials
nano .env.local
```

Add these from Step 1.3:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
ALPHA_VANTAGE_API_KEY=your_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run Locally

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

### Test Before Deploying

```bash
# Build for production
pnpm build

# Start production server locally
pnpm start

# Test at http://localhost:3000
```

---

## Common Issues & Solutions

### Issue: "Build failed"

**Solution**:
```bash
# Test build locally first
pnpm build

# Fix any TypeScript errors
pnpm type-check

# Fix any lint errors
pnpm lint
```

### Issue: "Cannot connect to database"

**Check**:
1. ✅ Environment variables spelled correctly
2. ✅ Supabase project is not paused (free tier)
3. ✅ Copied correct API keys from Supabase Dashboard
4. ✅ No extra spaces in environment variables

**Wake up paused project**:
- Just visit Supabase Dashboard → Your project
- Or make any API call (will auto-wake)

### Issue: "Too Many Requests"

Alpha Vantage free tier = 500 requests/day

**Solutions**:
- Implement caching (Redis)
- Upgrade to paid plan ($50/month)
- Use multiple API keys (switch between them)

### Issue: "Function execution timed out"

Vercel Hobby = 10 second limit

**Solutions**:
- Optimize slow functions
- Use background jobs (we have worker setup)
- Upgrade to Pro for 60 second limit

---

## Next Steps After Deployment

### 1. Set Up Authentication (5 minutes)

```bash
# Supabase has built-in auth!
# Already configured in src/lib/supabase/

# Enable email auth in Supabase:
# Dashboard → Authentication → Providers → Email → Enable
```

### 2. Import Sample Data (optional)

```sql
-- In Supabase SQL Editor
INSERT INTO companies (name, symbol, sector) VALUES
('Apple Inc.', 'AAPL', 'Technology'),
('Microsoft Corporation', 'MSFT', 'Technology'),
('Tesla, Inc.', 'TSLA', 'Automotive');
```

### 3. Add Google OAuth (optional)

1. Create Google OAuth app: https://console.cloud.google.com/
2. Add credentials to Vercel environment variables
3. Enable in Supabase: Dashboard → Authentication → Providers → Google

### 4. Configure Stock Data API

You already have Alpha Vantage free tier!

Test it:
```bash
curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=YOUR_KEY"
```

### 5. Monitor Your App

**Set up Uptime Monitoring (Free):**
- https://uptimerobot.com (50 monitors free)
- Monitor: `https://blackfire-service.vercel.app/api/health`
- Get alerts if site goes down

---

## Performance Optimization

### Enable Vercel Analytics (Free)

1. Vercel Dashboard → Project → Analytics
2. Click "Enable"
3. View page speed, visitor stats

### Enable Caching

```typescript
// Already configured in src/app/providers.tsx
// React Query caches for 1 minute by default
```

### Optimize Images

```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src="/logo.png"
  width={200}
  height={50}
  alt="Logo"
/>
```

---

## Backup Strategy

### Automatic Backups (Included)

Supabase Free tier:
- ✅ Daily automatic backups (7 days retention)
- Access: Dashboard → Database → Backups

### Manual Backup (Do Monthly)

```bash
# Download database backup
# In Supabase Dashboard:
# Database → Backups → Download

# Or via CLI
npx supabase db dump > backup.sql
```

Store backups in:
- Google Drive
- Dropbox
- GitHub private repo (if < 100 MB)

---

## Security Checklist

✅ Row Level Security (RLS) enabled in database
✅ Environment variables in Vercel (not in code)
✅ Supabase service_role key secret
✅ HTTPS enforced (automatic with Vercel)
✅ API rate limiting (Vercel automatic)
✅ Database behind Supabase firewall

### Enable RLS (Already in schema)

Your tables already have RLS policies!

Check in Supabase:
- Dashboard → Table Editor → Select table → Click "..." → View policies

---

## Migration to VPS (When Needed)

If you later want to move to your VPS:

```bash
# 1. Export from Supabase
npx supabase db dump > production-backup.sql

# 2. Import to VPS
# Follow VPS setup guide
cat production-backup.sql | docker compose exec -T postgres psql -U blackfire_user -d blackfire

# 3. Update DNS
# Point domain to VPS IP

# 4. Done!
```

Your code works on both without changes!

---

## Support Resources

**Vercel:**
- Docs: https://vercel.com/docs
- Discord: https://vercel.com/discord
- Status: https://www.vercel-status.com/

**Supabase:**
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com/
- Status: https://status.supabase.com/

**Next.js:**
- Docs: https://nextjs.org/docs
- GitHub Discussions: https://github.com/vercel/next.js/discussions

---

## Congratulations! 🎉

You now have:
- ✅ Production website live at Vercel
- ✅ PostgreSQL database at Supabase
- ✅ Automatic deployments from Git
- ✅ SSL certificate
- ✅ Global CDN
- ✅ Professional infrastructure
- ✅ **€0/month cost**

**Your live URL**: https://blackfire-service.vercel.app

Share it, show it to users, start building features!

---

## Quick Commands Reference

```bash
# Local development
pnpm install          # Install dependencies
pnpm dev             # Start dev server
pnpm build           # Build for production
pnpm start           # Start production server

# Deployment
git add .
git commit -m "Update"
git push             # Auto-deploys to Vercel

# Vercel CLI (optional)
pnpm install -g vercel
vercel               # Deploy from CLI
vercel --prod        # Deploy to production
vercel logs          # View logs
```

---

**Need help?** Check troubleshooting section or create a GitHub issue.

**Ready to build?** Start coding features - every push auto-deploys! 🚀
