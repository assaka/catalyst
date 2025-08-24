#!/usr/bin/env node

/**
 * Remove specific template tables that were mentioned:
 * - template_components
 * - template_customization_layers  
 * - template_customizations
 * - template_sffr
 */

const { Client } = require('pg');
require('dotenv').config();

async function removeSpecificTemplateTables() {
  // Get database URL from environment or command line argument
  const databaseUrl = process.argv[2] || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ No database URL provided. Please provide it as:');
    console.error('   1. Command line argument: node remove-specific-template-tables.js "DATABASE_URL"');
    console.error('   2. Environment variable: SUPABASE_DB_URL or DATABASE_URL');
    process.exit(1);
  }

  console.log('🔧 Removing specific template tables...');
  console.log('📍 Database:', databaseUrl.replace(/:[^:@]*@/, ':****@'));

  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('render.com') || databaseUrl.includes('supabase.com') ? {
      rejectUnauthorized: false
    } : false
  });

  // Tables to remove
  const tablesToRemove = [
    'template_components',
    'template_customization_layers',
    'template_customizations',  // The table version, not the column
    'template_sffr'
  ];

  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    console.log(`\n🎯 Checking for specific tables to remove: ${tablesToRemove.join(', ')}`);

    const existingTables = [];

    // Check which tables actually exist
    for (const tableName of tablesToRemove) {
      const tableCheck = await client.query(`
        SELECT table_name, table_type
        FROM information_schema.tables 
        WHERE table_name = $1 AND table_schema = 'public';
      `, [tableName]);

      if (tableCheck.rows.length > 0) {
        existingTables.push(tableName);
        console.log(`✅ Found: ${tableName}`);
        
        // Show table info
        try {
          const countQuery = await client.query(`SELECT COUNT(*) as count FROM ${tableName};`);
          console.log(`   Rows: ${countQuery.rows[0].count}`);
          
          const columnsQuery = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_name = $1
            ORDER BY ordinal_position;
          `, [tableName]);
          
          console.log(`   Columns: ${columnsQuery.rows.map(c => c.column_name).join(', ')}`);
          
        } catch (error) {
          console.log(`   Error getting info: ${error.message}`);
        }
      } else {
        console.log(`❌ Not found: ${tableName}`);
      }
    }

    if (existingTables.length === 0) {
      console.log('\n✅ No template tables found to remove');
      console.log('🎯 All specified template tables are already removed or never existed');
      return;
    }

    console.log(`\n⚠️  WARNING: About to DROP ${existingTables.length} table(s):`);
    existingTables.forEach(table => {
      console.log(`   - ${table}`);
    });
    console.log('\n⚠️  This will PERMANENTLY DELETE all data in these tables!');
    console.log('   Press Ctrl+C to cancel within 5 seconds...');
    
    // Wait 5 seconds for cancellation
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Remove each existing table
    console.log('\n🗑️  Starting table removal...');
    
    for (const tableName of existingTables) {
      try {
        console.log(`\n🗑️  Dropping table: ${tableName}`);
        
        // Use CASCADE to handle any foreign key constraints
        await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE;`);
        
        console.log(`✅ Successfully dropped: ${tableName}`);
        
        // Verify removal
        const verifyQuery = await client.query(`
          SELECT table_name
          FROM information_schema.tables 
          WHERE table_name = $1 AND table_schema = 'public';
        `, [tableName]);

        if (verifyQuery.rows.length === 0) {
          console.log(`✅ Verified removal: ${tableName}`);
        } else {
          console.log(`❌ ERROR: ${tableName} still exists after drop!`);
        }
        
      } catch (error) {
        console.log(`❌ Failed to drop ${tableName}: ${error.message}`);
      }
    }

    // Final verification - check that none of the target tables exist
    console.log('\n🔍 Final verification...');
    
    let allRemoved = true;
    for (const tableName of tablesToRemove) {
      const finalCheck = await client.query(`
        SELECT table_name
        FROM information_schema.tables 
        WHERE table_name = $1 AND table_schema = 'public';
      `, [tableName]);

      if (finalCheck.rows.length === 0) {
        console.log(`✅ ${tableName}: Removed`);
      } else {
        console.log(`❌ ${tableName}: Still exists!`);
        allRemoved = false;
      }
    }

    if (allRemoved) {
      console.log('\n🎉 SUCCESS: All specified template tables have been removed!');
    } else {
      console.log('\n❌ WARNING: Some tables could not be removed. Check the errors above.');
    }

    // Show remaining tables containing 'template'
    console.log('\n📋 Remaining tables containing "template":');
    const remainingTemplates = await client.query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name LIKE '%template%' AND table_schema = 'public'
      ORDER BY table_name;
    `);

    if (remainingTemplates.rows.length === 0) {
      console.log('   None found ✅');
    } else {
      remainingTemplates.rows.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    console.error('📍 Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the removal
removeSpecificTemplateTables().catch(console.error);