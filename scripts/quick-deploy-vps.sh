#!/bin/bash

# Quick VPS Deployment Script
# Pushes to VPS and deploys

set -e

VPS_IP="72.62.148.205"
VPS_USER="root"
APP_DIR="/root/blackfire-service"

echo "🚀 Quick Deploy to VPS"
echo "====================="
echo ""

# 1. Check if we have a git remote
echo "📡 Checking git remote..."
if ! git remote | grep -q vps; then
    echo "Adding VPS git remote..."
    git remote add vps ssh://${VPS_USER}@${VPS_IP}${APP_DIR}/.git 2>/dev/null || true
fi

# 2. Push to VPS
echo "📤 Pushing code to VPS..."
git push origin main

# 3. SSH to VPS and deploy
echo "🔧 Connecting to VPS and deploying..."
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'ENDSSH'
cd /root/blackfire-service

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm install --production

echo "🔨 Building application..."
npm run build

echo "🔄 Restarting services..."
# If using PM2
if command -v pm2 &> /dev/null; then
    pm2 restart blackfire-service || pm2 start npm --name blackfire-service -- start
fi

# If using Docker
if [ -f "docker-compose.prod.yml" ]; then
    docker compose -f docker-compose.prod.yml up -d --build
fi

echo ""
echo "✅ Deployment complete!"
echo "🌐 Service should be running at http://72.62.148.205:3000"
ENDSSH

echo ""
echo "✅ VPS Deployment Complete!"
echo "🌐 Visit: http://72.62.148.205:3000"
