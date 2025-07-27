#!/usr/bin/env node

// Script to check database status
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database status...\n');
    
    // Check connection
    const versionResult = await client.query('SELECT version();');
    console.log('✅ Database connection successful');
    console.log('📊 PostgreSQL version:', versionResult.rows[0].version.split(' ')[1]);
    
    // Check if users table exists
    const usersCheck = await client.query(`
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_name = 'users' AND table_schema = 'public';
    `);
    
    console.log(`\n📋 Users table exists: ${usersCheck.rows[0].count > 0 ? '✅' : '❌'}`);
    
    if (usersCheck.rows[0].count > 0) {
      // Check users table structure
      const usersStructure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      console.log('👤 Users table columns:');
      usersStructure.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
      
      // Check primary key
      const pkCheck = await client.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'users' AND constraint_type = 'PRIMARY KEY';
      `);
      
      console.log(`🔑 Primary key constraint: ${pkCheck.rows.length > 0 ? '✅ ' + pkCheck.rows[0].constraint_name : '❌ Missing'}`);
    }
    
    // Check foreign key constraints
    const fkCheck = await client.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS references_table,
        ccu.column_name AS references_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
      ORDER BY tc.table_name, tc.constraint_name;
    `);
    
    console.log(`\n🔗 Foreign key constraints referencing users: ${fkCheck.rows.length}`);
    fkCheck.rows.forEach(row => {
      console.log(`  - ${row.table_name}.${row.column_name} -> ${row.references_table}.${row.references_column}`);
    });
    
    // Check all tables
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log(`\n📊 Total tables in database: ${tablesCheck.rows.length}`);
    console.log('Tables:');
    tablesCheck.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check for consent_logs specifically
    const consentLogsExists = tablesCheck.rows.some(row => row.table_name === 'consent_logs');
    console.log(`\n📝 consent_logs table: ${consentLogsExists ? '✅ Exists' : '❌ Missing'}`);
    
    console.log('\n✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.error('Full error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the check
checkDatabase();