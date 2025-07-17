#!/usr/bin/env node

const { sequelize } = require('./src/database/connection');

async function checkUserEmail() {
  try {
    console.log('🔍 Checking user email in database...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check if the user exists
    const [users] = await sequelize.query(`
      SELECT email, role, created_at 
      FROM users 
      WHERE email = 'hamidelabassi99@gmail.com'
    `);
    
    if (users.length > 0) {
      console.log('✅ User found in database:');
      console.log('Email:', users[0].email);
      console.log('Role:', users[0].role);
      console.log('Created:', users[0].created_at);
    } else {
      console.log('❌ User NOT found in database');
      console.log('Email being searched:', 'hamidelabassi99@gmail.com');
      
      // Let's see what users do exist
      const [allUsers] = await sequelize.query(`
        SELECT email, role 
        FROM users 
        LIMIT 10
      `);
      
      console.log('\n📋 Existing users in database:');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.role})`);
      });
    }
    
    // Check stores table structure
    const [storeColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'stores' 
      AND column_name IN ('owner_email', 'id', 'name')
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Store table relevant columns:');
    storeColumns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkUserEmail();