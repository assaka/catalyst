// Test script to verify entities, controllers, and migrations load in FileTree
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = '109c940f-5d33-472c-b7df-c48e68c35696';

async function testFileTreeLoading() {
  try {
    console.log('🧪 Testing FileTree loading for Cart Hamid plugin...\n');

    // Simulate the API call
    const pluginId = PLUGIN_ID;

    // Load plugin_entities
    const entities = await sequelize.query(`
      SELECT entity_name, table_name, migration_status FROM plugin_entities
      WHERE plugin_id = $1 AND is_enabled = true
    `, {
      bind: [pluginId],
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`📁 entities/ (${entities.length} files)`);
    entities.forEach(e => {
      const status = e.migration_status === 'migrated' ? '✅' : '⏳';
      console.log(`   ${status} ${e.entity_name}.json [🗄️ ${e.table_name}]`);
    });

    // Load plugin_controllers
    const controllers = await sequelize.query(`
      SELECT controller_name, method, path FROM plugin_controllers
      WHERE plugin_id = $1 AND is_enabled = true
    `, {
      bind: [pluginId],
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`\n📁 controllers/ (${controllers.length} files)`);
    controllers.forEach(c => {
      console.log(`   📄 ${c.controller_name}.js [${c.method} ${c.path}]`);
    });

    // Load plugin_migrations
    const migrations = await sequelize.query(`
      SELECT migration_version, migration_description, status FROM plugin_migrations
      WHERE plugin_id = $1
    `, {
      bind: [pluginId],
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`\n📁 migrations/ (${migrations.length} files)`);
    migrations.forEach(m => {
      const status = m.status === 'completed' ? '✅' : m.status === 'failed' ? '❌' : '⏳';
      console.log(`   ${status} ${m.migration_version}.sql - ${m.migration_description}`);
    });

    console.log('\n✅ FileTree structure:');
    console.log('📁 Cart Hamid Plugin');
    console.log('  📁 entities/');
    console.log(`     ${entities.map(e => `${e.entity_name}.json`).join(', ')}`);
    console.log('  📁 controllers/');
    console.log(`     ${controllers.map(c => `${c.controller_name}.js`).join(', ')}`);
    console.log('  📁 migrations/');
    console.log(`     ${migrations.map(m => `${m.migration_version}.sql`).join(', ')}`);
    console.log('  📁 events/');
    console.log('  📁 components/');
    console.log('  📄 README.md');

    console.log('\n🎉 All file types will be visible in FileTree!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

testFileTreeLoading();
