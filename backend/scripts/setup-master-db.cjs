/**
 * Setup Master Database Schema
 *
 * Runs the master database schema SQL to create all platform tables
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { masterSupabaseClient } = require('../src/database/masterConnection');

async function setupMasterDb() {
  console.log('🔧 Setting up Master Database Schema...\n');

  try {
    // Read the schema SQL file
    const schemaPath = path.join(__dirname, '../src/database/schemas/master/001-create-master-tables.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Read schema file:', schemaPath);
    console.log('📏 SQL length:', sql.length, 'characters\n');

    // Execute the SQL
    console.log('🚀 Executing SQL...');
    const { data, error } = await masterSupabaseClient.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If rpc doesn't exist, we need to create tables one by one
      console.log('⚠️  RPC method not available, using direct approach...\n');

      // Check if store_databases table exists
      const { data: tables } = await masterSupabaseClient
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'store_databases');

      if (!tables || tables.length === 0) {
        console.error('❌ store_databases table does not exist!');
        console.error('');
        console.error('Please run the following SQL manually in your Supabase SQL Editor:');
        console.error('');
        console.error('File: backend/src/database/schemas/master/001-create-master-tables.sql');
        console.error('');
        console.error('Or copy and paste this:');
        console.error('-'.repeat(60));
        console.log(sql);
        console.error('-'.repeat(60));
      } else {
        console.log('✅ store_databases table already exists!');
      }
    } else {
      console.log('✅ Schema executed successfully!\n');
      console.log('Tables created:');
      console.log('  - users');
      console.log('  - stores');
      console.log('  - store_databases');
      console.log('  - store_hostnames');
      console.log('  - subscriptions');
      console.log('  - credit_balances');
      console.log('  - credit_transactions');
      console.log('  - service_credit_costs');
      console.log('  - job_queue');
      console.log('  - usage_metrics');
      console.log('  - billing_transactions');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\nPlease run the SQL file manually in Supabase SQL Editor.');
    process.exit(1);
  }
}

setupMasterDb()
  .then(() => {
    console.log('\n✅ Master DB setup complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
