const { Sequelize } = require('sequelize');
const { createClient } = require('@supabase/supabase-js');
const { getDatabaseConfig } = require('../config/database');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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