# VPS Deployment Guide - Hostinger

Complete step-by-step guide to deploy Blackfire Service on your Hostinger VPS.

---

## Prerequisites

- Hostinger VPS (minimum: 2 vCPU, 4GB RAM)
- Domain name pointed to your VPS IP
- SSH access to your VPS
- Basic command line knowledge

---

## Step 1: Initial VPS Setup (Run Once)

### 1.1 Connect to VPS

```bash
ssh root@your-vps-ip
```

### 1.2 Run Setup Script

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/blackfire-service/main/scripts/setup-vps.sh -o setup-vps.sh
chmod +x setup-vps.sh
sudo ./setup-vps.sh
```

This script will:
- ✅ Update system packages
- ✅ Install Docker & Docker Compose
- ✅ Install Node.js
- ✅ Install Certbot (SSL certificates)
- ✅ Create application user
- ✅ Configure firewall
- ✅ Set up log rotation
- ✅ Create swap space

---

## Step 2: Application Setup

### 2.1 Switch to Application User

```bash
su - blackfire
```

### 2.2 Clone Repository

```bash
cd ~
git clone <your-repo-url> blackfire-service
cd blackfire-service
```

### 2.3 Configure Environment

```bash
# Copy environment template
cp .env.production.example .env.production

# Generate secure secrets
echo "DB_PASSWORD=$(openssl rand -base64 32)"
echo "REDIS_PASSWORD=$(openssl rand -base64 32)"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"

# Edit environment file with generated secrets
nano .env.production
```

**Minimum required variables:**
```bash
# Database
DB_PASSWORD=your_generated_password

# Redis
REDIS_PASSWORD=your_generated_password

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_generated_secret

# Stock API (free tier)
ALPHA_VANTAGE_API_KEY=get_from_alphavantage.co
```

**Optional variables (add later):**
```bash
# AI Services (pay-as-you-go)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# OAuth (for social login)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

---

## Step 3: SSL Certificate Setup

### 3.1 Get Free SSL Certificate

```bash
# Exit from blackfire user back to root
exit

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Certificate will be saved in /etc/letsencrypt/live/yourdomain.com/
```

### 3.2 Update Nginx Configuration

```bash
su - blackfire
cd ~/blackfire-service

# Edit nginx config with your domain
nano nginx/conf.d/blackfire.conf

# Replace 'yourdomain.com' with your actual domain (3 places)
```

---

## Step 4: Deploy Application

### 4.1 Build and Start Services

```bash
cd ~/blackfire-service

# Build Docker images
docker compose -f docker-compose.prod.yml build

# Start all services
docker compose -f docker-compose.prod.yml up -d
```

### 4.2 Check Service Status

```bash
# View running containers
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f app
```

### 4.3 Initialize Database

```bash
# Check if database is accessible
docker compose -f docker-compose.prod.yml exec postgres psql -U blackfire_user -d blackfire -c "SELECT version();"

# Migrations will run automatically on first start
# If not, run manually:
docker compose -f docker-compose.prod.yml exec postgres psql -U blackfire_user -d blackfire < supabase/migrations/20260128000001_initial_schema.sql
```

---

## Step 5: Verify Deployment

### 5.1 Test Endpoints

```bash
# Health check
curl https://yourdomain.com/api/health

# Should return: {"status":"healthy","timestamp":"...","uptime":...}
```

### 5.2 Access Application

Open browser: `https://yourdomain.com`

You should see the Blackfire Service homepage!

---

## Step 6: Set Up Automated Backups

### 6.1 Test Backup Script

```bash
cd ~/blackfire-service
bash scripts/backup-db.sh
```

### 6.2 Schedule Daily Backups

```bash
# Edit crontab
crontab -e

# Add this line (backup daily at 2 AM)
0 2 * * * /home/blackfire/blackfire-service/scripts/backup-db.sh >> /home/blackfire/logs/backup.log 2>&1
```

### 6.3 Verify Backups

```bash
ls -lh ~/backups/
```

---

## Step 7: Monitoring & Maintenance

### 7.1 View Logs

```bash
# Application logs
docker compose -f docker-compose.prod.yml logs -f app

# Database logs
docker compose -f docker-compose.prod.yml logs -f postgres

# All services
docker compose -f docker-compose.prod.yml logs -f
```

### 7.2 Monitor Resources

```bash
# Docker container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

### 7.3 Check Database Size

```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U blackfire_user -d blackfire -c "SELECT pg_size_pretty(pg_database_size('blackfire'));"
```

---

## Common Tasks

### Update Application

```bash
cd ~/blackfire-service

# Pull latest code
git pull origin main

# Run deployment script
bash scripts/deploy-vps.sh
```

### Restart Services

```bash
# Restart all services
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart app
```

### View Environment Variables

```bash
docker compose -f docker-compose.prod.yml exec app env | grep -v PASSWORD
```

### Database Backup (Manual)

```bash
bash ~/blackfire-service/scripts/backup-db.sh
```

### Database Restore

```bash
# List available backups
ls -lh ~/backups/

# Restore from backup
gunzip < ~/backups/db_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U blackfire_user -d blackfire
```

### Scale Worker Containers

```bash
# Scale to 3 worker instances
docker compose -f docker-compose.prod.yml up -d --scale worker=3
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check Docker service
sudo systemctl status docker

# View container logs
docker compose -f docker-compose.prod.yml logs

# Check disk space
df -h
```

### Database Connection Issues

```bash
# Test database connection
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U blackfire_user

# Check PostgreSQL logs
docker compose -f docker-compose.prod.yml logs postgres
```

### SSL Certificate Issues

```bash
# Test SSL certificate
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test auto-renewal
sudo certbot renew --dry-run
```

### High Memory Usage

```bash
# Check container memory
docker stats --no-stream

# PostgreSQL memory tuning
docker compose -f docker-compose.prod.yml exec postgres psql -U blackfire_user -d blackfire -c "SHOW shared_buffers;"
```

### Application Not Accessible

```bash
# Check nginx status
docker compose -f docker-compose.prod.yml ps nginx

# Check nginx configuration
docker compose -f docker-compose.prod.yml exec nginx nginx -t

# Check firewall
sudo ufw status
```

---

## Performance Optimization

### PostgreSQL Tuning

```sql
-- Connect to PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres psql -U blackfire_user -d blackfire

-- Optimize for 4GB RAM VPS
ALTER SYSTEM SET shared_buffers = '1GB';
ALTER SYSTEM SET effective_cache_size = '3GB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET work_mem = '32MB';
ALTER SYSTEM SET max_connections = '100';
```

Then restart PostgreSQL:
```bash
docker compose -f docker-compose.prod.yml restart postgres
```

### Enable Redis Persistence

Edit `docker-compose.prod.yml`:
```yaml
redis:
  command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### Add CDN (Free with Cloudflare)

1. Sign up at cloudflare.com
2. Add your domain
3. Update nameservers at domain registrar
4. Enable proxy (orange cloud) for your domain
5. Set SSL/TLS mode to "Full (strict)"

---

## Cost Breakdown

### Current Costs (Month 1-6)

| Item | Cost | Notes |
|------|------|-------|
| Hostinger VPS | €0 | Already have |
| SSL Certificate | €0 | Let's Encrypt |
| Docker & Software | €0 | Open source |
| Alpha Vantage API | €0 | Free tier (500 req/day) |
| **Total** | **€0/month** | |

### Optional Costs (When Needed)

| Item | Cost | When to Add |
|------|------|-------------|
| OpenAI API | €5-20/month | For AI features |
| Stock Data API (upgrade) | €50/month | More than 500 stocks/day |
| Off-site Backups | €5/month | Backblaze B2 |
| Larger VPS | +€10-20/month | 500+ concurrent users |

---

## Security Best Practices

1. **Change Default Passwords**: Use strong, unique passwords
2. **Keep Software Updated**: Run `apt update && apt upgrade` monthly
3. **Enable Firewall**: UFW is configured by setup script
4. **Regular Backups**: Automated daily backups to VPS + weekly off-site
5. **Monitor Logs**: Check logs weekly for unusual activity
6. **Use SSH Keys**: Disable password authentication
7. **Rate Limiting**: Nginx configured with rate limits
8. **SSL Only**: Force HTTPS for all traffic

---

## Migration to Cloud (When Ready)

When you outgrow the VPS (1000+ users), you can migrate to cloud:

1. **Export Database**:
```bash
bash scripts/backup-db.sh
```

2. **Choose Cloud Provider**: Vercel + Supabase (or keep PostgreSQL on better VPS)

3. **Import Data**:
```bash
psql postgresql://user:pass@cloud-provider/db < backup.sql
```

4. **Update Environment Variables**: Point to new services

5. **Deploy**: Push to Vercel or new hosting

6. **Gradual Migration**: Use VPS as backup for 1-2 weeks

---

## Support

If you encounter issues:

1. Check logs: `docker compose -f docker-compose.prod.yml logs -f`
2. Verify environment variables: `nano .env.production`
3. Check disk space: `df -h`
4. Review troubleshooting section above
5. Create GitHub issue with logs and error messages

---

## Next Steps

After deployment:

1. ✅ Set up monitoring (optional: Uptime Robot free tier)
2. ✅ Configure off-site backups (Backblaze B2)
3. ✅ Set up domain email forwarding
4. ✅ Add Google Analytics (optional)
5. ✅ Configure social login OAuth apps
6. ✅ Start building features!

---

**Congratulations! Blackfire Service is now live on your VPS with €0 additional costs! 🎉**
