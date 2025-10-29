// Check if hamid_cart table exists in production database
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function checkTableExists() {
  try {
    console.log('🔍 Checking if hamid_cart table exists in database...\n');

    // Check table existence
    const result = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'hamid_cart'
      )
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    const tableExists = result[0].exists;

    if (tableExists) {
      console.log('✅ hamid_cart table EXISTS in database\n');

      // Get column info
      const columns = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'hamid_cart'
        ORDER BY ordinal_position
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      console.log('📊 Columns in hamid_cart:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
      });

      console.log('\n🔍 This means ALTER TABLE migrations should be generated');
    } else {
      console.log('❌ hamid_cart table DOES NOT EXIST in database\n');
      console.log('💡 This is why CREATE TABLE migrations are being generated');
      console.log('\n🔧 To fix, run the migration:');
      console.log('   node backend/run-hamid-cart-migration.js');
      console.log('   Or run from migrations folder in AI Studio');
    }

    // Check entity in plugin_entities table
    console.log('\n📦 Checking plugin_entities table...');
    try {
      const entities = await sequelize.query(`
        SELECT entity_name, table_name, migration_status
        FROM plugin_entities
        WHERE table_name = 'hamid_cart'
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      if (entities.length > 0) {
        console.log('✅ Entity found in plugin_entities:');
        entities.forEach(e => {
          console.log(`  - ${e.entity_name} → ${e.table_name} [${e.migration_status}]`);
        });
      } else {
        console.log('⚠️ No entity found in plugin_entities for hamid_cart');
      }
    } catch (err) {
      console.log('⚠️ plugin_entities table may not exist:', err.message);
    }

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTableExists();
