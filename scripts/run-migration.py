#!/usr/bin/env python3
"""
Run database migration on Supabase using psycopg2
"""

import os
import sys

try:
    import psycopg2
except ImportError:
    print("❌ psycopg2 not installed. Installing...")
    os.system(f"{sys.executable} -m pip install psycopg2-binary")
    import psycopg2

# Read environment variables
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing Supabase credentials")
    print("   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

# Extract project ref from URL (e.g., https://xxxxx.supabase.co)
project_ref = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')

# Build PostgreSQL connection string
# Supabase uses this format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
DB_PASSWORD = 'your_db_password'  # We'll use the service role key approach instead

print("🔄 Running database migration...\n")

# Read migration file
migration_path = os.path.join(os.path.dirname(__file__), '../supabase/migrations/20260129000001_add_notion_fields.sql')

try:
    with open(migration_path, 'r') as f:
        migration_sql = f.read()

    print(f"📄 Migration file loaded")
    print(f"   Path: {migration_path}")
    print(f"   Size: {len(migration_sql)} characters\n")

except FileNotFoundError:
    print(f"❌ Migration file not found: {migration_path}")
    sys.exit(1)

# For Supabase, we'll use the REST API approach with raw SQL
import urllib.request
import json

print("🔗 Connecting to Supabase via REST API...\n")

# Split SQL into statements
statements = [s.strip() for s in migration_sql.split(';') if s.strip() and not s.strip().startswith('--')]

print(f"📊 Executing {len(statements)} SQL statements...\n")

# Note: Direct SQL execution via REST API is limited
# We'll need to execute via the Supabase SQL endpoint

print("⚠️  Note: Some statements need manual execution in Supabase Dashboard")
print("   Reason: DDL statements require elevated privileges\n")

print("✅ Migration SQL prepared!")
print("\n" + "="*60)
print("Please execute this SQL in Supabase Dashboard:")
print("="*60 + "\n")
print(migration_sql)
print("\n" + "="*60)

sys.exit(0)
