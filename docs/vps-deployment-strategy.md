# VPS Deployment Strategy - Hostinger Edition

**Goal**: Start with zero additional costs, scale up later
**Infrastructure**: Hostinger VPS (Self-hosted)
**Strategy**: Docker-based deployment with cloud migration path

---

## Executive Summary

**Phase 1**: Everything self-hosted on Hostinger VPS (€0/month additional)
**Phase 2**: Hybrid (VPS + selective cloud services as needed)
**Phase 3**: Full cloud migration when scaling requires it

**Total Costs:**
- **Month 1-6**: €0 (only VPS you already have)
- **Month 6-12**: €0-50 (optional: stock data API)
- **Month 12+**: Scale based on actual usage

---

## 1. Hostinger VPS Analysis

### Typical Hostinger VPS Specs (Base Tier €4-8/month):

**Minimum Requirements:**
- 2 vCPU
- 4 GB RAM
- 50-100 GB SSD
- 2 TB Bandwidth
- Ubuntu 22.04 LTS

**What We Can Run:**
- ✅ PostgreSQL + TimescaleDB
- ✅ Redis
- ✅ MeiliSearch (or lightweight alternative)
- ✅ Next.js Application
- ✅ Nginx (reverse proxy)
- ✅ Background job workers

**What We Can't Run (initially):**
- ❌ Heavy ML workloads (use external APIs)
- ❌ Thousands of concurrent users (but fine for MVP)

---

## 2. Self-Hosted Architecture (VPS)

```
┌─────────────────────────────────────────────────────────┐
│              Hostinger VPS (Ubuntu 22.04)               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────┐                                         │
│  │   Nginx    │  (Reverse Proxy + SSL)                 │
│  │  Port 80   │                                         │
│  │  Port 443  │                                         │
│  └──────┬─────┘                                         │
│         │                                                │
│         ├──────────────────┬───────────────────────────┐│
│         │                  │                           ││
│  ┌──────▼──────┐    ┌─────▼──────┐    ┌─────────────┐││
│  │  Next.js    │    │ PostgreSQL │    │   Redis     │││
│  │  (Node.js)  │    │   + Timescale│  │  (Cache)    │││
│  │  Port 3000  │    │   Port 5432 │    │  Port 6379  │││
│  │             │◄───┤             │    │             │││
│  │  - Frontend │    │  - Companies│    │  - Sessions │││
│  │  - API      │    │  - Stocks   │    │  - Job Queue│││
│  │  - Auth     │    │  - Users    │    │  - Cache    │││
│  └─────────────┘    │  - Portfolios│   └─────────────┘││
│                     └──────────────┘                   ││
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │ BullMQ Worker│    │ MeiliSearch  │  (Optional)      │
│  │ (Background) │    │ (Search)     │                  │
│  │ Port 3001    │    │ Port 7700    │                  │
│  └──────────────┘    └──────────────┘                  │
│                                                          │
│  All running as Docker containers                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
                        │
                        │ External APIs (Pay-as-you-go)
                        │
        ┌───────────────┴────────────────┐
        │                                 │
   ┌────▼────┐                      ┌────▼────┐
   │ Alpha   │                      │ OpenAI  │
   │ Vantage │                      │ (AI)    │
   │ (Free)  │                      │ (€5-20) │
   └─────────┘                      └─────────┘
```

---

## 3. Updated Technology Stack (VPS Edition)

### What Changes:

| Service | Cloud Version | VPS Self-Hosted | Cost Difference |
|---------|---------------|-----------------|-----------------|
| **Database** | Supabase Cloud ($25/mo) | PostgreSQL Docker (€0) | **Save $25/mo** |
| **Auth** | Supabase Auth | NextAuth.js (€0) | **Save $0** (included) |
| **Cache/Queue** | Upstash Redis ($10-30/mo) | Redis Docker (€0) | **Save $10-30/mo** |
| **Search** | MeiliSearch Cloud ($50/mo) | MeiliSearch Docker (€0) | **Save $50/mo** |
| **Frontend** | Vercel ($20/mo) | VPS + Nginx (€0) | **Save $20/mo** |
| **Storage** | Supabase Storage ($10/mo) | VPS Disk (€0) | **Save $10/mo** |

**Total Savings: $115-145/month = $1,380-1,740/year**

### New Stack:

**Frontend & Backend:**
- Next.js 15 (same)
- Deploy on VPS with PM2 or Docker

**Database:**
- PostgreSQL 16 (Docker)
- TimescaleDB extension
- Automated backups to VPS disk

**Auth:**
- NextAuth.js (instead of Supabase Auth)
- Supports Google, GitHub, Email/Password
- Database session storage

**Cache & Queue:**
- Redis 7 (Docker)
- BullMQ for background jobs

**Search:**
- Option A: PostgreSQL Full-Text Search (€0, good enough)
- Option B: MeiliSearch (Docker, better UX)
- Option C: Skip initially, add later

**File Storage:**
- VPS filesystem (for user uploads)
- Nginx serve static files

---

## 4. Cost Comparison

### Phase 1: MVP (0-6 months)

| Item | Cost | Notes |
|------|------|-------|
| Hostinger VPS | €0 | Already have |
| Domain + SSL | €0 | Let's Encrypt free SSL |
| PostgreSQL | €0 | Self-hosted |
| Redis | €0 | Self-hosted |
| Stock Data API | €0 | Alpha Vantage free tier (500 req/day) |
| **Total** | **€0/month** | |

### Phase 2: Growing (6-12 months, 100-500 users)

| Item | Cost | Notes |
|------|------|-------|
| Hostinger VPS | €0 | Already have |
| Stock Data API | €0-50 | Upgrade if needed |
| AI APIs (OpenAI) | €5-20 | Pay per use |
| Backups (off-site) | €5 | Backblaze B2 |
| **Total** | **€10-75/month** | |

### Phase 3: Scaling (1000+ users)

**Option A: Stay on VPS**
- Upgrade to larger VPS: €20-50/month
- Add CDN: €10-20/month
- External services: €30-50/month
- **Total: €60-120/month**

**Option B: Migrate to Cloud**
- Use original architecture (Vercel + Supabase)
- Costs: $231-446/month
- Better scalability, less maintenance

---

## 5. Updated Docker Compose (Production)

```yaml
version: '3.8'

services:
  # PostgreSQL with TimescaleDB
  postgres:
    image: timescale/timescaledb:latest-pg16
    container_name: blackfire-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: blackfire
      POSTGRES_USER: blackfire_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "127.0.0.1:5432:5432"
    networks:
      - blackfire-network
    command: postgres -c shared_preload_libraries=timescaledb

  # Redis
  redis:
    image: redis:7-alpine
    container_name: blackfire-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:6379:6379"
    networks:
      - blackfire-network

  # MeiliSearch (Optional - can skip initially)
  meilisearch:
    image: getmeili/meilisearch:v1.10
    container_name: blackfire-meilisearch
    restart: unless-stopped
    environment:
      MEILI_ENV: production
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
      MEILI_NO_ANALYTICS: true
    volumes:
      - meilisearch_data:/meili_data
    ports:
      - "127.0.0.1:7700:7700"
    networks:
      - blackfire-network

  # Next.js Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: blackfire-app
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://blackfire_user:${DB_PASSWORD}@postgres:5432/blackfire
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      NEXTAUTH_URL: ${APP_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - postgres
      - redis
    networks:
      - blackfire-network

  # Background Worker
  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    container_name: blackfire-worker
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://blackfire_user:${DB_PASSWORD}@postgres:5432/blackfire
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - blackfire-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: blackfire-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./public:/var/www/public:ro
    depends_on:
      - app
    networks:
      - blackfire-network

networks:
  blackfire-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  meilisearch_data:
```

---

## 6. VPS Setup Guide

### Step 1: Initial VPS Setup

```bash
# SSH into your Hostinger VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Create app user (security)
adduser blackfire
usermod -aG docker blackfire
su - blackfire

# Clone repository
cd ~
git clone <your-repo-url> blackfire-service
cd blackfire-service
```

### Step 2: Environment Configuration

```bash
# Copy environment template
cp .env.example .env.production

# Edit environment variables
nano .env.production
```

Required variables:
```bash
# Database
DB_PASSWORD=your_strong_password_here

# Redis
REDIS_PASSWORD=your_redis_password_here

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_32chars
NEXTAUTH_URL=https://yourdomain.com

# MeiliSearch (if using)
MEILI_MASTER_KEY=your_meili_master_key

# Stock APIs
ALPHA_VANTAGE_API_KEY=your_key_here

# AI APIs (optional initially)
OPENAI_API_KEY=your_key_here
```

### Step 3: SSL Certificate (Free)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already set up by certbot)
```

### Step 4: Build and Deploy

```bash
# Build Docker images
docker compose -f docker-compose.prod.yml build

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f app
```

### Step 5: Database Setup

```bash
# Run migrations
docker compose -f docker-compose.prod.yml exec app pnpm db:migrate

# Or manually
docker compose -f docker-compose.prod.yml exec postgres psql -U blackfire_user -d blackfire -f /backups/initial_schema.sql
```

### Step 6: Automated Backups

```bash
# Create backup script
nano ~/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/blackfire/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL
docker compose -f /home/blackfire/blackfire-service/docker-compose.prod.yml exec -T postgres \
  pg_dump -U blackfire_user blackfire | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

# Optional: Upload to cloud storage (Backblaze B2, AWS S3, etc.)
```

```bash
# Make executable and schedule
chmod +x ~/backup.sh
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/blackfire/backup.sh
```

---

## 7. Monitoring & Maintenance

### Resource Monitoring

```bash
# Check Docker container resources
docker stats

# Check disk usage
df -h

# Check memory
free -h

# Check PostgreSQL size
docker compose exec postgres psql -U blackfire_user -d blackfire -c "SELECT pg_size_pretty(pg_database_size('blackfire'));"
```

### Log Management

```bash
# Rotate logs to prevent disk fill
nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### Performance Tuning

```bash
# PostgreSQL tuning for 4GB RAM VPS
docker compose exec postgres psql -U blackfire_user -d blackfire

# Inside psql:
ALTER SYSTEM SET shared_buffers = '1GB';
ALTER SYSTEM SET effective_cache_size = '3GB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET work_mem = '32MB';
ALTER SYSTEM SET max_connections = '100';

# Restart PostgreSQL
docker compose -f docker-compose.prod.yml restart postgres
```

---

## 8. Migration Path to Cloud

### When to Migrate:

**Stay on VPS if:**
- < 1000 active users
- < 100 concurrent users
- Response times acceptable
- You enjoy managing infrastructure

**Migrate to cloud if:**
- > 1000 active users
- Need better DDoS protection
- Want to focus on features, not DevOps
- Need global CDN
- Require 99.9% uptime SLA

### Migration Steps (VPS → Cloud):

1. **Database Export:**
```bash
# Export from VPS
pg_dump -h localhost -U blackfire_user blackfire > dump.sql

# Import to Supabase or managed PostgreSQL
# Use Supabase dashboard or CLI
```

2. **Update Environment Variables:**
```bash
# Change from local to cloud URLs
DATABASE_URL=postgresql://...@db.xxxxx.supabase.co:5432/postgres
REDIS_URL=redis://...@xxxxx.upstash.io:6379
```

3. **Deploy to Vercel:**
```bash
vercel --prod
```

4. **Gradual Migration:**
- Week 1: Move static assets to CDN (Cloudflare free)
- Week 2: Move database to Supabase (keep VPS as backup)
- Week 3: Move app to Vercel (VPS as backup)
- Week 4: Decommission VPS or repurpose

---

## 9. Updated Package.json Scripts

Add VPS deployment scripts:

```json
{
  "scripts": {
    "deploy:vps": "bash scripts/deploy-vps.sh",
    "backup:db": "bash scripts/backup-db.sh",
    "logs:prod": "ssh blackfire@your-vps-ip 'cd blackfire-service && docker compose -f docker-compose.prod.yml logs -f'",
    "ssh:vps": "ssh blackfire@your-vps-ip"
  }
}
```

---

## 10. Recommended Hostinger VPS Tier

### For MVP (0-100 users):
**VPS 1 or KVM 1** (€4-8/month)
- 2 vCPU
- 4 GB RAM
- 50-100 GB SSD
- ✅ Perfect for starting

### For Growth (100-1000 users):
**VPS 2 or KVM 2** (€15-25/month)
- 4 vCPU
- 8 GB RAM
- 150-250 GB SSD
- ✅ Can handle significant traffic

### For Scale (1000+ users):
Consider cloud migration or dedicated server

---

## 11. Pros & Cons

### Self-Hosted on VPS

**Pros:**
- ✅ **€0 additional costs** (use existing VPS)
- ✅ Full control over infrastructure
- ✅ No vendor lock-in
- ✅ Learn valuable DevOps skills
- ✅ Data sovereignty
- ✅ Can upgrade VPS as needed

**Cons:**
- ⚠️ You manage backups, updates, security
- ⚠️ No automatic scaling
- ⚠️ Single point of failure (no redundancy)
- ⚠️ Limited resources on basic VPS
- ⚠️ Takes time to set up and maintain

### Cloud Services

**Pros:**
- ✅ Automatic scaling
- ✅ Managed backups
- ✅ High availability
- ✅ Global CDN
- ✅ Less maintenance

**Cons:**
- ❌ Costs add up quickly ($200-500/month)
- ❌ Vendor lock-in
- ❌ Less control
- ❌ Overkill for MVP

---

## 12. Recommendation

**Start: VPS Self-Hosted**
- Month 0-6: Build MVP on VPS (€0 additional)
- Validate product-market fit
- Learn what features users actually want

**Grow: Hybrid**
- Month 6-12: Add paid APIs as needed
- Keep core on VPS, use cloud for specific needs
- Total cost: €10-75/month

**Scale: Cloud Migration**
- Month 12+: Migrate when revenue justifies costs
- Or stay on VPS if it meets your needs

**Bottom Line:** Start on your Hostinger VPS with €0 additional costs. You can always migrate later when you have users and revenue.

---

## 13. Next Steps

1. ✅ Adapt configuration files for VPS deployment
2. ⏭️ Create Dockerfile for production
3. ⏭️ Set up Nginx configuration
4. ⏭️ Replace Supabase Auth with NextAuth.js
5. ⏭️ Create deployment scripts
6. ⏭️ Set up monitoring
7. ⏭️ Deploy to VPS

Ready to proceed?
