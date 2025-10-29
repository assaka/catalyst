// Run plugin migrations with proper database connection
require('dotenv').config();
const path = require('path');
const { PluginMigrationTracker } = require('./src/database/migrations/plugin-migration-tracker');
const { sequelize } = require('./src/database/connection');

async function runMigration() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const param1 = args[1];
  const param2 = args[2];

  const tracker = new PluginMigrationTracker();

  try {
    console.log('🔌 Plugin Migration Runner\n');

    // Ensure table exists
    await tracker.ensurePluginMigrationsTable();

    switch (command) {
      case 'run':
        if (!param1) {
          console.error('❌ Usage: node run-plugin-migration.js run <filename>');
          process.exit(1);
        }
        const result = await tracker.executeMigration(param1, {
          force: args.includes('--force'),
          dryRun: args.includes('--dry-run')
        });
        process.exit(result.success ? 0 : 1);
        break;

      case 'rollback':
        if (!param1 || !param2) {
          console.error('❌ Usage: node run-plugin-migration.js rollback <plugin-id> <version>');
          process.exit(1);
        }
        const rollbackResult = await tracker.rollbackMigration(param1, param2);
        process.exit(rollbackResult.success ? 0 : 1);
        break;

      case 'list':
        await tracker.listMigrations(param1);
        process.exit(0);
        break;

      default:
        console.log('Commands:');
        console.log('  run <filename> [--force] [--dry-run] - Run a migration');
        console.log('  rollback <plugin-id> <version>        - Rollback a migration');
        console.log('  list [plugin-id]                      - List migrations\n');
        console.log('Examples:');
        console.log('  node run-plugin-migration.js run 20250129_143000_create_hamid_cart_table.sql');
        console.log('  node run-plugin-migration.js list');
        process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();
