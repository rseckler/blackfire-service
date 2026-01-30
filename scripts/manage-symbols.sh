#!/bin/bash
# Symbol Management Script
# Provides commands to manage the symbol population service

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_usage() {
    echo -e "${BLUE}Symbol Management Commands${NC}"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  test              Run a dry-run to see what would be populated"
    echo "  populate          Populate symbols (live run)"
    echo "  populate-limited  Populate up to 50 symbols only"
    echo "  status            Check cron service status"
    echo "  logs              Show cron service logs"
    echo "  restart           Restart cron service"
    echo ""
    echo "Examples:"
    echo "  $0 test"
    echo "  $0 populate"
    echo "  $0 logs"
}

test_populate() {
    echo -e "${BLUE}🧪 Running Symbol Population Test (Dry Run)${NC}"
    echo ""

    if [ -f "$PROJECT_DIR/.env.production" ]; then
        export $(grep -v '^#' "$PROJECT_DIR/.env.production" | xargs)
    fi

    cd "$PROJECT_DIR"
    python3 scripts/populate_symbols.py --dry-run
}

populate_symbols() {
    echo -e "${BLUE}🚀 Populating Symbols (Live Run)${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  This will update the database${NC}"
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi

    if [ -f "$PROJECT_DIR/.env.production" ]; then
        export $(grep -v '^#' "$PROJECT_DIR/.env.production" | xargs)
    fi

    cd "$PROJECT_DIR"
    python3 scripts/populate_symbols.py
}

populate_limited() {
    echo -e "${BLUE}🚀 Populating Symbols (Limited to 50)${NC}"
    echo ""

    if [ -f "$PROJECT_DIR/.env.production" ]; then
        export $(grep -v '^#' "$PROJECT_DIR/.env.production" | xargs)
    fi

    cd "$PROJECT_DIR"
    python3 scripts/populate_symbols.py --limit 50
}

check_status() {
    echo -e "${BLUE}📊 Cron Service Status${NC}"
    echo ""
    docker ps --filter name=blackfire-cron --format "table {{.Names}}\t{{.Status}}\t{{.State}}"
}

show_logs() {
    echo -e "${BLUE}📋 Cron Service Logs${NC}"
    echo ""
    echo "Press Ctrl+C to exit"
    echo ""
    docker logs -f blackfire-cron
}

restart_service() {
    echo -e "${BLUE}🔄 Restarting Cron Service${NC}"
    docker restart blackfire-cron
    echo -e "${GREEN}✅ Service restarted${NC}"
}

# Main command handler
case "${1:-}" in
    test)
        test_populate
        ;;
    populate)
        populate_symbols
        ;;
    populate-limited)
        populate_limited
        ;;
    status)
        check_status
        ;;
    logs)
        show_logs
        ;;
    restart)
        restart_service
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
