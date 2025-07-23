#!/usr/bin/env node

const { User } = require('./src/models');
const { sequelize } = require('./src/database/connection');

async function debugUserCheck() {
  try {
    console.log('🔍 Debugging user check...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check for the specific user email
    const userEmail = 'playamin998@gmail.com';
    
    console.log(`🔍 Looking for user: ${userEmail}`);
    
    // Method 1: Using Sequelize User model
    console.log('\n1️⃣ Checking with User.findOne()...');
    try {
      const user = await User.findOne({ where: { email: userEmail } });
      if (user) {
        console.log('✅ User found via Sequelize:', {
          id: user.id,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        });
      } else {
        console.log('❌ User NOT found via Sequelize');
      }
    } catch (error) {
      console.error('❌ Sequelize query failed:', error.message);
    }
    
    // Method 2: Direct SQL query
    console.log('\n2️⃣ Checking with direct SQL query...');
    try {
      const [results] = await sequelize.query(
        'SELECT id, email, role, created_at FROM users WHERE email = :email',
        {
          replacements: { email: userEmail },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      if (results.length > 0) {
        console.log('✅ User found via SQL:', results[0]);
      } else {
        console.log('❌ User NOT found via SQL');
      }
    } catch (error) {
      console.error('❌ SQL query failed:', error.message);
    }
    
    // Method 3: Check all users with similar emails
    console.log('\n3️⃣ Checking for similar emails...');
    try {
      const allUsers = await sequelize.query(
        "SELECT email FROM users WHERE email ILIKE '%playamin%' OR email ILIKE '%gmail%'",
        { type: sequelize.QueryTypes.SELECT }
      );
      
      console.log(`Found ${allUsers.length} users with similar emails:`);
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. "${user.email}" (length: ${user.email.length})`);
      });
    } catch (error) {
      console.error('❌ Similar email query failed:', error.message);
    }
    
    // Method 3.5: Check ALL users in the database
    console.log('\n📋 Checking ALL users in database...');
    try {
      const allUsers = await sequelize.query(
        'SELECT email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10',
        { type: sequelize.QueryTypes.SELECT }
      );
      
      console.log(`Found ${allUsers.length} total users (showing last 10):`);
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. "${user.email}" (${user.role}) - ${user.created_at}`);
      });
    } catch (error) {
      console.error('❌ All users query failed:', error.message);
    }
    
    // Method 4: Check foreign key constraint
    console.log('\n4️⃣ Checking foreign key constraints...');
    try {
      const [constraints] = await sequelize.query(`
        SELECT conname, conrelid::regclass AS table_name, 
               confrelid::regclass AS referenced_table,
               a.attname AS column_name,
               af.attname AS referenced_column
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
        JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
        WHERE c.contype = 'f' AND conrelid::regclass::text = 'stores'
      `);
      
      console.log('Foreign key constraints on stores table:');
      constraints.forEach((constraint) => {
        console.log(`- ${constraint.conname}: ${constraint.table_name}.${constraint.column_name} → ${constraint.referenced_table}.${constraint.referenced_column}`);
      });
    } catch (error) {
      console.error('❌ Constraint query failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugUserCheck();