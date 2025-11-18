const { Sequelize } = require('sequelize');
const { createClient } = require('@supabase/supabase-js');
const { getDatabaseConfig } = require('../config/database-ipv4');

// DEPRECATED: Global Supabase client is deprecated in master-tenant architecture
// Use masterSupabaseClient for master DB or ConnectionManager for tenant DB
let supabase = null;
console.warn('⚠️ [DEPRECATED] Global supabase client from connection.js is deprecated');

// Initialize Sequelize with IPv4 configuration directly
let sequelize;

// Create sequelize instance with enhanced configuration
const createSequelizeConnection = async () => {
  // DEPRECATED: Old env vars - use MASTER_DB_URL for new master-tenant architecture
  console.warn('⚠️  DEPRECATED: connection.js uses old database connection.');
  console.warn('⚠️  For master DB, use masterSequelize from masterConnection.js');
  console.warn('⚠️  For tenant DB, use ConnectionManager.getStoreConnection()');

  // DEPRECATED: This file should not be used in master-tenant architecture
  // Use masterSequelize or masterSupabaseClient for master DB
  // Use ConnectionManager.getStoreConnection() for tenant DB
  throw new Error('DEPRECATED: Use masterSequelize/masterSupabaseClient or ConnectionManager instead of default connection');

  if (!databaseUrl) {
    console.warn('⚠️  No database URL provided. Using SQLite for development.');
    return new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      }
    });
  }

  console.log('📍 Default Sequelize using:', databaseUrl.substring(0, 50) + '...');

  // Try to get enhanced configuration first, fallback to basic
  try {
    const config = await getDatabaseConfig();
    const enhancedSequelize = new Sequelize(config);
    console.log('✅ Enhanced database configuration loaded successfully');
    
    // Test the enhanced connection
    await enhancedSequelize.authenticate();
    console.log('✅ Database connection enhanced with IPv4 support');
    
    return enhancedSequelize;
  } catch (error) {
    console.error('❌ Failed to use enhanced database configuration:', error.message);
    console.log('🔄 Using basic database connection...');
    
    // Fallback to basic connection
    return new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      }
    });
  }
};

// Initialize sequelize connection synchronously with database URL
// DEPRECATED: This default connection should NOT be used
// Use masterSequelize for master DB or ConnectionManager for tenant DB
console.error('⚠️ [DEPRECATED] connection.js is deprecated in master-tenant architecture');
console.error('⚠️ Use masterSequelize or ConnectionManager.getStoreConnection() instead');

const databaseUrl = null; // Force no default connection

if (!databaseUrl) {
  console.warn('⚠️  No database URL provided. Using SQLite for development.');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  });
} else {
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  });

  // Test the connection
  sequelize.authenticate()
    .then(() => console.log('✅ Database connection established successfully'))
    .catch(err => console.error('❌ Unable to connect to database:', err.message));
}

module.exports = { sequelize, supabase };