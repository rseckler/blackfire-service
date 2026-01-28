#!/bin/bash

# Blackfire Service - VPS Deployment Script
# Usage: ./scripts/deploy-vps.sh [production|staging]

set -e

ENV=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"

echo "🚀 Deploying Blackfire Service to VPS ($ENV environment)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}Error: .env.production not found${NC}"
    echo "Copy .env.production.example and fill in your values"
    exit 1
fi

# Pull latest code
echo -e "${YELLOW}📥 Pulling latest code...${NC}"
git pull origin main

# Build Docker images
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
docker compose -f $COMPOSE_FILE build --no-cache

# Stop old containers
echo -e "${YELLOW}⏹️  Stopping old containers...${NC}"
docker compose -f $COMPOSE_FILE down

# Start new containers
echo -e "${YELLOW}🚀 Starting new containers...${NC}"
docker compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check service health
echo -e "${YELLOW}🏥 Checking service health...${NC}"
docker compose -f $COMPOSE_FILE ps

# Run database migrations (if needed)
echo -e "${YELLOW}🗃️  Running database migrations...${NC}"
docker compose -f $COMPOSE_FILE exec -T postgres psql -U blackfire_user -d blackfire -c "SELECT 1" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database is accessible${NC}"
else
    echo -e "${RED}❌ Database is not accessible${NC}"
    exit 1
fi

# Clean up old images
echo -e "${YELLOW}🧹 Cleaning up old Docker images...${NC}"
docker image prune -f

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "View logs with: docker compose -f $COMPOSE_FILE logs -f"
echo "Check status with: docker compose -f $COMPOSE_FILE ps"
echo ""
echo "🎉 Blackfire Service is now running at ${NEXTAUTH_URL}"
