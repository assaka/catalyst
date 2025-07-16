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
  console.log('✅ Database configuration loaded successfully');
} catch (error) {
  console.error('❌ Failed to create database configuration:', error.message);
  
  // Check if we have database URL
  const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  
  if (databaseUrl) {
    console.log('🔄 Attempting fallback database connection...');
    sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: console.log,
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    });
  } else {
    console.error('❌ No database URL found! Please configure Supabase connection.');
    console.error('In Render.com dashboard, set these environment variables:');
    console.error('- SUPABASE_URL');
    console.error('- SUPABASE_ANON_KEY');
    console.error('- SUPABASE_DB_URL (or DATABASE_URL)');
    console.error('- JWT_SECRET');
    console.error('- SESSION_SECRET');
    
    // For development, still use SQLite fallback
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Using SQLite for development...');
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './database.sqlite',
        logging: console.log
      });
    } else {
      throw new Error('Database configuration required for production');
    }
  }
}

module.exports = { sequelize, supabase };