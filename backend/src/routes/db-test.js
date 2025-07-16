const express = require('express');
const { sequelize, supabase } = require('../database/connection');
const { Pool } = require('pg');
const router = express.Router();

// @route   GET /api/db-test/all
// @desc    Test all database connection methods
// @access  Public
router.get('/all', async (req, res) => {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasDbUrl: !!process.env.DATABASE_URL,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY
    },
    tests: {}
  };

  // Test 1: Sequelize connection
  try {
    await sequelize.authenticate();
    results.tests.sequelize = { status: 'success', message: 'Connected via Sequelize' };
  } catch (error) {
    results.tests.sequelize = { 
      status: 'failed', 
      error: error.message,
      code: error.code,
      errno: error.errno
    };
  }

  // Test 2: Direct PostgreSQL connection with pg
  if (process.env.DATABASE_URL) {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      const result = await pool.query('SELECT NOW()');
      await pool.end();
      results.tests.directPg = { 
        status: 'success', 
        message: 'Connected via pg directly',
        time: result.rows[0].now
      };
    } catch (error) {
      results.tests.directPg = { 
        status: 'failed', 
        error: error.message,
        code: error.code
      };
    }
  } else {
    results.tests.directPg = { status: 'skipped', message: 'No DATABASE_URL' };
  }

  // Test 3: Supabase client test
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      results.tests.supabaseClient = { 
        status: 'success', 
        message: 'Connected via Supabase client'
      };
    } catch (error) {
      results.tests.supabaseClient = { 
        status: 'failed', 
        error: error.message,
        code: error.code
      };
    }
  } else {
    results.tests.supabaseClient = { status: 'skipped', message: 'Supabase client not initialized' };
  }

  // Test 4: Check DATABASE_URL format
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      results.tests.urlParsing = {
        status: 'success',
        host: url.hostname,
        port: url.port || '5432',
        database: url.pathname.slice(1),
        protocol: url.protocol
      };
    } catch (error) {
      results.tests.urlParsing = {
        status: 'failed',
        error: 'Invalid DATABASE_URL format'
      };
    }
  }

  // Test 5: Alternative connection string formats
  const alternativeTests = [];
  
  // Try with explicit IPv4
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      const ipv4Pool = new Pool({
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1),
        user: url.username,
        password: url.password,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
        statement_timeout: 10000,
        idle_in_transaction_session_timeout: 10000
      });
      
      const result = await ipv4Pool.query('SELECT 1');
      await ipv4Pool.end();
      
      results.tests.ipv4Connection = {
        status: 'success',
        message: 'Connected with explicit config'
      };
    } catch (error) {
      results.tests.ipv4Connection = {
        status: 'failed',
        error: error.message,
        code: error.code
      };
    }
  }

  res.json(results);
});

// @route   GET /api/db-test/supabase-direct
// @desc    Test Supabase connection directly
// @access  Public
router.get('/supabase-direct', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ 
        status: 'error', 
        message: 'Supabase client not initialized',
        hasUrl: !!process.env.SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_ANON_KEY
      });
    }

    // Try a simple query
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      return res.json({ 
        status: 'error', 
        message: 'Supabase query failed',
        error: error.message,
        code: error.code,
        details: error.details
      });
    }

    res.json({ 
      status: 'success', 
      message: 'Supabase connection working',
      hasData: !!data,
      dataCount: data ? data.length : 0
    });

  } catch (error) {
    res.json({ 
      status: 'error', 
      message: 'Unexpected error',
      error: error.message 
    });
  }
});

// @route   GET /api/db-test/connection-string
// @desc    Show connection string format (masked)
// @access  Public
router.get('/connection-string', (req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return res.json({ 
      status: 'error', 
      message: 'DATABASE_URL not set' 
    });
  }
  
  try {
    const url = new URL(dbUrl);
    const masked = {
      status: 'success',
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || '5432',
      pathname: url.pathname,
      username: url.username,
      password: url.password ? '***HIDDEN***' : 'NOT_SET',
      full_format: `${url.protocol}//${url.username}:***@${url.hostname}:${url.port || '5432'}${url.pathname}${url.search || ''}`
    };
    
    res.json(masked);
  } catch (error) {
    res.json({ 
      status: 'error', 
      message: 'Invalid DATABASE_URL format',
      error: error.message 
    });
  }
});

// @route   GET /api/db-test/pooler
// @desc    Test Supabase pooler connection
// @access  Public
router.get('/pooler', async (req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return res.json({ status: 'error', message: 'DATABASE_URL not set' });
  }
  
  try {
    const url = new URL(dbUrl);
    
    // Create pooler connection string
    const poolerHost = url.hostname.replace('db.', '').replace('.supabase.co', '.pooler.supabase.com');
    const poolerUrl = `postgresql://${url.username}:${url.password}@${poolerHost}:6543${url.pathname}?pgbouncer=true`;
    
    const pool = new Pool({
      connectionString: poolerUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    const result = await pool.query('SELECT NOW() as current_time');
    await pool.end();
    
    res.json({
      status: 'success',
      message: 'Pooler connection working',
      time: result.rows[0].current_time,
      pooler_host: poolerHost
    });
    
  } catch (error) {
    res.json({
      status: 'error',
      message: 'Pooler connection failed',
      error: error.message,
      code: error.code
    });
  }
});

module.exports = router;