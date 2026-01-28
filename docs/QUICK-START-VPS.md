# Quick Start Guide - VPS Deployment

**Goal**: Get Blackfire Service running on your Hostinger VPS in under 30 minutes with €0 additional costs.

---

## Prerequisites

- ✅ Hostinger VPS with SSH access
- ✅ Domain name (point A record to VPS IP)
- ✅ 30 minutes of time

---

## Quick Commands

### 1. Initial Setup (One-time, ~10 minutes)

```bash
# SSH into VPS as root
ssh root@your-vps-ip

# Run setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/blackfire-service/main/scripts/setup-vps.sh -o setup.sh
chmod +x setup.sh
sudo ./setup.sh
```

### 2. Application Setup (~10 minutes)

```bash
# Switch to app user
su - blackfire

# Clone repo
git clone <your-repo-url> blackfire-service
cd blackfire-service

# Configure environment
cp .env.production.example .env.production

# Generate secrets
echo "DB_PASSWORD=$(openssl rand -base64 32)" >> .env.production
echo "REDIS_PASSWORD=$(openssl rand -base64 32)" >> .env.production
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.production

# Edit with your domain and API keys
nano .env.production
```

**Required settings:**
- `NEXTAUTH_URL=https://yourdomain.com`
- `ALPHA_VANTAGE_API_KEY=` (get free at alphavantage.co)

### 3. SSL Certificate (~2 minutes)

```bash
# Exit to root
exit

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com
```

### 4. Deploy (~8 minutes)

```bash
# Back to app user
su - blackfire
cd ~/blackfire-service

# Update nginx config with your domain
sed -i 's/yourdomain.com/your-actual-domain.com/g' nginx/conf.d/blackfire.conf

# Deploy!
bash scripts/deploy-vps.sh
```

### 5. Verify

```bash
# Check health
curl https://yourdomain.com/api/health

# View in browser
open https://yourdomain.com
```

---

## Post-Deployment

### Set Up Daily Backups

```bash
crontab -e

# Add:
0 2 * * * /home/blackfire/blackfire-service/scripts/backup-db.sh >> /home/blackfire/logs/backup.log 2>&1
```

### Monitor Logs

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

---

## Total Cost

**€0/month** using your existing Hostinger VPS! 🎉

Optional costs later:
- OpenAI API: €5-20/month (when you add AI features)
- Better stock data: €50/month (if free tier not enough)

---

## Need Help?

See full guide: [DEPLOYMENT-VPS.md](./DEPLOYMENT-VPS.md)

Troubleshooting: [DEPLOYMENT-VPS.md#troubleshooting](./DEPLOYMENT-VPS.md#troubleshooting)

---

**That's it! Your production-ready stock analysis platform is now live! 🚀**
