#!/bin/bash

# Blackfire Service - Database Backup Script
# Schedule with cron: 0 2 * * * /path/to/backup-db.sh

set -e

BACKUP_DIR="/home/blackfire/backups"
DATE=$(date +%Y%m%d_%H%M%S)
COMPOSE_FILE="/home/blackfire/blackfire-service/docker-compose.prod.yml"
KEEP_DAYS=7

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🗄️  Starting database backup...${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
echo -e "${YELLOW}📦 Backing up PostgreSQL database...${NC}"
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U blackfire_user -d blackfire \
  | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PostgreSQL backup created: db_$DATE.sql.gz${NC}"
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/db_$DATE.sql.gz" | cut -f1)
    echo -e "   Size: $BACKUP_SIZE"
else
    echo -e "${RED}❌ PostgreSQL backup failed${NC}"
    exit 1
fi

# Backup Redis (RDB snapshot)
echo -e "${YELLOW}📦 Backing up Redis...${NC}"
docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli --no-auth-warning -a "$REDIS_PASSWORD" BGSAVE

# Wait for Redis to finish saving
sleep 5
docker compose -f "$COMPOSE_FILE" exec -T redis \
  cat /data/dump.rdb > "$BACKUP_DIR/redis_$DATE.rdb"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Redis backup created: redis_$DATE.rdb${NC}"
else
    echo -e "${YELLOW}⚠️  Redis backup failed (non-critical)${NC}"
fi

# Delete old backups (keep last N days)
echo -e "${YELLOW}🧹 Cleaning up old backups (keeping last $KEEP_DAYS days)...${NC}"
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +$KEEP_DAYS -delete
find "$BACKUP_DIR" -name "redis_*.rdb" -mtime +$KEEP_DAYS -delete

# Count remaining backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | wc -l)
echo -e "${GREEN}✅ Backup completed! Total backups: $BACKUP_COUNT${NC}"

# Optional: Upload to cloud storage (uncomment and configure)
# Backblaze B2 example:
# b2 sync --delete --replaceNewer "$BACKUP_DIR" b2://your-bucket-name/blackfire-backups/

# AWS S3 example:
# aws s3 sync "$BACKUP_DIR" s3://your-bucket-name/blackfire-backups/ --delete

echo -e "${GREEN}🎉 Backup process completed successfully!${NC}"
