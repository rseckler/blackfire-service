# Quick Start - Cloud Deployment (15 Minutes)

**Cost**: €0/month FREE
**Platforms**: Vercel + Supabase
**Time**: 15 minutes

---

## Prerequisites

- GitHub account
- That's it! No credit card needed

---

## 5-Step Setup

### 1️⃣ Supabase (5 min)

```
1. Go to https://supabase.com
2. Sign up with GitHub
3. Create new project:
   - Name: blackfire-service
   - Password: [Generate & Save]
   - Region: [Choose closest]
4. Wait 2 minutes for setup
5. Settings → API → Copy:
   ✓ Project URL
   ✓ anon key
   ✓ service_role key
```

### 2️⃣ GitHub (2 min)

```bash
cd /Users/robin/Documents/4_AI/Blackfire_service

git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/blackfire-service.git
git push -u origin main
```

### 3️⃣ Vercel (5 min)

```
1. Go to https://vercel.com/signup
2. Continue with GitHub
3. Import blackfire-service repo
4. Add environment variables:
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ALPHA_VANTAGE_API_KEY=demo
   NEXT_PUBLIC_APP_URL=https://blackfire-service.vercel.app
5. Click "Deploy"
```

### 4️⃣ Database (2 min)

```
1. In Supabase Dashboard
2. SQL Editor → New Query
3. Copy content from supabase/migrations/20260128000001_initial_schema.sql
4. Paste & Run
5. Done!
```

### 5️⃣ Alpha Vantage API (1 min)

```
1. Go to https://www.alphavantage.co/support/#api-key
2. Enter email → Get Free API Key
3. Copy key
4. Vercel Dashboard → Environment Variables → Update ALPHA_VANTAGE_API_KEY
5. Redeploy
```

---

## ✅ You're Live!

Visit: `https://blackfire-service.vercel.app`

Test: `curl https://blackfire-service.vercel.app/api/health`

---

## Auto-Deploy on Every Push

```bash
git add .
git commit -m "Add feature"
git push

# Vercel auto-deploys in ~2 minutes! 🚀
```

---

## Free Tier Limits

✅ Vercel: 100 GB bandwidth/month (~500K views)
✅ Supabase: 500 MB database, 50K users
✅ Perfect for 2-50 users for months!

---

## Next Steps

1. ✅ Add sample data (Supabase SQL Editor)
2. ✅ Enable auth (Supabase → Authentication)
3. ✅ Build features (every push auto-deploys)
4. ✅ Monitor usage (Vercel & Supabase dashboards)

---

## Need More Details?

See: [SETUP-VERCEL-SUPABASE.md](./SETUP-VERCEL-SUPABASE.md)

---

**Total Cost: €0/month** 🎉
**Total Time: 15 minutes** ⚡
**Status: Production-Ready** ✨
