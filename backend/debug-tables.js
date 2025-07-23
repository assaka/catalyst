#!/usr/bin/env node

const { sequelize } = require('./src/database/connection');

async function debugTables() {
  try {
    console.log('🔍 Debugging database tables...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check what tables exist
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Available tables in database:');
    results.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
    
    // Try to query the users table directly
    console.log('\n🔍 Testing direct query to users table...');
    try {
      const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM users');
      console.log(`✅ Users table exists with ${userCount[0].count} records`);
    } catch (error) {
      console.error('❌ Failed to query users table:', error.message);
    }
    
    // Check Sequelize model table name
    const { User } = require('./src/models');
    console.log('\n🔍 Sequelize User model info:');
    console.log('Model name:', User.name);
    console.log('Table name:', User.tableName);
    console.log('Options:', User.options);
    
    // Try Sequelize query
    console.log('\n🔍 Testing Sequelize User.findAll()...');
    try {
      const users = await User.findAll({ limit: 1 });
      console.log(`✅ Sequelize query successful, found ${users.length} users`);
    } catch (error) {
      console.error('❌ Sequelize query failed:', error.message);
      console.error('Error name:', error.name);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugTables();