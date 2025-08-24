#!/usr/bin/env node

/**
 * Check for and remove template-related tables from production database
 * This script will identify all template-related tables and safely remove them
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkAndRemoveTemplateTables() {
  // Get database URL from environment or command line argument
  const databaseUrl = process.argv[2] || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ No database URL provided. Please provide it as:');
    console.error('   1. Command line argument: node check-and-remove-template-tables.js "DATABASE_URL"');
    console.error('   2. Environment variable: SUPABASE_DB_URL or DATABASE_URL');
    process.exit(1);
  }

  console.log('🔧 Starting template tables check and removal...');
  console.log('📍 Database:', databaseUrl.replace(/:[^:@]*@/, ':****@'));

  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('render.com') || databaseUrl.includes('supabase.com') ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Get all table names
    console.log('📋 Scanning for template-related tables...');
    const allTablesQuery = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log(`📊 Found ${allTablesQuery.rows.length} total tables in database:`);
    allTablesQuery.rows.forEach(table => {
      console.log(`   - ${table.table_name} (${table.table_type})`);
    });

    // Look for template-related tables
    const templateTablePatterns = [
      'template_components',
      'template_customization_layers',
      'template_customizations',
      'template_sffr',
      'template_assets',
      'store_templates'
    ];

    const foundTemplateTables = [];
    
    for (const pattern of templateTablePatterns) {
      const tableCheck = await client.query(`
        SELECT table_name, table_type
        FROM information_schema.tables 
        WHERE table_name = $1 AND table_schema = 'public';
      `, [pattern]);

      if (tableCheck.rows.length > 0) {
        foundTemplateTables.push({
          name: pattern,
          type: tableCheck.rows[0].table_type
        });
      }
    }

    // Also check for any table containing 'template' in the name
    const templateContainingTables = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_name LIKE '%template%' AND table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n🎯 TEMPLATE-RELATED TABLES FOUND:');
    
    if (foundTemplateTables.length === 0 && templateContainingTables.rows.length === 0) {
      console.log('✅ No template-related tables found in the database');
      console.log('🎯 All template tables have already been removed or never existed');
      return;
    }

    // Combine and deduplicate tables
    const allTemplateTables = new Map();
    
    foundTemplateTables.forEach(table => {
      allTemplateTables.set(table.name, table);
    });
    
    templateContainingTables.rows.forEach(table => {
      allTemplateTables.set(table.table_name, {
        name: table.table_name,
        type: table.table_type
      });
    });

    console.log(`📋 Found ${allTemplateTables.size} template-related table(s):`);
    
    for (const [tableName, tableInfo] of allTemplateTables) {
      console.log(`\n📊 Table: ${tableName} (${tableInfo.type})`);
      
      try {
        // Check table structure
        const columnsQuery = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position;
        `, [tableName]);

        console.log(`   Columns (${columnsQuery.rows.length}):`);
        columnsQuery.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`     - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
        });

        // Check row count
        const countQuery = await client.query(`SELECT COUNT(*) as count FROM ${tableName};`);
        console.log(`   Data: ${countQuery.rows[0].count} rows`);

        // Show sample data if exists
        if (parseInt(countQuery.rows[0].count) > 0) {
          const sampleQuery = await client.query(`SELECT * FROM ${tableName} LIMIT 3;`);
          console.log('   Sample data:');
          sampleQuery.rows.forEach((row, index) => {
            console.log(`     Row ${index + 1}: ${JSON.stringify(row)}`);
          });
        }
      } catch (error) {
        console.log(`   ❌ Error analyzing table: ${error.message}`);
      }
    }

    // Ask for confirmation before removal
    console.log('\n⚠️  WARNING: The following template tables will be PERMANENTLY DELETED:');
    for (const [tableName] of allTemplateTables) {
      console.log(`   - ${tableName}`);
    }
    console.log('\n⚠️  This action cannot be undone!');
    console.log('   Press Ctrl+C to cancel within 5 seconds...');
    
    // Wait 5 seconds for user to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Remove each table
    for (const [tableName] of allTemplateTables) {
      try {
        console.log(`\n🗑️  Dropping table: ${tableName}`);
        await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE;`);
        console.log(`✅ Successfully dropped table: ${tableName}`);
      } catch (error) {
        console.log(`❌ Error dropping table ${tableName}: ${error.message}`);
      }
    }

    // Verify removal
    console.log('\n🔍 Verifying table removal...');
    
    for (const [tableName] of allTemplateTables) {
      const verifyQuery = await client.query(`
        SELECT table_name
        FROM information_schema.tables 
        WHERE table_name = $1 AND table_schema = 'public';
      `, [tableName]);

      if (verifyQuery.rows.length === 0) {
        console.log(`✅ Confirmed: ${tableName} has been removed`);
      } else {
        console.log(`❌ ERROR: ${tableName} still exists after removal attempt`);
      }
    }

    // Show final table list
    console.log('\n📋 Final table list after cleanup:');
    const finalTablesQuery = await client.query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    finalTablesQuery.rows.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    console.log('\n🎉 Template table cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    console.error('📍 Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the cleanup
checkAndRemoveTemplateTables().catch(console.error);