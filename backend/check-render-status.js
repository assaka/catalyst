#!/usr/bin/env node

/**
 * Check Render.com deployment status and database connection
 */

const https = require('https');

async function checkRenderStatus() {
  console.log('🔍 Checking Render.com deployment status...\n');
  
  const backendUrl = 'https://catalyst-backend.onrender.com';
  const frontendUrl = 'https://catalyst-pearl.vercel.app';
  
  // Check backend health
  console.log('1. Backend Service Status:');
  try {
    const response = await fetchWithTimeout(`${backendUrl}/health`, 10000);
    console.log(`   ✅ Backend is ${response ? 'ONLINE' : 'OFFLINE'}`);
    console.log(`   📍 URL: ${backendUrl}`);
  } catch (error) {
    console.log(`   ❌ Backend is OFFLINE: ${error.message}`);
  }
  
  // Check database connection
  console.log('\n2. Database Connection Status:');
  try {
    const response = await fetchWithTimeout(`${backendUrl}/api/health`, 10000);
    if (response) {
      console.log('   ✅ Database connection is working');
    } else {
      console.log('   ❌ Database connection failed');
    }
  } catch (error) {
    console.log(`   ❌ Could not check database: ${error.message}`);
  }
  
  // Check required environment variables
  console.log('\n3. Required Environment Variables for Migration:');
  console.log('   📋 These should be set in your Render.com dashboard:');
  console.log('   - SUPABASE_URL');
  console.log('   - SUPABASE_ANON_KEY'); 
  console.log('   - SUPABASE_SERVICE_ROLE_KEY');
  console.log('   - SUPABASE_DB_URL (or DATABASE_URL)');
  console.log('   - JWT_SECRET');
  
  console.log('\n4. Next Steps for Migration:');
  console.log('   1. Verify all environment variables are set in Render.com dashboard');
  console.log('   2. Get your SUPABASE_DB_URL from Supabase project settings');
  console.log('   3. Run migration with:');
  console.log('      SUPABASE_DB_URL=your_url JWT_SECRET=your_secret node run-production-migration.js');
  
  console.log(`\n🔗 Quick Links:`);
  console.log(`   - Render Dashboard: https://dashboard.render.com/`);
  console.log(`   - Supabase Dashboard: https://supabase.com/dashboard/`);
  console.log(`   - Backend URL: ${backendUrl}`);
  console.log(`   - Frontend URL: ${frontendUrl}`);
}

function fetchWithTimeout(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch {
          resolve(response.statusCode === 200);
        }
      });
    });
    
    request.on('error', reject);
    request.setTimeout(timeout, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

checkRenderStatus().catch(console.error);