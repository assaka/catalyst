#!/usr/bin/env node

const { sequelize } = require('./src/database/connection');

async function debugConstraints() {
  try {
    console.log('🔍 Debugging foreign key constraints...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check all foreign key constraints
    console.log('\n📋 All foreign key constraints in database:');
    const [constraints] = await sequelize.query(`
      SELECT 
        conname as constraint_name,
        conrelid::regclass AS table_name, 
        confrelid::regclass AS referenced_table,
        a.attname AS column_name,
        af.attname AS referenced_column
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
      JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
      WHERE c.contype = 'f' 
      ORDER BY conrelid::regclass::text, conname
    `);
    
    constraints.forEach((constraint, index) => {
      console.log(`${index + 1}. ${constraint.constraint_name}`);
      console.log(`   ${constraint.table_name}.${constraint.column_name} → ${constraint.referenced_table}.${constraint.referenced_column}`);
    });
    
    // Check specifically for store-related constraints
    console.log('\n🏪 Store-related constraints:');
    const [storeConstraints] = await sequelize.query(`
      SELECT 
        conname as constraint_name,
        conrelid::regclass AS table_name, 
        confrelid::regclass AS referenced_table,
        a.attname AS column_name,
        af.attname AS referenced_column
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
      JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
      WHERE c.contype = 'f' 
      AND (conrelid::regclass::text ILIKE '%store%' OR confrelid::regclass::text ILIKE '%store%')
      ORDER BY conname
    `);
    
    storeConstraints.forEach((constraint, index) => {
      console.log(`${index + 1}. ${constraint.constraint_name}`);
      console.log(`   ${constraint.table_name}.${constraint.column_name} → ${constraint.referenced_table}.${constraint.referenced_column}`);
    });
    
    // Check what tables actually exist
    console.log('\n📊 Tables with "store" in the name:');
    const [tables] = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename ILIKE '%store%'
      ORDER BY tablename
    `);
    
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.tablename}`);
    });
    
    // Check what tables actually exist (all)
    console.log('\n📋 All tables in public schema:');
    const [allTables] = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    allTables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.tablename}`);
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugConstraints();