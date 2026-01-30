#!/bin/bash
# Test Symbol Population Locally Before Deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Symbol Population - Pre-Deploy Test  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if .env.local or .env.production exists
if [ -f "$PROJECT_DIR/.env.local" ]; then
    echo -e "${GREEN}✅ Found .env.local${NC}"
    export $(grep -v '^#' "$PROJECT_DIR/.env.local" | xargs)
elif [ -f "$PROJECT_DIR/.env.production" ]; then
    echo -e "${GREEN}✅ Found .env.production${NC}"
    export $(grep -v '^#' "$PROJECT_DIR/.env.production" | xargs)
else
    echo -e "${RED}❌ No .env file found${NC}"
    echo "Please create .env.local or .env.production"
    exit 1
fi

# Check environment variables
echo ""
echo -e "${YELLOW}🔍 Checking environment variables...${NC}"

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_URL not set${NC}"
    exit 1
else
    echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_URL set${NC}"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY not set${NC}"
    exit 1
else
    echo -e "${GREEN}✅ SUPABASE_SERVICE_ROLE_KEY set${NC}"
fi

# Check Python
echo ""
echo -e "${YELLOW}🐍 Checking Python...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python installed: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}❌ Python 3 not found${NC}"
    exit 1
fi

# Check dependencies
echo ""
echo -e "${YELLOW}📦 Checking Python dependencies...${NC}"
python3 -c "import supabase" 2>/dev/null && echo -e "${GREEN}✅ supabase${NC}" || echo -e "${RED}❌ supabase (run: pip3 install supabase)${NC}"
python3 -c "import pandas" 2>/dev/null && echo -e "${GREEN}✅ pandas${NC}" || echo -e "${YELLOW}⚠️  pandas (optional, run: pip3 install pandas)${NC}"
python3 -c "import dotenv" 2>/dev/null && echo -e "${GREEN}✅ python-dotenv${NC}" || echo -e "${RED}❌ python-dotenv (run: pip3 install python-dotenv)${NC}"

# Check database connectivity
echo ""
echo -e "${YELLOW}🗄️  Testing database connection...${NC}"

cd "$PROJECT_DIR"
python3 -c "
from supabase import create_client
import os

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

try:
    client = create_client(url, key)
    result = client.table('companies').select('id').limit(1).execute()
    print('✅ Database connection successful')
    print(f'✅ Found companies table')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi

# Run dry-run test
echo ""
echo -e "${YELLOW}🧪 Running symbol population test (dry-run, limit 10)...${NC}"
echo ""
python3 scripts/populate_symbols.py --dry-run --limit 10

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ All Pre-Deploy Tests Passed!     ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Review the dry-run results above"
echo "  2. Deploy to VPS: ${YELLOW}./scripts/deploy-vps.sh${NC}"
echo "  3. Monitor logs: ${YELLOW}./scripts/manage-symbols.sh logs${NC}"
echo ""
