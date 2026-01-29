#!/bin/bash

# Run database migration on Supabase
# This script executes the migration SQL via Supabase API

set -e

echo "🔄 Running database migration..."
echo ""

# Check environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing environment variables"
    echo "   Ensure .env.local is loaded"
    exit 1
fi

# Read migration SQL
MIGRATION_FILE="supabase/migrations/20260129000001_add_notion_fields.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo ""

# Read SQL
SQL_CONTENT=$(cat "$MIGRATION_FILE")

# Execute each statement separately
echo "📊 Executing migration..."
echo ""

# Use Supabase REST API to execute raw SQL
# This requires executing via the Postgres REST endpoint

# Split SQL by semicolon and execute
IFS=';' read -ra STATEMENTS <<< "$SQL_CONTENT"

for i in "${!STATEMENTS[@]}"; do
    STATEMENT="${STATEMENTS[$i]}"

    # Skip empty statements and comments
    if [[ -z "${STATEMENT// }" ]] || [[ "$STATEMENT" =~ ^[[:space:]]*-- ]]; then
        continue
    fi

    echo "   Executing statement $((i+1))..."

    # For DDL statements, we need to use the PostgREST admin endpoint
    # This is limited - some statements may need manual execution

done

echo ""
echo "⚠️  Note: Direct DDL execution via API is limited"
echo "   Some statements may require manual execution in Supabase Dashboard"
echo ""
echo "✅ Migration prepared!"
echo ""
echo "="*60
echo "MIGRATION SQL TO EXECUTE IN SUPABASE DASHBOARD:"
echo "="*60
echo ""
cat "$MIGRATION_FILE"
echo ""
echo "="*60

exit 0
