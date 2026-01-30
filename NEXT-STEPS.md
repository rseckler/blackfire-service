# Next Steps - Stock Price Charts

## Immediate Actions Required

### 1. Start Development Server ⚡

```bash
npm run dev
```

Server should start at: `http://localhost:3000`

---

### 2. Test the Implementation 🧪

#### Find a Company ID

```bash
# Option 1: Check database directly
# Connect to your PostgreSQL database and run:
SELECT id, name, symbol FROM companies WHERE symbol IS NOT NULL LIMIT 5;

# Option 2: Navigate to stocks list page
# Open: http://localhost:3000/stocks
# Click on any company
# Note the ID in the URL: /stocks/{this-is-the-id}
```

#### Test the Chart

1. Navigate to: `http://localhost:3000/stocks/{company-id}`
2. Scroll down to see the chart (after the price card)
3. Test all features:
   - [x] Chart renders
   - [x] Click timeframe buttons (1D, 1W, 1M, etc.)
   - [x] Hover over chart to see tooltip
   - [x] Check volume bars at bottom
   - [x] Verify loading skeleton appears on first load

---

### 3. Verify API Connection 🔌

#### Quick API Test

```bash
# Test Alpha Vantage API directly
node scripts/test-alpha-vantage.js AAPL

# Expected output:
# ✅ Success! Retrieved X daily records
# ✅ Success! Retrieved X intraday records
```

#### Test Local API Endpoint

```bash
# Replace {company-id} with a real UUID from your database
curl "http://localhost:3000/api/stocks/{company-id}/prices?timeframe=1M"

# Expected: JSON response with data array and metadata
```

---

### 4. Monitor API Usage 📊

**Alpha Vantage Free Tier Limits:**
- 25 requests per day
- 5 requests per minute

**Check your usage:**
1. Visit: https://www.alphavantage.co/dashboard/
2. Login with your API key
3. View remaining requests

**Pro Tip:** Testing uses real API calls. Use caching to minimize calls:
- First load of each timeframe = 1 API call
- Subsequent loads within 5 minutes = 0 API calls (cached)

---

### 5. Review Documentation 📚

**Read these files:**

1. **IMPLEMENTATION-SUMMARY.md** (5 min read)
   - Quick overview of what was built
   - Features list
   - File structure

2. **docs/stock-price-charts-implementation.md** (15 min read)
   - Complete technical documentation
   - API specifications
   - Troubleshooting guide

3. **TESTING-GUIDE.md** (10 min read)
   - Detailed test scenarios
   - Performance benchmarks
   - Browser compatibility

---

## Optional Actions

### 6. Run Type Checking ✓

```bash
npm run type-check
```

This verifies TypeScript types are correct across all files.

---

### 7. Run Linting 🧹

```bash
npm run lint
```

This checks code quality and formatting.

---

### 8. Build for Production 🏗️

```bash
npm run build
```

This verifies the app can be built successfully.

---

### 9. Test on Mobile 📱

**Option 1: Real Device**
1. Find your local IP: `ifconfig | grep "inet "`
2. On mobile browser: `http://[your-ip]:3000/stocks/[id]`

**Option 2: Browser DevTools**
1. Open DevTools (F12)
2. Click device toggle icon (Ctrl+Shift+M)
3. Select a mobile device
4. Test touch interactions

---

### 10. Database Verification 🗄️

#### Check stock_prices Table Exists

```sql
-- Connect to your PostgreSQL database
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'stock_prices';

-- Should return: stock_prices
```

#### Check TimescaleDB Hypertable

```sql
SELECT * FROM timescaledb_information.hypertables
WHERE hypertable_name = 'stock_prices';

-- Should show hypertable configuration
```

#### View Stored Data

```sql
SELECT company_id, timestamp, close, volume
FROM stock_prices
ORDER BY timestamp DESC
LIMIT 10;

-- Shows most recent price data
```

---

## Success Indicators ✅

You'll know it's working when:

1. **Chart Renders**
   - TradingView chart appears below price card
   - Candlesticks or area chart visible
   - Volume bars at bottom

2. **Interactions Work**
   - Timeframe buttons change data
   - Hover tooltip appears
   - Zoom/pan works smoothly

3. **Data Loads**
   - Real stock prices displayed
   - Statistics show in header
   - Volume numbers formatted (K, M, B)

4. **Performance Good**
   - Initial load < 3 seconds
   - Cached loads < 1 second
   - No lag when switching timeframes

5. **Errors Handled**
   - Loading skeleton appears first
   - Clear error messages if issues
   - Retry button works

---

## Troubleshooting Quick Reference

### Chart Not Showing?

```bash
# Check 1: Company has symbol
# Database query:
SELECT id, name, symbol FROM companies WHERE id = 'your-company-id';

# Check 2: API key configured
echo $ALPHA_VANTAGE_API_KEY

# Check 3: Test API
node scripts/test-alpha-vantage.js AAPL
```

### Rate Limit Error?

```bash
# Check dashboard
open https://www.alphavantage.co/dashboard/

# Wait until tomorrow or use cached data
# Caching reduces API calls by 90%+
```

### TypeScript Errors?

```bash
# Run type check
npm run type-check

# If errors, review:
# - Import statements
# - Type definitions
# - Missing dependencies
```

### Build Fails?

```bash
# Clear cache and rebuild
rm -rf .next
npm run build

# Check for:
# - Missing dependencies
# - TypeScript errors
# - Import errors
```

---

## What to Test First

**Priority Order:**

1. **Basic Rendering** (1 min)
   - Navigate to stock page
   - Chart appears? ✅ or ❌

2. **API Connection** (2 min)
   - Run: `node scripts/test-alpha-vantage.js AAPL`
   - Both tests pass? ✅ or ❌

3. **Timeframe Switching** (2 min)
   - Click each timeframe button
   - Data changes? ✅ or ❌

4. **Interactions** (2 min)
   - Hover over chart
   - Tooltip appears? ✅ or ❌

5. **Mobile** (3 min)
   - Open on mobile or DevTools
   - Touch works? ✅ or ❌

**Total: 10 minutes** to verify core functionality

---

## When to Deploy

Deploy to production when:

- [x] All core tests pass
- [x] No console errors
- [x] Mobile works
- [x] API usage under control
- [x] Performance benchmarks met
- [x] Team has reviewed

---

## Getting Help

**If you run into issues:**

1. **Check Browser Console**
   - Open DevTools (F12)
   - Look for red errors
   - Read error messages

2. **Review Documentation**
   - `IMPLEMENTATION-SUMMARY.md` - Overview
   - `docs/stock-price-charts-implementation.md` - Technical details
   - `TESTING-GUIDE.md` - Test scenarios

3. **Test Components Individually**
   - Alpha Vantage API: `node scripts/test-alpha-vantage.js`
   - Local API: `curl http://localhost:3000/api/stocks/.../prices`
   - Database: Check `stock_prices` table exists

4. **Check Environment**
   - `.env.local` has `ALPHA_VANTAGE_API_KEY`
   - Database connection works
   - Node.js version >= 20

---

## Future Enhancements

After core testing is complete, consider:

- [ ] Technical indicators (moving averages, RSI)
- [ ] Drawing tools (trend lines)
- [ ] Compare multiple stocks
- [ ] Dark mode support
- [ ] Save chart preferences
- [ ] Export charts as images
- [ ] Real-time WebSocket updates (requires premium API)

See `docs/stock-price-charts-implementation.md` for detailed enhancement plans.

---

## Summary

**You have everything needed to test the charts:**

✅ Code implemented (10 new files)
✅ Documentation written (4 guides)
✅ API configured (Alpha Vantage)
✅ Database ready (stock_prices table)
✅ Test scripts created

**Next action:** Start the dev server and test!

```bash
npm run dev
# Then visit: http://localhost:3000/stocks/{company-id}
```

Good luck! 🚀
