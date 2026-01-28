#!/bin/bash

# Blackfire Service - VPS Initial Setup Script
# Run this once on a fresh Hostinger VPS

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║      Blackfire Service - VPS Setup Script               ║"
echo "║      Setting up Docker, SSL, and deployment             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install essential packages
echo -e "${YELLOW}📦 Installing essential packages...${NC}"
apt install -y curl git wget software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Docker
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Install Docker Compose
echo -e "${YELLOW}🐳 Installing Docker Compose plugin...${NC}"
apt install -y docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Install Certbot for SSL
echo -e "${YELLOW}🔒 Installing Certbot for SSL certificates...${NC}"
apt install -y certbot python3-certbot-nginx

# Install Node.js (for potential local development)
echo -e "${YELLOW}📦 Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    echo -e "${GREEN}✅ Node.js installed${NC}"
else
    echo -e "${GREEN}✅ Node.js already installed${NC}"
fi

# Create application user
echo -e "${YELLOW}👤 Creating application user...${NC}"
if ! id -u blackfire &>/dev/null; then
    adduser --disabled-password --gecos "" blackfire
    usermod -aG docker blackfire
    echo -e "${GREEN}✅ User 'blackfire' created${NC}"
else
    echo -e "${GREEN}✅ User 'blackfire' already exists${NC}"
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p /home/blackfire/backups
mkdir -p /home/blackfire/logs
chown -R blackfire:blackfire /home/blackfire

# Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp  # SSH
    ufw allow 80/tcp  # HTTP
    ufw allow 443/tcp # HTTPS
    echo "y" | ufw enable
    echo -e "${GREEN}✅ Firewall configured${NC}"
fi

# Set up log rotation
echo -e "${YELLOW}📝 Setting up log rotation...${NC}"
cat > /etc/logrotate.d/blackfire << EOF
/home/blackfire/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 blackfire blackfire
}
EOF

# Configure Docker daemon
echo -e "${YELLOW}🐳 Configuring Docker daemon...${NC}"
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker

# Set up swap (if not exists)
echo -e "${YELLOW}💾 Checking swap space...${NC}"
if [ $(swapon --show | wc -l) -eq 0 ]; then
    echo -e "${YELLOW}Creating 2GB swap file...${NC}"
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo -e "${GREEN}✅ Swap created${NC}"
else
    echo -e "${GREEN}✅ Swap already configured${NC}"
fi

# Display next steps
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              Setup completed successfully!               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "1. Switch to blackfire user:"
echo -e "   ${YELLOW}su - blackfire${NC}"
echo ""
echo "2. Clone your repository:"
echo -e "   ${YELLOW}git clone <your-repo-url> ~/blackfire-service${NC}"
echo "   ${YELLOW}cd ~/blackfire-service${NC}"
echo ""
echo "3. Copy and configure environment:"
echo -e "   ${YELLOW}cp .env.production.example .env.production${NC}"
echo -e "   ${YELLOW}nano .env.production${NC}"
echo ""
echo "4. Generate secrets:"
echo -e "   ${YELLOW}DB_PASSWORD: openssl rand -base64 32${NC}"
echo -e "   ${YELLOW}REDIS_PASSWORD: openssl rand -base64 32${NC}"
echo -e "   ${YELLOW}NEXTAUTH_SECRET: openssl rand -base64 32${NC}"
echo ""
echo "5. Set up SSL certificate:"
echo -e "   ${YELLOW}sudo certbot certonly --standalone -d yourdomain.com${NC}"
echo ""
echo "6. Update nginx config with your domain:"
echo -e "   ${YELLOW}nano ~/blackfire-service/nginx/conf.d/blackfire.conf${NC}"
echo ""
echo "7. Deploy:"
echo -e "   ${YELLOW}bash scripts/deploy-vps.sh${NC}"
echo ""
echo "8. Set up automated backups:"
echo -e "   ${YELLOW}crontab -e${NC}"
echo "   Add: ${YELLOW}0 2 * * * /home/blackfire/blackfire-service/scripts/backup-db.sh${NC}"
echo ""
echo -e "${GREEN}🎉 Your VPS is now ready for Blackfire Service!${NC}"
