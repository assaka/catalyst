const { Sequelize } = require('sequelize');

// Database configuration with fallback options
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
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    
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
      max: parseInt(process.env.DB_POOL_MAX) || 5,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
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

module.exports = { getDatabaseConfig };