# Stock Price Charts - Testing Guide

## Quick Start

### Prerequisites
- Development server running: `npm run dev`
- Database migrations applied
- Alpha Vantage API key configured in `.env.local`

## Test Scenarios

### 1. Basic Chart Rendering

**Test:** Chart displays on stock detail page

**Steps:**
1. Navigate to any stock detail page: `http://localhost:3000/stocks/[company-id]`
2. Scroll down to find the chart after the price card
3. Chart should load automatically

**Expected Result:**
- Loading skeleton appears briefly
- Chart renders with candlestick/area visualization
- Volume bars display at bottom
- Timeframe selector shows above chart
- Price statistics display in header

**Fail Conditions:**
- Chart doesn't render
- Error message appears immediately
- Loading state never completes

---

### 2. Timeframe Switching

**Test:** All 7 timeframes work correctly

**Steps:**
1. On stock detail page with chart visible
2. Click each timeframe button: 1D, 1W, 1M, 3M, 6M, 1Y, ALL
3. Wait for each to load

**Expected Result:**
- Each timeframe loads new data
- Chart type changes (1D = area, others = candlestick)
- Data points match timeframe (1D has hourly data, 1Y has daily)
- Active button highlighted
- Smooth transitions between timeframes

**Fail Conditions:**
- Timeframe doesn't change data
- Chart crashes on timeframe switch
- Wrong data displayed for timeframe

---

### 3. Interactive Features

**Test:** Hover tooltips and interactions

**Steps:**
1. Hover mouse over chart
2. Move mouse across different candles/areas
3. Try scrolling/zooming

**Expected Result:**
- Crosshair follows mouse
- Tooltip shows:
  - Date/Time
  - Open, High, Low, Close prices
  - Volume
- Can zoom with mouse wheel
- Can pan by dragging

**Fail Conditions:**
- Tooltip doesn't appear
- Crosshair doesn't move
- Zoom/pan doesn't work

---

### 4. Mobile Responsiveness

**Test:** Chart works on mobile devices

**Steps:**
1. Open on mobile device or use browser DevTools mobile mode
2. View stock detail page
3. Test touch interactions

**Expected Result:**
- Chart resizes to fit screen (350px height)
- Timeframe buttons accessible
- Pinch-to-zoom works
- Pan with touch works
- No horizontal scrolling issues

**Fail Conditions:**
- Chart too small/large
- Buttons overflow
- Touch gestures don't work
- Layout broken

---

### 5. Loading States

**Test:** Loading skeleton appears

**Steps:**
1. Clear browser cache
2. Navigate to stock detail page
3. Observe chart loading

**Expected Result:**
- Animated skeleton appears immediately
- Shimmer effect visible
- "Loading chart data..." text shown
- Skeleton matches chart dimensions

**Fail Conditions:**
- Blank space during loading
- No loading indicator
- Layout shift when chart loads

---

### 6. Error Handling

**Test:** Error states display correctly

**Steps:**
1. Test with invalid stock symbol
2. Test when API rate limit reached
3. Test with network disconnected

**Expected Result:**
- Error message displays clearly
- Retry button appears (when applicable)
- Rate limit warning shows remaining time
- Fallback to cached data when available

**Fail Conditions:**
- Raw error exposed to user
- No way to retry
- App crashes on error

---

### 7. Caching Performance

**Test:** Data caching reduces API calls

**Steps:**
1. Open stock detail page (initial load)
2. Switch to different timeframe
3. Switch back to original timeframe
4. Check Network tab in DevTools

**Expected Result:**
- First load fetches from API
- Second load uses cache (instant)
- Cache hits shown in Network tab as "(disk cache)" or "(memory cache)"
- No duplicate API calls

**Fail Conditions:**
- Every timeframe switch fetches from API
- No caching occurs
- Slow performance

---

### 8. API Rate Limiting

**Test:** Rate limit handling works

**Steps:**
1. Make 25+ API calls in one day
2. Try to load new stock chart
3. Observe behavior

**Expected Result:**
- Warning message appears: "API rate limit reached"
- Cached data shown if available
- Clear message about free tier limit
- No crash or broken UI

**Fail Conditions:**
- App crashes on rate limit
- No warning shown
- Empty chart with no explanation

---

### 9. Price Statistics

**Test:** Statistics calculate correctly

**Steps:**
1. View chart with real data
2. Check header statistics
3. Compare with external source (Yahoo Finance, etc.)

**Expected Result:**
- Current price displayed
- Price change % shown
- Color coded (green up, red down)
- High/Low/Range accurate
- Volume formatted (K, M, B)

**Fail Conditions:**
- Statistics wrong
- Formatting broken
- Missing data

---

### 10. Accessibility

**Test:** Keyboard navigation and screen readers

**Steps:**
1. Use Tab key to navigate
2. Use Enter/Space to select timeframes
3. Test with screen reader (VoiceOver, NVDA)

**Expected Result:**
- Can tab to timeframe buttons
- Focus indicators visible
- ARIA labels present
- Screen reader announces changes
- Keyboard shortcuts work

**Fail Conditions:**
- Cannot navigate with keyboard
- No focus indicators
- Screen reader doesn't work
- Poor accessibility

---

## Performance Benchmarks

### Target Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Chart render time | < 1 second | DevTools Performance tab |
| API response (cached) | < 500ms | Network tab |
| API response (uncached) | < 3 seconds | Network tab |
| Memory usage | < 50MB | DevTools Memory tab |
| No memory leaks | 0 MB after 20 switches | Memory profiler |

### Performance Testing

1. **Render Time**
   ```javascript
   // Open DevTools Console
   console.time('chart-render')
   // Navigate to stock page
   // When chart appears:
   console.timeEnd('chart-render')
   // Should be < 1000ms
   ```

2. **Memory Leaks**
   ```
   1. Open DevTools Memory tab
   2. Take heap snapshot
   3. Switch timeframes 20 times
   4. Take another heap snapshot
   5. Compare - should be similar size
   ```

3. **API Caching**
   ```
   1. Open Network tab
   2. Load chart - check response time
   3. Switch timeframe and back
   4. Should show "(from cache)" instantly
   ```

---

## Browser Compatibility

Test on these browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Test Data

### Valid US Stock Symbols

Use these for testing:

- **AAPL** - Apple Inc. (Tech, high volume)
- **MSFT** - Microsoft (Tech, stable)
- **TSLA** - Tesla (Auto, volatile)
- **GOOGL** - Alphabet (Tech, high price)
- **AMZN** - Amazon (Tech, wide range)

### Invalid Symbols

Test error handling with:

- **INVALID** - Should show error
- **XXXYYY** - Should show "symbol not found"

---

## Common Issues & Solutions

### Chart Not Rendering

**Symptom:** Blank space where chart should be

**Check:**
1. Browser console for errors
2. Company has `symbol` field in database
3. Alpha Vantage API key in `.env.local`
4. Network tab shows API call

**Solution:**
```bash
# Verify API key
echo $ALPHA_VANTAGE_API_KEY

# Test API directly
node scripts/test-alpha-vantage.js AAPL
```

### Rate Limit Errors

**Symptom:** "Rate limit reached" error

**Check:**
1. How many API calls made today
2. Alpha Vantage dashboard

**Solution:**
- Wait until tomorrow (resets at midnight UTC)
- Use cached data in meantime
- Consider API upgrade if testing heavily

### Slow Performance

**Symptom:** Chart takes > 3 seconds to load

**Check:**
1. Network speed
2. Database query time
3. Too many data points

**Solution:**
- Check database indexes
- Test with smaller timeframes
- Clear browser cache

### TypeScript Errors

**Symptom:** Build fails with type errors

**Check:**
```bash
npm run type-check
```

**Solution:**
- Review error messages
- Check imports
- Verify TypeScript version

---

## API Testing

### Test Alpha Vantage Directly

```bash
# Test script (Node.js)
node scripts/test-alpha-vantage.js AAPL

# Manual curl test
curl "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=AAPL&apikey=$ALPHA_VANTAGE_API_KEY"
```

### Test Local API

```bash
# Get company ID from database
# Then test endpoint:

curl "http://localhost:3000/api/stocks/{company-id}/prices?timeframe=1M"
```

**Expected Response:**
```json
{
  "data": [...],
  "metadata": {
    "symbol": "AAPL",
    "lastUpdate": "2024-01-30T10:00:00Z",
    "dataSource": "api",
    "isFresh": true
  }
}
```

---

## Debugging Tips

### Enable Debug Logging

```typescript
// In stock-price-service.ts, add:
console.log('Fetching prices:', { companyId, timeframe })
console.log('Database result:', dbData)
console.log('API result:', apiData)
```

### Check React Query Cache

```javascript
// In browser console:
window.__REACT_QUERY_DEVTOOLS__ = true
// Reload page
// React Query DevTools panel appears
```

### Monitor API Usage

```bash
# Check Alpha Vantage dashboard:
https://www.alphavantage.co/dashboard/

# Or check database for stored data:
# SELECT COUNT(*) FROM stock_prices WHERE company_id = 'xxx';
```

---

## Sign-Off Checklist

Before marking as complete:

- [ ] All 10 test scenarios pass
- [ ] Tested on 3+ browsers
- [ ] Mobile testing complete
- [ ] Performance benchmarks met
- [ ] No console errors
- [ ] Accessibility verified
- [ ] API usage monitored
- [ ] Documentation reviewed
- [ ] Team demo completed

---

## Support

If you encounter issues:

1. Check browser console first
2. Review this testing guide
3. Test API directly with script
4. Check Alpha Vantage API status
5. Review implementation documentation

**Documentation:**
- `docs/stock-price-charts-implementation.md` - Full technical docs
- `IMPLEMENTATION-SUMMARY.md` - Quick overview
- `scripts/test-alpha-vantage.js` - API testing tool
