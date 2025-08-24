#!/usr/bin/env node

/**
 * Remove template_customizations column from production database
 * This script safely removes the unused template_customizations column from the stores table
 */

const { Client } = require('pg');
require('dotenv').config();

async function removeTemplateCustomizationsColumn() {
  // Get database URL from environment or command line argument
  const databaseUrl = process.argv[2] || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ No database URL provided. Please provide it as:');
    console.error('   1. Command line argument: node run-remove-template-customizations.js "DATABASE_URL"');
    console.error('   2. Environment variable: SUPABASE_DB_URL or DATABASE_URL');
    process.exit(1);
  }

  console.log('🔧 Starting template_customizations column removal...');
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

    // Check if stores table exists
    const storesTableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'stores' AND table_schema = 'public';
    `);

    if (storesTableCheck.rows.length === 0) {
      console.log('❌ stores table does not exist!');
      return;
    }

    console.log('✅ stores table exists');

    // Check if template_customizations column exists
    const columnCheck = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'stores' AND column_name = 'template_customizations';
    `);

    if (columnCheck.rows.length === 0) {
      console.log('✅ template_customizations column does not exist (already removed)');
      console.log('🎯 No action needed - column is already removed from production database');
      return;
    }

    const columnInfo = columnCheck.rows[0];
    console.log('📋 Found template_customizations column:');
    console.log(`   Type: ${columnInfo.data_type}`);
    console.log(`   Nullable: ${columnInfo.is_nullable}`);
    console.log(`   Default: ${columnInfo.column_default || 'none'}`);

    // Check if column has any non-empty data
    const dataCheck = await client.query(`
      SELECT 
        COUNT(*) as total_rows,
        COUNT(template_customizations) as non_null_rows,
        COUNT(CASE WHEN template_customizations::text != '{}' THEN 1 END) as non_empty_rows
      FROM stores 
      WHERE template_customizations IS NOT NULL;
    `);

    const stats = dataCheck.rows[0];
    console.log('📊 Data analysis:');
    console.log(`   Total rows in stores table: ${stats.total_rows}`);
    console.log(`   Rows with non-null template_customizations: ${stats.non_null_rows}`);
    console.log(`   Rows with non-empty template_customizations: ${stats.non_empty_rows}`);

    // Show sample data if any exists
    if (stats.non_empty_rows > 0) {
      const sampleData = await client.query(`
        SELECT id, name, template_customizations 
        FROM stores 
        WHERE template_customizations IS NOT NULL 
          AND template_customizations::text != '{}' 
        LIMIT 3;
      `);

      console.log('📋 Sample data that will be removed:');
      sampleData.rows.forEach(row => {
        console.log(`   Store: ${row.name} (${row.id})`);
        console.log(`   Data: ${JSON.stringify(row.template_customizations)}`);
      });

      console.log('⚠️  WARNING: This will permanently remove the template_customizations data shown above!');
      console.log('   Press Ctrl+C to cancel if you want to backup this data first.');
      
      // Add a small delay for user to see the warning
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Remove the column
    console.log('🗑️  Removing template_customizations column...');
    await client.query('ALTER TABLE stores DROP COLUMN template_customizations;');
    console.log('✅ Successfully removed template_customizations column');

    // Verify removal
    const verifyRemoval = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'stores' AND column_name = 'template_customizations';
    `);

    if (verifyRemoval.rows.length === 0) {
      console.log('✅ Verified: template_customizations column has been completely removed');
    } else {
      console.log('❌ ERROR: Column still exists after removal attempt');
    }

    // Show current stores table structure
    const currentColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'stores'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Current stores table structure:');
    currentColumns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`   ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
    });

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('📍 Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
removeTemplateCustomizationsColumn().catch(console.error);