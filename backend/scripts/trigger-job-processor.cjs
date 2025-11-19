#!/usr/bin/env node

/**
 * Simple Cron Script - Triggers Job Processing Endpoint
 *
 * This script simply calls the backend API endpoint that processes all pending jobs.
 * Much simpler than having multiple cron services!
 *
 * Runs every minute via Render cron: "* * * * *"
 */

require('dotenv').config();
const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

async function triggerJobProcessor() {
  console.log('🔄 Triggering job processor endpoint...');
  console.log(`   Backend: ${BACKEND_URL}`);

  const url = new URL('/api/jobs/process-pending', BACKEND_URL);
  const protocol = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cron-Secret': CRON_SECRET
      },
      timeout: 55000 // 55 second timeout
    };

    const req = protocol.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            console.log('✅ Job processor completed successfully');
            console.log(`   - Processed: ${result.processed || 0} job(s)`);
            console.log(`   - Duration: ${result.duration || 0}ms`);
            resolve(result);
          } catch (error) {
            console.log('✅ Job processor completed (no jobs)');
            resolve({ processed: 0 });
          }
        } else {
          console.error(`❌ Job processor failed with status: ${res.statusCode}`);
          console.error(`   Response: ${data}`);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('❌ Request timeout after 55 seconds');
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Run the script
(async () => {
  try {
    await triggerJobProcessor();
    console.log('✅ Cron script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cron script failed:', error.message);
    // Exit with 0 anyway to avoid spam errors in Render
    // The endpoint will log the actual errors
    process.exit(0);
  }
})();
