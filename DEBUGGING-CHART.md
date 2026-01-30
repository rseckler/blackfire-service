# Debugging Chart Issues

## Problem
Chart nicht sichtbar auf: http://localhost:3000/stocks/51c7417a-0ce7-4361-a6cb-654dae1f254f

## Diagnostics Completed

### ✅ Company has Symbol
```
Company: TESLA, INC.
Symbol: TSLA
Status: ✅ Valid
```

### ✅ API Endpoint Works
```bash
curl "http://localhost:3000/api/stocks/51c7417a-0ce7-4361-a6cb-654dae1f254f/prices?timeframe=1M"
# Returns: 19 data points for TSLA
```

### ✅ Page Loads Successfully
```
GET /stocks/51c7417a-0ce7-4361-a6cb-654dae1f254f 200
```

## Next Steps to Debug

### 1. Check Browser Console
Open browser DevTools (F12) and look for:
- **Console Tab**: Look for these debug messages:
  ```
  📊 Chart Debug: { companyId, symbol, timeframe, hasData, ... }
  🎨 Initializing chart...
  ✅ Candlestick series created
  ✅ Volume series created
  📈 Updating chart data: { hasData, dataLength, ... }
  ```
- **Errors**: Any red error messages?
- **Warnings**: Any yellow warnings?

### 2. Check Network Tab
- Filter by "prices"
- Look for request to: `/api/stocks/51c7417a-0ce7-4361-a6cb-654dae1f254f/prices?timeframe=1M`
- Status: Should be 200
- Response: Should contain `data` array with price data

### 3. Check React DevTools (if installed)
- Find `StockPriceChart` component
- Check props: `companyId`, `symbol`, `companyName`
- Check state: `timeframe`, data from `useStockChartData`

### 4. Common Issues to Check

#### Issue: Chart Container Not Rendering
**Symptom**: No chart div in DOM
**Check**: Inspect element - look for `<div ref={chartContainerRef}>`
**Solution**: Check if component is actually mounted

#### Issue: Chart Data Not Loading
**Symptom**: Console shows "No data to display"
**Check**:
```javascript
console.log('hasData:', !!data)
console.log('dataLength:', data?.data?.length)
```
**Solution**: Check API response format

#### Issue: TradingView Library Not Loading
**Symptom**: "createChart is not a function"
**Check**: Console errors about `lightweight-charts`
**Solution**:
```bash
npm install lightweight-charts@^4.2.2
```

#### Issue: Chart Height is 0
**Symptom**: Chart container exists but height is 0px
**Check**: Inspect element and check computed height
**Solution**: Ensure parent has height or chart has explicit height

#### Issue: CSS/Styling Issues
**Symptom**: Chart hidden by CSS
**Check**: Computed styles - look for `display: none`, `visibility: hidden`, `opacity: 0`
**Solution**: Check Tailwind classes on chart container

### 5. Manual Test Commands

```bash
# Test API endpoint
curl "http://localhost:3000/api/stocks/51c7417a-0ce7-4361-a6cb-654dae1f254f/prices?timeframe=1M" | jq

# Check company data
node scripts/check-company-symbol.js 51c7417a-0ce7-4361-a6cb-654dae1f254f

# Check Alpha Vantage API
node scripts/test-alpha-vantage.js TSLA
```

### 6. Fallback: Minimal Test Component

If issues persist, create a minimal test:

```typescript
// Test file: src/app/(dashboard)/stocks/[id]/test-chart.tsx
'use client'

import { useEffect } from 'react'

export default function TestChart() {
  useEffect(() => {
    console.log('🧪 Test Component Mounted')

    // Test 1: Can we import the library?
    import('lightweight-charts').then(module => {
      console.log('✅ lightweight-charts imported:', !!module.createChart)
    }).catch(err => {
      console.error('❌ Failed to import lightweight-charts:', err)
    })

    // Test 2: Can we fetch data?
    fetch('/api/stocks/51c7417a-0ce7-4361-a6cb-654dae1f254f/prices?timeframe=1M')
      .then(res => res.json())
      .then(data => {
        console.log('✅ API data received:', data.data.length, 'points')
      })
      .catch(err => {
        console.error('❌ API fetch failed:', err)
      })
  }, [])

  return <div>Check console for test results</div>
}
```

## Expected Console Output (Working Chart)

```
📊 Chart Debug: {
  companyId: "51c7417a-0ce7-4361-a6cb-654dae1f254f",
  symbol: "TSLA",
  timeframe: "1M",
  hasData: true,
  dataLength: 19,
  isLoading: false,
  isError: false
}

🎨 Initializing chart...
✅ Candlestick series created
✅ Volume series created
✅ Chart initialized successfully

📈 Updating chart data: {
  hasData: true,
  dataLength: 19,
  hasCandlestickSeries: true,
  hasVolumeSeries: true,
  hasChart: true
}

🔄 Transformed data: {
  candlestickPoints: 19,
  volumePoints: 19,
  sampleCandle: { time: "2026-01-02", open: 457.8, high: 458.34, ... },
  sampleVolume: { time: "2026-01-02", value: 85535406, color: "#ef5350" }
}

✅ Candlestick data set
✅ Volume data set
✅ Chart fitted to content
```

## What to Send Me

Please copy and paste:
1. All console logs (especially those starting with 📊, 🎨, 📈, ✅, ❌, ⚠️)
2. Any error messages (red text in console)
3. Network tab: Status and response for the `/prices` request
4. Screenshot of the page (if possible)

This will help me identify the exact issue!
