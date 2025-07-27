#!/usr/bin/env node

// Script to fix database constraint issues
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixDatabaseConstraints() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting database constraint fix...');
    
    // Step 1: Check if users table exists and has proper structure
    console.log('1️⃣ Checking users table...');
    const usersCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    if (usersCheck.rows.length === 0) {
      console.log('❌ Users table does not exist. Creating it...');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          phone VARCHAR(20),
          role VARCHAR(50) DEFAULT 'customer',
          avatar_url TEXT,
          is_active BOOLEAN DEFAULT true,
          email_verified BOOLEAN DEFAULT false,
          email_verification_token VARCHAR(255),
          password_reset_token VARCHAR(255),
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Users table created successfully');
    } else {
      console.log('✅ Users table exists with columns:', usersCheck.rows.map(r => r.column_name).join(', '));
    }
    
    // Step 2: Check if users table has primary key constraint
    console.log('2️⃣ Checking users table primary key...');
    const pkCheck = await client.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' AND constraint_type = 'PRIMARY KEY';
    `);
    
    if (pkCheck.rows.length === 0) {
      console.log('❌ Users table missing primary key. Adding it...');
      
      try {
        await client.query('ALTER TABLE users ADD PRIMARY KEY (id);');
        console.log('✅ Primary key added to users table');
      } catch (error) {
        console.log('⚠️ Could not add primary key:', error.message);
      }
    } else {
      console.log('✅ Users table has primary key constraint');
    }
    
    // Step 3: Check problematic foreign key constraints
    console.log('3️⃣ Checking foreign key constraints referencing users...');
    const fkCheck = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'users';
    `);
    
    console.log(`Found ${fkCheck.rows.length} foreign key constraints referencing users table:`);
    fkCheck.rows.forEach(row => {
      console.log(`  - ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
    });
    
    // Step 4: Try to drop and recreate problematic constraints
    console.log('4️⃣ Fixing problematic constraints...');
    
    for (const constraint of fkCheck.rows) {
      try {
        console.log(`Checking constraint: ${constraint.constraint_name}`);
        
        // Try to validate the constraint
        await client.query(`
          SELECT COUNT(*) FROM ${constraint.table_name} 
          WHERE ${constraint.column_name} IS NOT NULL 
          AND ${constraint.column_name} NOT IN (SELECT id FROM users);
        `);
        
        console.log(`✅ Constraint ${constraint.constraint_name} is valid`);
        
      } catch (error) {
        console.log(`❌ Constraint ${constraint.constraint_name} has issues:`, error.message);
        
        // Try to drop and recreate the constraint
        try {
          console.log(`Dropping constraint ${constraint.constraint_name}...`);
          await client.query(`ALTER TABLE ${constraint.table_name} DROP CONSTRAINT IF EXISTS ${constraint.constraint_name};`);
          
          console.log(`Recreating constraint ${constraint.constraint_name}...`);
          await client.query(`
            ALTER TABLE ${constraint.table_name} 
            ADD CONSTRAINT ${constraint.constraint_name} 
            FOREIGN KEY (${constraint.column_name}) 
            REFERENCES ${constraint.foreign_table_name}(${constraint.foreign_column_name}) 
            ON DELETE SET NULL;
          `);
          
          console.log(`✅ Constraint ${constraint.constraint_name} recreated successfully`);
          
        } catch (recreateError) {
          console.log(`⚠️ Could not recreate constraint ${constraint.constraint_name}:`, recreateError.message);
        }
      }
    }
    
    // Step 5: Check if consent_logs table exists (common source of the error)
    console.log('5️⃣ Checking consent_logs table...');
    const consentLogsCheck = await client.query(`
      SELECT COUNT(*) 
      FROM information_schema.tables 
      WHERE table_name = 'consent_logs' AND table_schema = 'public';
    `);
    
    if (consentLogsCheck.rows[0].count === '0') {
      console.log('Creating consent_logs table...');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS consent_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          store_id UUID,
          user_id UUID,
          session_id VARCHAR(255),
          consent_method VARCHAR(50) NOT NULL CHECK (consent_method IN ('accept_all', 'reject_all', 'custom')),
          consent_categories JSONB,
          ip_address INET,
          user_agent TEXT,
          consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log('✅ consent_logs table created without constraints');
      
      // Add foreign key constraints after table exists
      try {
        await client.query(`
          ALTER TABLE consent_logs 
          ADD CONSTRAINT fk_consent_logs_store 
          FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
        `);
        console.log('✅ Store foreign key constraint added');
      } catch (error) {
        console.log('⚠️ Could not add store foreign key:', error.message);
      }
      
      try {
        await client.query(`
          ALTER TABLE consent_logs 
          ADD CONSTRAINT fk_consent_logs_user 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
        `);
        console.log('✅ User foreign key constraint added');
      } catch (error) {
        console.log('⚠️ Could not add user foreign key:', error.message);
      }
      
    } else {
      console.log('✅ consent_logs table already exists');
    }
    
    console.log('\n🎉 Database constraint fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing database constraints:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the fix
if (require.main === module) {
  fixDatabaseConstraints()
    .then(() => {
      console.log('✅ Database constraint fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database constraint fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixDatabaseConstraints };