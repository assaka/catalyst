require('dotenv').config();
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

async function testConnections() {
  console.log('=== Testing Database Connections ===\n');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Not set');
  console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Set' : '✗ Not set');
  console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Not set');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'Not set');
  console.log('');

  // Test 1: Direct PostgreSQL connection
  if (process.env.DATABASE_URL) {
    console.log('Testing direct PostgreSQL connection...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    try {
      const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
      console.log('✓ PostgreSQL connection successful!');
      console.log('  - Current time:', result.rows[0].current_time);
      console.log('  - PostgreSQL version:', result.rows[0].pg_version.split(',')[0]);
    } catch (error) {
      console.error('✗ PostgreSQL connection failed:', error.message);
      console.error('  Error code:', error.code);
    } finally {
      await pool.end();
    }
  } else {
    console.log('✗ Skipping PostgreSQL test - DATABASE_URL not set');
  }

  console.log('');

  // Test 2: Supabase client connection
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    console.log('Testing Supabase client connection...');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    try {
      // Test with a simple query
      const { data, error } = await supabase
        .from('users')
        .select('count');
      
      if (error) {
        console.error('✗ Supabase query failed:', error.message);
        console.error('  Error code:', error.code);
      } else {
        console.log('✓ Supabase client connection successful!');
      }
    } catch (error) {
      console.error('✗ Supabase connection error:', error.message);
    }
  } else {
    console.log('✗ Skipping Supabase test - SUPABASE_URL or SUPABASE_ANON_KEY not set');
  }

  console.log('\n=== Connection Test Complete ===');
}

// Run the tests
testConnections().catch(console.error);