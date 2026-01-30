# Symbol Population Service

Automatically populates the `symbol` field in the `companies` table from existing data.

## Overview

Many companies in the database have empty `symbol` fields, but contain symbol information in other fields like `extra_data` (JSONB), `wkn`, or `isin`. This service automatically extracts and populates the symbol field.

## Data Sources Priority

The service looks for symbols in the following priority order:

1. **Company Symbol** (from `extra_data` JSONB)
2. **Ticker** (from `extra_data` JSONB)
3. **Symbol** (from `extra_data` JSONB)
4. **Stock_Symbol** (from `extra_data` JSONB)
5. **WKN** (from `companies.wkn` field)
6. **ISIN** (from `companies.isin` field - used with caution)

## Automated Execution

The service runs automatically via cron multiple times daily:

- **Every 4 hours**: Symbol population (`populate_symbols.py`)
- **Every 12 hours**: Excel to PostgreSQL sync
- **Hourly (9-17 UTC, Mon-Fri)**: Stock price updates

## Files

### Scripts
- `scripts/populate_symbols.py` - Main symbol population script
- `scripts/manage-symbols.sh` - Management commands
- `crontab` - Cron schedule configuration

### Docker
- `Dockerfile.cron` - Cron service container
- `docker-compose.prod.yml` - Includes cron service
- `requirements.txt` - Python dependencies

## Usage

### Manual Commands

```bash
# Test what would be populated (dry-run)
./scripts/manage-symbols.sh test

# Populate symbols (live)
./scripts/manage-symbols.sh populate

# Populate up to 50 companies only
./scripts/manage-symbols.sh populate-limited

# Check cron service status
./scripts/manage-symbols.sh status

# View cron logs
./scripts/manage-symbols.sh logs

# Restart cron service
./scripts/manage-symbols.sh restart
```

### Direct Python Script

```bash
# Dry run
python3 scripts/populate_symbols.py --dry-run

# Live run
python3 scripts/populate_symbols.py

# Limited run (50 companies)
python3 scripts/populate_symbols.py --limit 50
```

## Deployment

### First Time Setup

1. Ensure environment variables are set in `.env.production`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Deploy to VPS:
   ```bash
   ./scripts/deploy-vps.sh
   ```

   This will automatically:
   - Build the cron service container
   - Start the cron daemon
   - Begin scheduled symbol population

### Updating the Service

After making changes to the script or cron schedule:

```bash
# Rebuild and restart
docker compose -f docker-compose.prod.yml build cron
docker compose -f docker-compose.prod.yml up -d cron

# Or use full deployment
./scripts/deploy-vps.sh
```

## Monitoring

### Check Service Status

```bash
docker ps --filter name=blackfire-cron
```

### View Logs

```bash
# Follow live logs
docker logs -f blackfire-cron

# Or use management script
./scripts/manage-symbols.sh logs
```

### View Cron Execution Logs

```bash
# Inside container
docker exec blackfire-cron tail -f /var/log/blackfire/cron.log

# Or mount the volume locally
docker volume inspect blackfire_cron_logs
```

### Manual Test Inside Container

```bash
# Enter container
docker exec -it blackfire-cron bash

# Run script manually
python3 scripts/populate_symbols.py --dry-run
```

## Cron Schedule

Current schedule (from `crontab`):

```cron
# Symbol Population - Every 4 hours
0 */4 * * * python3 scripts/populate_symbols.py

# Excel Sync - Every 12 hours
0 */12 * * * python3 scripts/sync_excel_to_postgres.py

# Stock Prices - Hourly during market hours (9-17 UTC, Mon-Fri)
0 9-17 * * 1-5 python3 scripts/update_stock_prices.py
```

To modify the schedule:
1. Edit `crontab`
2. Rebuild the cron container
3. Restart the service

## Troubleshooting

### Symbols Not Being Populated

1. Check if companies have data in `extra_data`:
   ```sql
   SELECT name, extra_data FROM companies WHERE symbol IS NULL LIMIT 10;
   ```

2. Check for symbol fields in extra_data:
   ```sql
   SELECT
     name,
     extra_data->'Company Symbol' as company_symbol,
     extra_data->'Ticker' as ticker,
     wkn,
     isin
   FROM companies
   WHERE symbol IS NULL
   LIMIT 10;
   ```

3. Run a dry-run to see what would be populated:
   ```bash
   ./scripts/manage-symbols.sh test
   ```

### Cron Not Running

1. Check if container is running:
   ```bash
   docker ps | grep cron
   ```

2. Check cron daemon status inside container:
   ```bash
   docker exec blackfire-cron ps aux | grep cron
   ```

3. Restart the service:
   ```bash
   ./scripts/manage-symbols.sh restart
   ```

### Environment Variables Not Loaded

The cron container loads environment variables from `.env.production`. Ensure:

1. File exists and is mounted in `docker-compose.prod.yml`
2. Contains required variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. Rebuild after changes:
   ```bash
   docker compose -f docker-compose.prod.yml build cron
   docker compose -f docker-compose.prod.yml up -d cron
   ```

## Performance

- **Processing Speed**: ~10-50 companies per second (database dependent)
- **Memory Usage**: ~50-100MB
- **Disk I/O**: Minimal (only database operations)
- **Network**: Only Supabase API calls (if using hosted Supabase)

## Statistics

After each run, the script outputs statistics:

```
📊 STATISTICS
======================================================================
Duration: 2.3s
Total Companies Checked: 150
Missing Symbols: 150
Symbols Populated: 120
Symbols Skipped: 30
Errors: 0
Success Rate: 80.0%
======================================================================
```

## Future Enhancements

- [ ] Add fallback to external APIs (OpenFIGI, Alpha Vantage) for symbols not found
- [ ] Implement symbol validation against stock exchanges
- [ ] Add notification system for high error rates
- [ ] Create dashboard for monitoring symbol population status
- [ ] Implement machine learning for better symbol extraction from text fields
