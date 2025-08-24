#!/usr/bin/env node

/**
 * Complete production database template cleanup
 * This script will identify and remove ALL template-related data:
 * 1. Tables with 'template' in the name
 * 2. The template_customizations column from stores table
 * 3. Any other template-related database objects
 */

const { Client } = require('pg');
require('dotenv').config();

async function productionTemplateCleanup() {
  // Get database URL from environment or command line argument
  const databaseUrl = process.argv[2] || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ No database URL provided. Please provide it as:');
    console.error('   1. Command line argument: node production-template-cleanup.js "DATABASE_URL"');
    console.error('   2. Environment variable: SUPABASE_DB_URL or DATABASE_URL');
    console.error('\n💡 To get your Render.com database URL:');
    console.error('   1. Go to https://dashboard.render.com');
    console.error('   2. Click on your catalyst-backend-fzhu service');
    console.error('   3. Go to Environment tab');
    console.error('   4. Copy the SUPABASE_DB_URL or DATABASE_URL value');
    process.exit(1);
  }

  console.log('🧹 Starting COMPLETE template cleanup for production database...');
  console.log('📍 Database:', databaseUrl.replace(/:[^:@]*@/, ':****@'));

  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('render.com') || databaseUrl.includes('supabase.com') ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    // Connect to database
    console.log('🔌 Connecting to production database...');
    await client.connect();
    console.log('✅ Connected successfully');

    console.log('\n' + '='.repeat(60));
    console.log('🔍 PHASE 1: DISCOVERING TEMPLATE-RELATED DATA');
    console.log('='.repeat(60));

    // 1. Find all tables with 'template' in the name
    const templateTables = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_name LIKE '%template%' AND table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log(`\n📊 Found ${templateTables.rows.length} table(s) containing 'template':`);
    const tablesToDrop = [];
    
    for (const table of templateTables.rows) {
      console.log(`\n📋 Table: ${table.table_name} (${table.table_type})`);
      tablesToDrop.push(table.table_name);
      
      try {
        // Get row count
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name};`);
        console.log(`   📊 Rows: ${countResult.rows[0].count}`);
        
        // Get column info
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position;
        `, [table.table_name]);
        
        console.log(`   📋 Columns (${columnsResult.rows.length}):`);
        columnsResult.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          console.log(`     - ${col.column_name}: ${col.data_type} ${nullable}`);
        });
        
        // Show sample data if table has data
        if (parseInt(countResult.rows[0].count) > 0 && parseInt(countResult.rows[0].count) < 100) {
          const sampleResult = await client.query(`SELECT * FROM ${table.table_name} LIMIT 2;`);
          console.log(`   📄 Sample data:`);
          sampleResult.rows.forEach((row, index) => {
            console.log(`     ${index + 1}: ${JSON.stringify(row)}`);
          });
        }
        
      } catch (error) {
        console.log(`   ❌ Error analyzing table: ${error.message}`);
      }
    }

    // 2. Check for template_customizations column in stores table
    console.log('\n📋 Checking stores table for template_customizations column...');
    const storeColumnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'stores' AND column_name = 'template_customizations';
    `);

    const hasTemplateColumn = storeColumnCheck.rows.length > 0;
    if (hasTemplateColumn) {
      console.log('✅ Found template_customizations column in stores table');
      const colInfo = storeColumnCheck.rows[0];
      console.log(`   Type: ${colInfo.data_type}`);
      console.log(`   Nullable: ${colInfo.is_nullable}`);
      console.log(`   Default: ${colInfo.column_default || 'none'}`);
      
      // Check data in the column
      const columnDataCheck = await client.query(`
        SELECT 
          COUNT(*) as total_stores,
          COUNT(template_customizations) as stores_with_data,
          COUNT(CASE WHEN template_customizations::text != '{}' THEN 1 END) as stores_with_real_data
        FROM stores;
      `);
      
      const stats = columnDataCheck.rows[0];
      console.log(`   📊 Data: ${stats.total_stores} stores, ${stats.stores_with_data} with data, ${stats.stores_with_real_data} with non-empty data`);
      
    } else {
      console.log('❌ No template_customizations column found in stores table');
    }

    // 3. Summary of what will be removed
    console.log('\n' + '='.repeat(60));
    console.log('🎯 PHASE 2: CLEANUP SUMMARY');
    console.log('='.repeat(60));

    const itemsToRemove = [];
    if (tablesToDrop.length > 0) {
      itemsToRemove.push(`${tablesToDrop.length} template table(s): ${tablesToDrop.join(', ')}`);
    }
    if (hasTemplateColumn) {
      itemsToRemove.push('template_customizations column from stores table');
    }

    if (itemsToRemove.length === 0) {
      console.log('✅ No template-related data found to remove!');
      console.log('🎯 Your database is already clean of template data.');
      return;
    }

    console.log('⚠️  WARNING: The following will be PERMANENTLY DELETED:');
    itemsToRemove.forEach(item => {
      console.log(`   - ${item}`);
    });

    console.log('\n⚠️  THIS ACTION CANNOT BE UNDONE!');
    console.log('   Press Ctrl+C to cancel within 10 seconds...');
    console.log('   Or let the script continue to proceed with cleanup.');

    // Wait 10 seconds
    for (let i = 10; i > 0; i--) {
      process.stdout.write(`\r   Proceeding in ${i} seconds...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('\n\n🚀 Starting cleanup...');

    // 4. Execute cleanup
    console.log('\n' + '='.repeat(60));
    console.log('🗑️  PHASE 3: EXECUTING CLEANUP');
    console.log('='.repeat(60));

    let successCount = 0;
    let failureCount = 0;

    // Remove template tables
    for (const tableName of tablesToDrop) {
      try {
        console.log(`\n🗑️  Dropping table: ${tableName}`);
        await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE;`);
        console.log(`✅ Successfully dropped: ${tableName}`);
        successCount++;
      } catch (error) {
        console.log(`❌ Failed to drop ${tableName}: ${error.message}`);
        failureCount++;
      }
    }

    // Remove template_customizations column
    if (hasTemplateColumn) {
      try {
        console.log('\n🗑️  Removing template_customizations column from stores table...');
        await client.query('ALTER TABLE stores DROP COLUMN IF EXISTS template_customizations CASCADE;');
        console.log('✅ Successfully removed template_customizations column');
        successCount++;
      } catch (error) {
        console.log(`❌ Failed to remove column: ${error.message}`);
        failureCount++;
      }
    }

    // 5. Final verification
    console.log('\n' + '='.repeat(60));
    console.log('🔍 PHASE 4: VERIFICATION');
    console.log('='.repeat(60));

    // Check that tables are gone
    const finalTableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name LIKE '%template%' AND table_schema = 'public';
    `);

    console.log(`\n📊 Tables with 'template' remaining: ${finalTableCheck.rows.length}`);
    if (finalTableCheck.rows.length > 0) {
      finalTableCheck.rows.forEach(table => {
        console.log(`   ⚠️  Still exists: ${table.table_name}`);
      });
    }

    // Check that column is gone
    const finalColumnCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'stores' AND column_name = 'template_customizations';
    `);

    if (finalColumnCheck.rows.length === 0) {
      console.log('✅ Confirmed: template_customizations column removed from stores table');
    } else {
      console.log('❌ WARNING: template_customizations column still exists in stores table');
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('🏁 CLEANUP COMPLETE');
    console.log('='.repeat(60));

    console.log(`\n📊 Results:`);
    console.log(`   ✅ Successful operations: ${successCount}`);
    console.log(`   ❌ Failed operations: ${failureCount}`);

    if (failureCount === 0) {
      console.log('\n🎉 SUCCESS: All template data has been removed from your production database!');
      console.log('🎯 Your database is now clean of template-related tables and columns.');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS: Some operations failed. Check the errors above.');
      console.log('🔧 You may need to manually remove the remaining items.');
    }

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    console.error('📍 Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the cleanup
productionTemplateCleanup().catch(console.error);