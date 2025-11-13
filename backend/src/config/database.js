const { Sequelize } = require('sequelize');

/**
 * Database Configuration
 *
 * This file configures TWO databases:
 * 1. MASTER DB - Platform-level (users, stores registry, subscriptions, credits)
 * 2. TENANT DB - Store-specific (products, orders, customers, plugins, etc.)
 */

// ============================================
// MASTER DATABASE CONFIG
// ============================================
const getMasterDatabaseConfig = () => {
  const masterDbUrl = process.env.MASTER_DB_URL;

  if (!masterDbUrl) {
    console.warn('⚠️  No MASTER_DB_URL provided. Master DB features disabled.');
    return null;
  }

  const url = new URL(masterDbUrl);
  const isPooler = url.hostname.includes('.pooler.supabase.com') || url.port === '6543';

  return {
    dialect: 'postgres',
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    username: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    logging: process.env.DB_QUERY_LOG === 'true'
      ? (sql, timing) => {
          if (timing && timing > 100) {
            console.log(`⚠️  [MASTER] SLOW QUERY (${timing}ms):`, sql.substring(0, 200));
          }
          if (process.env.NODE_ENV === 'development') {
            console.log(`[MASTER DB ${timing}ms]`, sql.substring(0, 150));
          }
        }
      : false,
    benchmark: true,

    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false,
      keepAlive: true,
      keepAliveInitialDelayMs: 0,
      ...(isPooler && { application_name: 'catalyst-master' })
    },

    pool: {
      max: parseInt(process.env.MASTER_DB_POOL_MAX) || 20,
      min: parseInt(process.env.MASTER_DB_POOL_MIN) || 5,
      acquire: 60000,
      idle: 10000,
      evict: 1000,
      handleDisconnects: true
    },

    define: {
      timestamps: true,
      underscored: false, // Master DB uses camelCase
      freezeTableName: true
    },

    retry: {
      max: 5,
      match: [
        /ENETUNREACH/,
        /ECONNREFUSED/,
        /ENOTFOUND/,
        /ETIMEDOUT/
      ]
    }
  };
};

// ============================================
// TENANT DATABASE CONFIG (Current/Default)
// ============================================
const getDatabaseConfig = () => {
  const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.warn('⚠️  No database URL provided. Using SQLite for development.');
    return {
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      }
    };
  }

  // Parse connection string to handle IPv6 issues
  const url = new URL(databaseUrl);
  
  // Check if this is a Supabase pooler connection
  const isPooler = url.hostname.includes('.pooler.supabase.com') || url.port === '6543';
  
  // Force IPv4 hostname resolution for Supabase
  const config = {
    dialect: 'postgres',
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    username: url.username,
    password: url.password,
    database: url.pathname.slice(1), // Remove leading slash
    logging: process.env.DB_QUERY_LOG === 'true'
      ? (sql, timing) => {
          // Increment query counter for request tracking
          try {
            const { incrementQueryCount } = require('../middleware/timingMiddleware');
            incrementQueryCount();
          } catch (e) {
            // Middleware not loaded yet, skip
          }

          // Log slow queries (>100ms)
          if (timing && timing > 100) {
            console.log(`⚠️  SLOW QUERY (${timing}ms):`, sql.substring(0, 200) + '...');
          }
          // Log all queries in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`[DB ${timing}ms]`, sql.substring(0, 150));
          }
        }
      : (sql, timing) => {
          // Even without logging, track query count
          try {
            const { incrementQueryCount } = require('../middleware/timingMiddleware');
            incrementQueryCount();
          } catch (e) {
            // Middleware not loaded yet, skip
          }
        },
    benchmark: true, // Enable query timing
    
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false,
      // Socket settings
      keepAlive: true,
      keepAliveInitialDelayMs: 0,
      // Add application_name for pooler connections
      ...(isPooler && { application_name: 'catalyst-backend' })
    },
    
    pool: {
      // Optimized pool settings for Render.com
      // Main service: max 10, min 2 (default)
      // Worker service: max 5, min 1 (set DB_POOL_MAX=5, DB_POOL_MIN=1)
      max: parseInt(process.env.DB_POOL_MAX) || (process.env.SERVICE_TYPE === 'worker' ? 5 : 10),
      min: parseInt(process.env.DB_POOL_MIN) || (process.env.SERVICE_TYPE === 'worker' ? 1 : 2),
      acquire: 60000, // Maximum time to wait for connection
      idle: 10000,    // Maximum time connection can be idle
      evict: 1000,    // Check for idle connections every second
      handleDisconnects: true
    },
    
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    
    // Retry configuration
    retry: {
      max: 5,
      match: [
        /ENETUNREACH/,
        /ECONNREFUSED/,
        /ENOTFOUND/,
        /ENETDOWN/,
        /ECONNRESET/,
        /EHOSTUNREACH/,
        /ETIMEDOUT/
      ]
    },
    
    // Additional options for production
    benchmark: false,
    omitNull: true,
    paranoid: false,
    
    // Hooks for connection monitoring
    hooks: {
      beforeConnect: async (config) => {
        console.log(`Attempting to connect to database at ${config.host}:${config.port}`);
      },
      afterConnect: async (connection, config) => {
        console.log('Database connection established successfully');
      },
      beforeDisconnect: async (connection) => {
        console.log('Disconnecting from database');
      }
    }
  };

  return config;
};

module.exports = {
  getDatabaseConfig,       // Tenant DB config
  getMasterDatabaseConfig  // Master DB config
};