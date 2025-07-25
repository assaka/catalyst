const { Sequelize } = require('sequelize');
const { createClient } = require('@supabase/supabase-js');
const { getDatabaseConfig } = require('../config/database-ipv4');

// Initialize Supabase client with error handling
let supabase;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    console.log('✅ Supabase client initialized');
  } else {
    console.warn('⚠️  Supabase credentials missing - client not initialized');
    supabase = null;
  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error.message);
  supabase = null;
}

// Initialize Sequelize with IPv4 configuration directly
let sequelize;

// Create sequelize instance with enhanced configuration
const createSequelizeConnection = async () => {
  const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  
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

// Initialize sequelize connection
sequelize = new Sequelize(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || 'sqlite::memory:', {
  dialect: (process.env.SUPABASE_DB_URL || process.env.DATABASE_URL) ? 'postgres' : 'sqlite',
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

// Enhance connection in background without replacing the instance
createSequelizeConnection().then(enhancedConnection => {
  if (enhancedConnection !== sequelize) {
    // Test the enhanced connection works
    enhancedConnection.authenticate().then(() => {
      console.log('✅ Database connection enhanced and tested successfully');
    }).catch(console.error);
  }
}).catch(console.error);

module.exports = { sequelize, supabase };