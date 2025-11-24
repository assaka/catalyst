/**
 * Master Database Connection
 *
 * This connection is for the MASTER database which contains:
 * - users (agency/store owners only, includes credits column)
 * - stores (minimal registry)
 * - subscriptions
 * - credit_transactions
 * - store_databases (tenant connection credentials)
 * - store_hostnames (hostname mapping)
 * - job_queue (centralized queue)
 * - usage_metrics, billing_transactions
 *
 * The master DB is used for platform-level management and monitoring.
 * Tenant databases contain store-specific operational data.
 */

const { Sequelize } = require('sequelize');
const { createClient } = require('@supabase/supabase-js');

// ============================================
// MASTER DATABASE CONNECTION (PostgreSQL/Supabase)
// ============================================

// Use MASTER_DB_URL if available, otherwise fall back to individual components
const masterDbUrl = process.env.MASTER_DB_URL;
const useMasterDbUrl = !!masterDbUrl;

console.log('🔧 [MASTER CONNECTION INIT] MASTER_DB_URL loaded:', masterDbUrl ? masterDbUrl.substring(0, 80) + '...' : '❌ NOT SET');
console.log('🔧 [MASTER CONNECTION INIT] Will use URL-based connection:', useMasterDbUrl);

if (!masterDbUrl) {
  console.warn('⚠️ [MASTER CONNECTION] MASTER_DB_URL not set! Checking fallback env vars...');
  console.warn('⚠️ MASTER_DB_HOST:', process.env.MASTER_DB_HOST ? 'SET' : 'NOT SET');
  console.warn('⚠️ MASTER_DB_USER:', process.env.MASTER_DB_USER ? 'SET' : 'NOT SET');
  console.warn('⚠️ MASTER_DB_PASSWORD:', process.env.MASTER_DB_PASSWORD ? 'SET (length: ' + (process.env.MASTER_DB_PASSWORD?.length || 0) + ')' : 'NOT SET');
  console.warn('⚠️ MASTER_DB_NAME:', process.env.MASTER_DB_NAME || 'postgres (default)');
} else {
  // Parse the URL to show what's being used (sanitized)
  try {
    const url = new URL(masterDbUrl.replace('postgresql://', 'http://'));
    console.log('🔧 [MASTER CONNECTION] Parsed from MASTER_DB_URL:');
    console.log('   - Host:', url.hostname);
    console.log('   - Port:', url.port || '5432');
    console.log('   - Database:', url.pathname.substring(1));
    console.log('   - Username:', url.username);
    console.log('   - Password length:', url.password?.length || 0);
    console.log('   - Password first 3 chars:', url.password?.substring(0, 3) + '...' || 'NONE');
  } catch (e) {
    console.error('❌ Failed to parse MASTER_DB_URL:', e.message);
  }
}

const masterSequelize = useMasterDbUrl
  ? new Sequelize(masterDbUrl, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      timezone: '+00:00',
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true
      },
      dialectOptions: process.env.NODE_ENV === 'production' ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      } : {},

      // Connection pool settings
      pool: {
        max: 20,          // Maximum connections in pool
        min: 5,           // Minimum connections in pool
        acquire: 30000,   // Maximum time to acquire connection (30s)
        idle: 10000       // Maximum time connection can be idle (10s)
      },

      // Retry logic
      retry: {
        max: 3,
        match: [
          /SequelizeConnectionError/,
          /SequelizeConnectionRefusedError/,
          /SequelizeHostNotFoundError/,
          /SequelizeHostNotReachableError/,
          /SequelizeInvalidConnectionError/,
          /SequelizeConnectionTimedOutError/,
          /TimeoutError/
        ]
      }
    })
  : new Sequelize({
      dialect: 'postgres',
      host: process.env.MASTER_DB_HOST,
      port: process.env.MASTER_DB_PORT || 5432,
      database: process.env.MASTER_DB_NAME || 'postgres',
      username: process.env.MASTER_DB_USER,
      password: process.env.MASTER_DB_PASSWORD,
      pool: {
        max: 20,
        min: 5,
        acquire: 30000,
        idle: 10000
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      timezone: '+00:00',
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true
      },
      retry: {
        max: 3,
        match: [
          /SequelizeConnectionError/,
          /SequelizeConnectionRefusedError/,
          /SequelizeHostNotFoundError/,
          /SequelizeHostNotReachableError/,
          /SequelizeInvalidConnectionError/,
          /SequelizeConnectionTimedOutError/,
          /TimeoutError/
        ]
      },
      dialectOptions: process.env.NODE_ENV === 'production' ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      } : {}
    });

// ============================================
// SUPABASE CLIENT (if using Supabase for master DB)
// ============================================

let masterDbClient = null;

// First try explicit MASTER_SUPABASE_URL and MASTER_SUPABASE_SERVICE_KEY
if (process.env.MASTER_SUPABASE_URL && process.env.MASTER_SUPABASE_SERVICE_KEY) {
  console.log('🔧 [MASTER SUPABASE] Initializing from MASTER_SUPABASE_URL...');
  masterDbClient = createClient(
    process.env.MASTER_SUPABASE_URL,
    process.env.MASTER_SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  console.log('✅ [MASTER SUPABASE] Client initialized from explicit env vars');
}
// Fallback: Try to parse from MASTER_DB_URL if it's a Supabase URL
else if (masterDbUrl && masterDbUrl.includes('.supabase.co')) {
  try {
    console.log('🔧 [MASTER SUPABASE] Attempting to initialize from MASTER_DB_URL...');

    // Extract project ref from pooler URL: postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
    const urlMatch = masterDbUrl.match(/postgres\.([^:]+):([^@]+)@aws-0-([^.]+)\.pooler\.supabase\.co/);

    if (urlMatch) {
      const [, projectRef, password, region] = urlMatch;
      const supabaseUrl = `https://${projectRef}.supabase.co`;

      console.log('🔧 [MASTER SUPABASE] Extracted from MASTER_DB_URL:');
      console.log('   - Project Ref:', projectRef);
      console.log('   - Region:', region);
      console.log('   - Supabase URL:', supabaseUrl);

      // Check if we have SUPABASE_SERVICE_ROLE_KEY or MASTER_SUPABASE_SERVICE_KEY
      const serviceKey = process.env.MASTER_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (serviceKey && serviceKey !== 'your-service-role-key-here') {
        masterDbClient = createClient(supabaseUrl, serviceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });
        console.log('✅ [MASTER SUPABASE] Client initialized from MASTER_DB_URL + service key');
      } else {
        console.warn('⚠️ [MASTER SUPABASE] Service role key not available - masterDbClient will be null');
        console.warn('   Set MASTER_SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY');
      }
    } else {
      console.warn('⚠️ [MASTER SUPABASE] Could not parse Supabase project ref from MASTER_DB_URL');
    }
  } catch (parseError) {
    console.error('❌ [MASTER SUPABASE] Error parsing MASTER_DB_URL:', parseError.message);
  }
} else {
  console.warn('⚠️ [MASTER SUPABASE] masterDbClient not initialized - no Supabase env vars found');
}

// ============================================
// CONNECTION TESTING
// ============================================

async function testMasterConnection() {
  try {
    await masterSequelize.authenticate();
    console.log('✅ Master database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to master database:', error.message);
    throw error;
  }
}

// ============================================
// CONNECTION MANAGEMENT
// ============================================

async function closeMasterConnection() {
  try {
    await masterSequelize.close();
    console.log('Master database connection closed.');
  } catch (error) {
    console.error('Error closing master database connection:', error);
    throw error;
  }
}

// Test connection on startup (ALWAYS - even in production, for diagnostics)
console.log('🔧 Testing master database connection on startup...');
console.log('🔧 Attempting to authenticate with:');
console.log('   - Dialect:', masterSequelize.config.dialect);
console.log('   - Host:', masterSequelize.config.host);
console.log('   - Port:', masterSequelize.config.port);
console.log('   - Database:', masterSequelize.config.database);
console.log('   - Username:', masterSequelize.config.username);
console.log('   - Has Password:', !!masterSequelize.config.password);
console.log('   - Password Length:', masterSequelize.config.password?.length || 0);

testMasterConnection()
  .then(() => {
    console.log('✅ Master DB connection test PASSED - credentials are correct!');
    console.log('✅ Job creation should work now');
  })
  .catch(err => {
    console.error('❌ Master DB connection test FAILED:', err.message);
    console.error('❌ Full error:', err);
    console.error('❌ This will cause job scheduling to fail!');
    console.error('❌ Please check:');
    console.error('   1. MASTER_DB_URL is set correctly in Render');
    console.error('   2. Password in the URL matches Supabase password');
    console.error('   3. Database user has correct permissions');
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeMasterConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeMasterConnection();
  process.exit(0);
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  masterSequelize,
  masterDbClient,
  testMasterConnection,
  closeMasterConnection
};
