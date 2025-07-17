#!/usr/bin/env node

const { sequelize } = require('./src/database/connection');
const fs = require('fs');
const path = require('path');

async function runLogoutMigration() {
  try {
    console.log('🔄 Running logout migration...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Read the migration SQL
    const migrationPath = path.join(__dirname, 'src/database/migrations/add-logout-columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await sequelize.query(migrationSQL);
    console.log('✅ Logout migration completed successfully');
    
    // Verify the migration
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'login_attempts' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Updated login_attempts table structure:');
    results.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}) default: ${row.column_default || 'none'}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runLogoutMigration();