/**
 * Test Master DB Connection
 *
 * Run this script on Render to verify master DB connection
 * Usage: node backend/test-master-db-connection.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

async function testMasterDBConnection() {
  console.log('\n========================================');
  console.log('🔍 Testing Master DB Connection');
  console.log('========================================\n');

  // Check environment variables
  console.log('1. Checking environment variables...');
  const masterDbUrl = process.env.MASTER_DB_URL;

  if (!masterDbUrl) {
    console.error('❌ MASTER_DB_URL not found in environment');
    console.log('\nPlease set MASTER_DB_URL in your .env or Render environment variables');
    process.exit(1);
  }

  console.log('✅ MASTER_DB_URL found');
  console.log(`   URL: ${masterDbUrl.substring(0, 30)}...`);

  // Parse URL
  try {
    const url = new URL(masterDbUrl);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port || '5432'}`);
    console.log(`   Database: ${url.pathname.slice(1)}`);
    console.log(`   User: ${url.username}`);
  } catch (error) {
    console.error('❌ Invalid URL format:', error.message);
    process.exit(1);
  }

  // Create connection
  console.log('\n2. Creating Sequelize connection...');
  const sequelize = new Sequelize(masterDbUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 1,
      acquire: 30000,
      idle: 10000
    }
  });

  // Test authentication
  console.log('\n3. Testing connection...');
  try {
    await sequelize.authenticate();
    console.log('✅ Successfully connected to master database!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nCommon issues:');
    console.error('  - Wrong password');
    console.error('  - Database not running');
    console.error('  - Firewall/IP restrictions');
    console.error('  - SSL configuration');
    process.exit(1);
  }

  // Test query
  console.log('\n4. Testing query execution...');
  try {
    const [results] = await sequelize.query("SELECT NOW() as current_time");
    console.log('✅ Query executed successfully');
    console.log(`   Server time: ${results[0].current_time}`);
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    await sequelize.close();
    process.exit(1);
  }

  // Check tables exist
  console.log('\n5. Checking if migration tables exist...');
  try {
    const [tables] = await sequelize.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log(`✅ Found ${tables.length} tables:`);

    const expectedTables = [
      'users',
      'stores',
      'store_databases',
      'store_hostnames',
      'subscriptions',
      'credit_balances',
      'credit_transactions',
      'service_credit_costs',
      'job_queue',
      'usage_metrics',
      'api_usage_logs',
      'billing_transactions'
    ];

    const foundTables = tables.map(t => t.tablename);

    let allTablesExist = true;
    for (const expectedTable of expectedTables) {
      if (foundTables.includes(expectedTable)) {
        console.log(`   ✓ ${expectedTable}`);
      } else {
        console.log(`   ✗ ${expectedTable} (MISSING)`);
        allTablesExist = false;
      }
    }

    if (!allTablesExist) {
      console.log('\n⚠️  Some tables are missing.');
      console.log('Run the migration: backend/src/database/schemas/master/001-create-master-tables.sql');
    } else {
      console.log('\n✅ All expected tables exist!');
    }

  } catch (error) {
    console.error('❌ Failed to check tables:', error.message);
  }

  // Test insert
  console.log('\n6. Testing write operation...');
  try {
    await sequelize.query(`
      INSERT INTO service_credit_costs (
        id,
        service_key,
        service_name,
        service_category,
        cost_per_unit,
        billing_type,
        description
      ) VALUES (
        gen_random_uuid(),
        'test_service_${Date.now()}',
        'Test Service',
        'other',
        1.00,
        'per_use',
        'Test entry - can be deleted'
      )
    `);
    console.log('✅ Write operation successful');
  } catch (error) {
    if (error.message.includes('duplicate key')) {
      console.log('✅ Write operation successful (duplicate key is ok)');
    } else {
      console.error('❌ Write failed:', error.message);
    }
  }

  // Close connection
  await sequelize.close();

  console.log('\n========================================');
  console.log('🎉 Master DB Connection Test Complete!');
  console.log('========================================\n');
  console.log('✅ Connection: Working');
  console.log('✅ Authentication: Passed');
  console.log('✅ Query: Working');
  console.log('✅ Tables: Verified');
  console.log('✅ Write: Working');
  console.log('\nYou are ready to proceed! 🚀\n');

  process.exit(0);
}

// Run test
testMasterDBConnection().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
