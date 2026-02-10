#!/bin/bash
# ============================================================
# Blackfire Service - Supabase Sync Setup
# Run on VPS to set up Python sync scripts + cronjobs
# ============================================================
set -e

APP_DIR="/root/blackfire-service"
VENV_DIR="$APP_DIR/venv"
LOG_DIR="/var/log/blackfire"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "============================================================"
echo "  Blackfire Service - Supabase Sync Setup"
echo "============================================================"

# ---- Step 1: Check prerequisites ----
echo -e "\n${YELLOW}[1/6] Checking prerequisites...${NC}"

if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Error: $APP_DIR not found. Clone the repo first.${NC}"
    exit 1
fi

if [ ! -f "$APP_DIR/.env.production" ]; then
    echo -e "${RED}Error: $APP_DIR/.env.production not found.${NC}"
    exit 1
fi

# Check required env vars (use grep to avoid shell issues with & in URLs)
missing=""
grep -q "^NEXT_PUBLIC_SUPABASE_URL=" "$APP_DIR/.env.production" || missing="$missing NEXT_PUBLIC_SUPABASE_URL"
grep -q "^SUPABASE_SERVICE_ROLE_KEY=" "$APP_DIR/.env.production" || missing="$missing SUPABASE_SERVICE_ROLE_KEY"
grep -q "^DROPBOX_URL=" "$APP_DIR/.env.production" || missing="$missing DROPBOX_URL"
grep -q "^ALPHA_VANTAGE_API_KEY=" "$APP_DIR/.env.production" || missing="$missing ALPHA_VANTAGE_API_KEY"

if [ -n "$missing" ]; then
    echo -e "${RED}Missing env vars in .env.production:${NC}"
    echo -e "${RED}  $missing${NC}"
    echo ""
    echo "Add them to $APP_DIR/.env.production:"
    echo "  DROPBOX_URL=https://www.dropbox.com/scl/fi/..."
    echo "  ALPHA_VANTAGE_API_KEY=your_key_here"
    exit 1
fi

echo -e "${GREEN}  All prerequisites met.${NC}"

# ---- Step 2: Create Python venv ----
echo -e "\n${YELLOW}[2/6] Setting up Python virtual environment...${NC}"

if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
    echo -e "${GREEN}  Created venv at $VENV_DIR${NC}"
else
    echo -e "${GREEN}  Venv already exists.${NC}"
fi

"$VENV_DIR/bin/pip" install --upgrade pip -q
"$VENV_DIR/bin/pip" install supabase pandas openpyxl requests python-dotenv -q
echo -e "${GREEN}  Dependencies installed.${NC}"

# ---- Step 3: Create log directory ----
echo -e "\n${YELLOW}[3/6] Creating log directory...${NC}"
mkdir -p "$LOG_DIR"
echo -e "${GREEN}  $LOG_DIR created.${NC}"

# ---- Step 4: Test scripts ----
echo -e "\n${YELLOW}[4/6] Testing scripts (dry run)...${NC}"

echo "  Testing populate_symbols.py --dry-run..."
"$VENV_DIR/bin/python3" "$APP_DIR/scripts/populate_symbols.py" --dry-run --limit 3 2>&1 | tail -5
echo ""

echo "  Testing update_stock_prices.py --limit 1..."
"$VENV_DIR/bin/python3" "$APP_DIR/scripts/update_stock_prices.py" --limit 1 2>&1 | tail -5
echo ""

echo -e "${GREEN}  Script tests complete.${NC}"

# ---- Step 5: Install cronjobs ----
echo -e "\n${YELLOW}[5/6] Installing cronjobs...${NC}"

CRON_MARKER="# Blackfire_service Supabase Sync"
EXISTING_CRON=$(crontab -l 2>/dev/null || true)

if echo "$EXISTING_CRON" | grep -q "$CRON_MARKER"; then
    echo -e "${GREEN}  Cronjobs already installed. Skipping.${NC}"
    echo "  To update, run: crontab -e"
else
    NEW_CRON="$EXISTING_CRON

$CRON_MARKER
# Excel -> Supabase (07:00 UTC = after Notion sync at 06:00)
0 7 * * * $VENV_DIR/bin/python3 $APP_DIR/scripts/sync_excel_to_postgres.py >> $LOG_DIR/sync.log 2>&1

# Symbol Population (every 4 hours)
0 */4 * * * $VENV_DIR/bin/python3 $APP_DIR/scripts/populate_symbols.py >> $LOG_DIR/symbols.log 2>&1

# Stock Prices via Alpha Vantage (hourly 09-17 UTC, Mon-Fri)
0 9-17 * * 1-5 $VENV_DIR/bin/python3 $APP_DIR/scripts/update_stock_prices.py >> $LOG_DIR/prices.log 2>&1"

    echo "$NEW_CRON" | crontab -
    echo -e "${GREEN}  3 cronjobs installed.${NC}"
fi

# ---- Step 6: Setup logrotate ----
echo -e "\n${YELLOW}[6/6] Setting up log rotation...${NC}"

cat > /etc/logrotate.d/blackfire-service << EOF
$LOG_DIR/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    size 5M
}
EOF

echo -e "${GREEN}  Logrotate configured.${NC}"

# ---- Done ----
echo ""
echo "============================================================"
echo -e "${GREEN}  Setup complete!${NC}"
echo "============================================================"
echo ""
echo "Cronjob schedule:"
echo "  07:00 UTC  - Excel -> Supabase sync"
echo "  Every 4h   - Symbol population"
echo "  09-17 UTC  - Stock price updates (Mon-Fri)"
echo ""
echo "Logs:"
echo "  $LOG_DIR/sync.log"
echo "  $LOG_DIR/symbols.log"
echo "  $LOG_DIR/prices.log"
echo ""
echo "Manual test commands:"
echo "  cd $APP_DIR && source venv/bin/activate"
echo "  python3 scripts/sync_excel_to_postgres.py"
echo "  python3 scripts/populate_symbols.py --dry-run"
echo "  python3 scripts/update_stock_prices.py --limit 5"
echo ""
echo "Verify cronjobs: crontab -l"
