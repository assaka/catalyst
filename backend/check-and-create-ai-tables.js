// Check and create AI Studio tables
const { sequelize } = require('./src/database/connection');

async function checkAndCreateTables() {
  try {
    console.log('🔍 Checking AI Studio tables...\n');

    // Check plugin_marketplace table
    console.log('Checking plugin_marketplace table...');
    const [marketplaceExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'plugin_marketplace'
      );
    `);
    console.log('plugin_marketplace exists:', marketplaceExists[0].exists);

    if (!marketplaceExists[0].exists) {
      console.log('⚠️ plugin_marketplace table does not exist! Running migration...');
      await sequelize.query(require('fs').readFileSync('./src/database/migrations/create-plugin-architecture-tables.sql', 'utf8'));
      console.log('✅ Plugin tables created');
    }

    // Check ai_usage_logs table
    console.log('\nChecking ai_usage_logs table...');
    const [aiLogsExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'ai_usage_logs'
      );
    `);
    console.log('ai_usage_logs exists:', aiLogsExists[0].exists);

    if (!aiLogsExists[0].exists) {
      console.log('⚠️ AI tracking tables do not exist! Running migration...');
      const migration = require('./src/database/migrations/20250127-create-ai-tracking-tables');
      await migration.up();
      console.log('✅ AI tracking tables created');
    }

    // Count existing plugins
    console.log('\n📊 Checking existing data...');

    const [marketplacePlugins] = await sequelize.query(`
      SELECT COUNT(*) as count FROM plugin_marketplace;
    `);
    console.log(`Marketplace plugins: ${marketplacePlugins[0].count}`);

    const [installedPlugins] = await sequelize.query(`
      SELECT COUNT(*) as count FROM plugins WHERE status = 'active';
    `);
    console.log(`Installed plugins: ${installedPlugins[0].count}`);

    // Sample installed plugins
    if (installedPlugins[0].count > 0) {
      console.log('\n📦 Sample installed plugins:');
      const [plugins] = await sequelize.query(`
        SELECT name, slug, version, status
        FROM plugins
        LIMIT 5;
      `);
      console.table(plugins);
    }

    console.log('\n✅ All checks complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkAndCreateTables();
