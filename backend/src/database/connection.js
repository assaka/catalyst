const { Sequelize } = require('sequelize');
const { createClient } = require('@supabase/supabase-js');
const { getDatabaseConfig } = require('../config/database');

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

// Sequelize connection using robust configuration
let sequelize;

try {
  const config = getDatabaseConfig();
  sequelize = new Sequelize(config);
} catch (error) {
  console.error('Failed to create database configuration:', error.message);
  
  // Fallback to simple connection string approach
  console.log('Attempting fallback database connection...');
  sequelize = new Sequelize(
    process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
    {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    }
  );
}

module.exports = { sequelize, supabase };