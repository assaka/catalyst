/**
 * Quick test of MASTER_DB_URL connection
 */

const { Sequelize } = require('sequelize');

const MASTER_DB_URL = 'postgresql://postgres.rduywfunijdaqyhcyxpq:OFA1OjaM0U1VnDGe@aws-0-eu-north-1.pooler.supabase.com:6543/postgres';

async function test() {
  console.log('Testing connection...\n');

  const sequelize = new Sequelize(MASTER_DB_URL, {
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });

  try {
    await sequelize.authenticate();
    console.log('\n✅ Connection successful!');

    // Test query on stores
    const [stores] = await sequelize.query('SELECT id FROM stores LIMIT 1');
    console.log('✅ Stores query works:', stores);

    // Test query on store_databases
    const [dbs] = await sequelize.query('SELECT id FROM store_databases LIMIT 1');
    console.log('✅ store_databases query works:', dbs);

    await sequelize.close();
    console.log('\n🎉 All tests passed! Connection is good.');
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('Original:', error.original);
  }
}

test();
