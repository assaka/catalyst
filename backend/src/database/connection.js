const { Sequelize } = require('sequelize');
const { createClient } = require('@supabase/supabase-js');
const { getDatabaseConfig } = require('../config/database-ipv4');

// DEPRECATED: Global Supabase client is deprecated in master-tenant architecture
// Use masterDbClient for master DB or ConnectionManager for tenant DB
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

  // DEPRECATED: This function should not be called
  // All code must use explicit database connections
  throw new Error(
    'DEPRECATED: createSequelizeConnection() is not supported in master-tenant architecture.\n' +
    'Use masterSequelize from masterConnection.js for master DB queries.\n' +
    'Use ConnectionManager.getStoreConnection(storeId) for tenant DB queries.'
  );

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

// DEPRECATED: Default Sequelize connection is disabled
// All code must explicitly use masterSequelize or ConnectionManager
console.error('⚠️ [DEPRECATED] Default Sequelize connection is DISABLED');
console.error('⚠️ DATABASE_URL and SUPABASE_DB_URL are no longer supported');
console.error('⚠️ Use masterSequelize for master DB or ConnectionManager for tenant DB');

// Create in-memory SQLite that throws errors when used
sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false
});

// Override query to throw helpful error
const originalQuery = sequelize.query.bind(sequelize);
sequelize.query = function() {
  const error = new Error(
    '❌ DEPRECATED: Default sequelize connection cannot be used.\n' +
    '   For MASTER DB queries: use masterSequelize from masterConnection.js\n' +
    '   For TENANT DB queries: use ConnectionManager.getStoreConnection(storeId)\n' +
    '   See MASTER_TENANT_DATABASE_ARCHITECTURE.md for guidance'
  );
  console.error(error.message);
  console.trace('Called from:');
  throw error;
};

module.exports = { sequelize, supabase };