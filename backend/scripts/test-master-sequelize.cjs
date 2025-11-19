/**
 * Test Master Sequelize Connection
 *
 * Tests if masterSequelize can connect and perform operations
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

async function testConnection() {
  console.log('🔧 Testing Master Sequelize Connection...\n');

  const masterDbUrl = process.env.MASTER_DB_URL;

  if (!masterDbUrl) {
    console.error('❌ MASTER_DB_URL not set in environment');
    process.exit(1);
  }

  console.log('📍 MASTER_DB_URL format:', masterDbUrl.substring(0, 50) + '...');
  console.log('');

  try {
    // Create Sequelize instance
    console.log('🔌 Creating Sequelize instance...');
    const sequelize = new Sequelize(masterDbUrl, {
      dialect: 'postgres',
      logging: console.log,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });

    // Test authentication
    console.log('🔐 Testing authentication...');
    await sequelize.authenticate();
    console.log('✅ Authentication successful!\n');

    // Test query on stores table
    console.log('📊 Testing query on stores table...');
    const [stores] = await sequelize.query('SELECT id, user_id, status FROM stores LIMIT 1');
    console.log('✅ Stores query successful:', stores);
    console.log('');

    // Test query on store_databases table
    console.log('📊 Testing query on store_databases table...');
    const [storeDbs] = await sequelize.query('SELECT id, store_id FROM store_databases LIMIT 1');
    console.log('✅ store_databases query successful:', storeDbs);
    console.log('');

    // Test INSERT
    console.log('📝 Testing INSERT into store_databases (will rollback)...');
    const transaction = await sequelize.transaction();

    try {
      await sequelize.query(
        `INSERT INTO store_databases (id, store_id, database_type, connection_string_encrypted)
         VALUES (gen_random_uuid(), (SELECT id FROM stores LIMIT 1), 'supabase', 'test-encrypted-data')`,
        { transaction }
      );
      console.log('✅ INSERT test successful!');

      // Rollback to not actually insert
      await transaction.rollback();
      console.log('🔄 Rolled back (test only)');

    } catch (insertError) {
      await transaction.rollback();
      throw insertError;
    }

    await sequelize.close();
    console.log('\n✅ All tests passed! Sequelize connection works correctly.');

  } catch (error) {
    console.error('\n❌ Connection test failed!');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error original:', error.original?.message);
    console.error('Error code:', error.original?.code);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testConnection();
