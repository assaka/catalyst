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

// Initialize Sequelize with synchronous fallback for immediate model loading
let sequelize;

// Create initial sequelize instance for immediate model loading
const createInitialSequelize = () => {
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

  // Create basic postgres connection for model definitions
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
};

// Initialize sequelize immediately for model loading
sequelize = createInitialSequelize();

// Enhance with IPv4 configuration after initial setup
const enhanceSequelizeConnection = async () => {
  try {
    const config = await getDatabaseConfig();
    const enhancedSequelize = new Sequelize(config);
    console.log('✅ Enhanced database configuration loaded successfully');
    
    // Test the enhanced connection
    await enhancedSequelize.authenticate();
    
    // Replace the basic sequelize with the enhanced one
    await sequelize.close();
    sequelize = enhancedSequelize;
    console.log('✅ Database connection enhanced with IPv4 support');
    
    return sequelize;
  } catch (error) {
    console.error('❌ Failed to enhance database configuration:', error.message);
    console.log('🔄 Continuing with basic database connection...');
    return sequelize;
  }
};

// Enhance connection in background
enhanceSequelizeConnection().catch(console.error);

module.exports = { sequelize, supabase };