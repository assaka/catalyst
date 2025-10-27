// Check and create AI Studio tables
const { sequelize } = require('./src/database/connection');

async function checkAndCreateTables() {
  try {
    console.log('🔍 Checking AI Studio and Plugin tables...\n');

    // Check all plugin_* tables
    console.log('=== PLUGIN TABLES ===\n');
    const pluginTables = [
      'plugin_marketplace',
      'plugin_versions',
      'plugin_licenses',
      'plugin_reviews',
      'plugin_configurations',
      'plugin_dependencies',
      'plugins', // Installed plugins
      'admin_navigation_registry'
    ];

    const tableStatus = {};
    for (const tableName of pluginTables) {
      const [result] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = '${tableName}'
        );
      `);
      tableStatus[tableName] = result[0].exists;
      console.log(`${result[0].exists ? '✅' : '❌'} ${tableName}: ${result[0].exists ? 'exists' : 'MISSING'}`);
    }

    // Check AI tables
    console.log('\n=== AI STUDIO TABLES ===\n');
    const aiTables = ['ai_usage_logs', 'credit_transactions'];
    for (const tableName of aiTables) {
      const [result] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = '${tableName}'
        );
      `);
      tableStatus[tableName] = result[0].exists;
      console.log(`${result[0].exists ? '✅' : '❌'} ${tableName}: ${result[0].exists ? 'exists' : 'MISSING'}`);
    }

    // If plugin_marketplace doesn't exist, don't try to run migration automatically
    // Just report what's missing
    console.log('\n=== DATA COUNTS ===\n');

    if (tableStatus['plugin_marketplace']) {
      const [marketplacePlugins] = await sequelize.query(`
        SELECT COUNT(*) as count FROM plugin_marketplace;
      `);
      console.log(`Marketplace plugins: ${marketplacePlugins[0].count}`);

      if (marketplacePlugins[0].count > 0) {
        const [sample] = await sequelize.query(`
          SELECT name, slug, version, category, pricing_model, downloads
          FROM plugin_marketplace
          LIMIT 5;
        `);
        console.log('\n📦 Sample marketplace plugins:');
        console.table(sample);
      }
    }

    if (tableStatus['plugins']) {
      const [installedPlugins] = await sequelize.query(`
        SELECT COUNT(*) as count FROM plugins;
      `);
      console.log(`\nInstalled plugins: ${installedPlugins[0].count}`);

      if (installedPlugins[0].count > 0) {
        const [sample] = await sequelize.query(`
          SELECT name, slug, version, status, installed_at
          FROM plugins
          LIMIT 5;
        `);
        console.log('\n🔌 Sample installed plugins:');
        console.table(sample);
      }
    }

    if (tableStatus['ai_usage_logs']) {
      const [usageLogs] = await sequelize.query(`
        SELECT COUNT(*) as count FROM ai_usage_logs;
      `);
      console.log(`\nAI usage logs: ${usageLogs[0].count}`);
    }

    if (tableStatus['credit_transactions']) {
      const [transactions] = await sequelize.query(`
        SELECT COUNT(*) as count FROM credit_transactions;
      `);
      console.log(`Credit transactions: ${transactions[0].count}`);
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
