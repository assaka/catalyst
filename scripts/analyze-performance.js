#!/usr/bin/env node

/**
 * Performance Analysis Script
 * Identifies bottlenecks, duplicate calls, and slow queries
 *
 * Usage:
 *   node scripts/analyze-performance.js https://catalyst-pearl.vercel.app/public/hamid2/product/kenwood...
 *
 * Or install puppeteer first:
 *   npm install --save-dev puppeteer
 */

const https = require('https');
const http = require('http');

const TARGET_URL = process.argv[2] || 'https://catalyst-pearl.vercel.app';

console.log('🔍 Performance Analysis Tool');
console.log('============================\n');
console.log(`Target: ${TARGET_URL}\n`);

// Simple HTTP request tracker without puppeteer
async function analyzeWithoutPuppeteer() {
  console.log('📊 Basic Analysis (no puppeteer)\n');

  const tests = [
    {
      name: 'Backend Health Check',
      url: 'https://catalyst-backend-fzhu.onrender.com/health',
    },
    {
      name: 'Cache Health Check',
      url: 'https://catalyst-backend-fzhu.onrender.com/health/cache',
    },
    {
      name: 'Database Health Check',
      url: 'https://catalyst-backend-fzhu.onrender.com/health/db',
    },
  ];

  for (const test of tests) {
    await testEndpoint(test.name, test.url);
  }
}

function testEndpoint(name, url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const client = url.startsWith('https') ? https : http;

    console.log(`\n📍 ${name}`);
    console.log(`   URL: ${url}`);

    const req = client.get(url, (res) => {
      const duration = Date.now() - start;
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Time: ${duration}ms`);

        if (duration > 1000) {
          console.log(`   ⚠️  SLOW (>1s)`);
        } else if (duration > 500) {
          console.log(`   ⚠️  Moderate (>500ms)`);
        } else {
          console.log(`   ✅ Fast`);
        }

        try {
          const json = JSON.parse(data);
          if (json.redis) {
            console.log(`   Redis: ${json.redis.connected ? '✅ Connected' : '❌ Disconnected'}`);
            if (json.stats?.redis?.keys !== undefined) {
              console.log(`   Cached Keys: ${json.stats.redis.keys}`);
            }
          }
        } catch (e) {
          // Not JSON
        }

        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      resolve();
    });

    req.setTimeout(10000, () => {
      console.log(`   ❌ Timeout (>10s)`);
      req.destroy();
      resolve();
    });
  });
}

// Main function
(async () => {
  try {
    await analyzeWithoutPuppeteer();

    console.log('\n\n📋 RECOMMENDATIONS:\n');
    console.log('1. Check Render logs for slow queries:');
    console.log('   Dashboard → catalyst-backend → Logs');
    console.log('   Look for: "SLOW QUERY" or queries >100ms\n');

    console.log('2. Enable database query logging:');
    console.log('   Set DB_QUERY_LOG=true in Render environment\n');

    console.log('3. Use browser tools:');
    console.log('   - Open DevTools → Network tab');
    console.log('   - Visit your product page');
    console.log('   - Sort by "Time" to find slow requests\n');

    console.log('4. Use React Query DevTools:');
    console.log('   - Look for red flower icon on page');
    console.log('   - Check "Observers" count for duplicates\n');

    console.log('5. Run Lighthouse test:');
    console.log(`   npx lighthouse ${TARGET_URL} --view\n`);

    console.log('📖 Full guide: BOTTLENECK_IDENTIFICATION_GUIDE.md');

  } catch (error) {
    console.error('Error:', error);
  }
})();
