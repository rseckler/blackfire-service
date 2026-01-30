#!/bin/bash
# Automated VPS Deployment Script
# Deploys Symbol Population Service to Hostinger VPS

set -e

# VPS Configuration
VPS_HOST="72.62.148.205"
VPS_USER="root"
VPS_PASSWORD="@VPq6hXpEBDpnLX2"
VPS_PROJECT_DIR="/root/blackfire_service"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Deploying to Hostinger VPS                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Host:${NC} $VPS_HOST"
echo -e "${YELLOW}User:${NC} $VPS_USER"
echo ""

# Function to execute commands on VPS
vps_exec() {
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$@"
}

# Function to copy files to VPS
vps_copy() {
    sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no "$@"
}

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}❌ sshpass is not installed${NC}"
    echo ""
    echo "Please install sshpass:"
    echo "  macOS: brew install hudochenkov/sshpass/sshpass"
    echo "  Linux: sudo apt-get install sshpass"
    echo ""
    echo "Or run deployment manually:"
    echo "  ssh root@$VPS_HOST"
    echo "  cd $VPS_PROJECT_DIR"
    echo "  git pull origin main"
    echo "  ./scripts/deploy-vps.sh"
    exit 1
fi

echo -e "${YELLOW}📡 Connecting to VPS...${NC}"

# Test connection
if ! vps_exec "echo 'Connection successful'"; then
    echo -e "${RED}❌ Failed to connect to VPS${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Connected to VPS${NC}"
echo ""

# Check if project directory exists
echo -e "${YELLOW}🔍 Checking project directory...${NC}"

if ! vps_exec "test -d $VPS_PROJECT_DIR"; then
    echo -e "${RED}❌ Project directory not found: $VPS_PROJECT_DIR${NC}"
    echo ""
    echo "Please create the project directory first or clone the repo:"
    echo "  ssh root@$VPS_HOST"
    echo "  cd /root"
    echo "  git clone https://github.com/rseckler/blackfire-service.git blackfire_service"
    exit 1
fi

echo -e "${GREEN}✅ Project directory exists${NC}"
echo ""

# Pull latest changes
echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
vps_exec "cd $VPS_PROJECT_DIR && git pull origin main"
echo ""

# Check if docker is running
echo -e "${YELLOW}🐋 Checking Docker...${NC}"
if ! vps_exec "docker --version"; then
    echo -e "${RED}❌ Docker is not installed or not running${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is available${NC}"
echo ""

# Build and deploy cron service
echo -e "${YELLOW}🔨 Building Cron Service...${NC}"
vps_exec "cd $VPS_PROJECT_DIR && docker compose -f docker-compose.prod.yml build cron"
echo ""

echo -e "${YELLOW}🚀 Starting Cron Service...${NC}"
vps_exec "cd $VPS_PROJECT_DIR && docker compose -f docker-compose.prod.yml up -d cron"
echo ""

# Wait a moment for container to start
sleep 3

# Check service status
echo -e "${YELLOW}📊 Checking Service Status...${NC}"
vps_exec "docker ps --filter name=blackfire-cron"
echo ""

# Show logs
echo -e "${YELLOW}📋 Recent Logs:${NC}"
vps_exec "docker logs --tail 20 blackfire-cron 2>&1 || echo 'Container starting...'"
echo ""

# Run a test
echo -e "${YELLOW}🧪 Running Test (Dry-Run)...${NC}"
vps_exec "docker exec blackfire-cron python3 scripts/populate_symbols.py --dry-run --limit 5 2>&1 || echo 'Container not ready yet'"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Deployment Completed Successfully!     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  • View logs: ssh root@$VPS_HOST 'docker logs -f blackfire-cron'"
echo "  • Check status: ssh root@$VPS_HOST 'docker ps | grep cron'"
echo "  • Manual run: ssh root@$VPS_HOST 'docker exec -it blackfire-cron python3 scripts/populate_symbols.py --dry-run'"
echo ""
echo -e "${YELLOW}The service will now run automatically every 4 hours!${NC}"
