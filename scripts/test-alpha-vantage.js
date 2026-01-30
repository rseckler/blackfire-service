/**
 * Test Alpha Vantage API
 *
 * Usage: node scripts/test-alpha-vantage.js [SYMBOL]
 * Example: node scripts/test-alpha-vantage.js AAPL
 */

const https = require('https');

// Get API key from environment or use default
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'OQC14NN6ENR1LFZD';
const SYMBOL = process.argv[2] || 'AAPL';

console.log(`Testing Alpha Vantage API with symbol: ${SYMBOL}\n`);

// Test 1: Daily prices
function testDaily() {
  return new Promise((resolve, reject) => {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${SYMBOL}&apikey=${API_KEY}`;

    console.log('Test 1: Daily prices');
    console.log('URL:', url);

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);

          if (json['Error Message']) {
            console.log('❌ Error:', json['Error Message']);
            reject(json['Error Message']);
          } else if (json['Note']) {
            console.log('⚠️  Rate limit:', json['Note']);
            reject(json['Note']);
          } else if (json['Time Series (Daily)']) {
            const dates = Object.keys(json['Time Series (Daily)']);
            console.log('✅ Success! Retrieved', dates.length, 'daily records');
            console.log('Latest date:', dates[0]);
            console.log('Sample data:', json['Time Series (Daily)'][dates[0]]);
            resolve(json);
          } else {
            console.log('❓ Unexpected response:', json);
            reject('Unexpected response');
          }
        } catch (err) {
          console.log('❌ Parse error:', err.message);
          reject(err);
        }
        console.log('');
      });
    }).on('error', (err) => {
      console.log('❌ Request error:', err.message);
      reject(err);
    });
  });
}

// Test 2: Intraday prices
function testIntraday() {
  return new Promise((resolve, reject) => {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${SYMBOL}&interval=5min&apikey=${API_KEY}`;

    console.log('Test 2: Intraday prices (5min)');
    console.log('URL:', url);

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);

          if (json['Error Message']) {
            console.log('❌ Error:', json['Error Message']);
            reject(json['Error Message']);
          } else if (json['Note']) {
            console.log('⚠️  Rate limit:', json['Note']);
            reject(json['Note']);
          } else if (json['Time Series (5min)']) {
            const timestamps = Object.keys(json['Time Series (5min)']);
            console.log('✅ Success! Retrieved', timestamps.length, 'intraday records');
            console.log('Latest timestamp:', timestamps[0]);
            console.log('Sample data:', json['Time Series (5min)'][timestamps[0]]);
            resolve(json);
          } else {
            console.log('❓ Unexpected response:', json);
            reject('Unexpected response');
          }
        } catch (err) {
          console.log('❌ Parse error:', err.message);
          reject(err);
        }
        console.log('');
      });
    }).on('error', (err) => {
      console.log('❌ Request error:', err.message);
      reject(err);
    });
  });
}

// Run tests
async function runTests() {
  try {
    await testDaily();

    console.log('Note: Intraday data is premium-only, skipping that test.\n');
    console.log('✅ Daily test passed!\n');
    console.log('API Key is working correctly.');
    console.log('Free tier limit: 25 requests/day, 5 requests/minute');
    console.log('Free tier supports: DAILY, WEEKLY, MONTHLY (no intraday)');
  } catch (err) {
    console.log('\n❌ Tests failed');
    process.exit(1);
  }
}

runTests();
