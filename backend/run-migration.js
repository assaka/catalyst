const { sequelize } = require('./src/database/connection');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error('Usage: node run-migration.js <migration-file.sql>');
    process.exit(1);
  }

  const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    console.log(`Running migration: ${migrationFile}`);
    await sequelize.query(sql);
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();
