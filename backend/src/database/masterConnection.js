/**
 * Master Database Connection
 *
 * This connection is for the MASTER database which contains:
 * - users (agency/store owners only)
 * - stores (minimal registry)
 * - subscriptions
 * - credit_balances
 * - credit_transactions
 * - store_databases (tenant connection credentials)
 * - store_hostnames (hostname mapping)
 * - job_queue (centralized queue)
 * - usage_metrics, api_usage_logs, billing_transactions
 *
 * The master DB is used for platform-level management and monitoring.
 * Tenant databases contain store-specific operational data.
 */

const { Sequelize } = require('sequelize');
const { createClient } = require('@supabase/supabase-js');

// ============================================
// MASTER DATABASE CONNECTION (PostgreSQL/Supabase)
// ============================================

const masterSequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.MASTER_DB_HOST,
  port: process.env.MASTER_DB_PORT || 5432,
  database: process.env.MASTER_DB_NAME || 'postgres',
  username: process.env.MASTER_DB_USER,
  password: process.env.MASTER_DB_PASSWORD,

  // Connection pool settings
  pool: {
    max: 20,          // Maximum connections in pool
    min: 5,           // Minimum connections in pool
    acquire: 30000,   // Maximum time to acquire connection (30s)
    idle: 10000       // Maximum time connection can be idle (10s)
  },

  // Logging
  logging: process.env.NODE_ENV === 'development' ? console.log : false,

  // Timezone
  timezone: '+00:00',

  // Additional options
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
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
  },

  // SSL for production
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

let masterSupabaseClient = null;

if (process.env.MASTER_SUPABASE_URL && process.env.MASTER_SUPABASE_SERVICE_KEY) {
  masterSupabaseClient = createClient(
    process.env.MASTER_SUPABASE_URL,
    process.env.MASTER_SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
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

// Test connection on startup (in development)
if (process.env.NODE_ENV === 'development') {
  testMasterConnection().catch(err => {
    console.error('Master DB connection test failed:', err);
  });
}

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
  masterSupabaseClient,
  testMasterConnection,
  closeMasterConnection
};
