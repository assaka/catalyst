const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Use Supabase database
const sequelize = new Sequelize(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log
});

async function runMigration() {
  try {
    console.log('🚀 Starting canonical settings consolidation migration on Supabase...\n');

    const sqlPath = path.join(__dirname, 'src/database/migrations/consolidate-canonical-settings.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by statements and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('\n📝 Executing:', statement.substring(0, 100) + '...');
        await sequelize.query(statement);
        console.log('✅ Success');
      }
    }

    console.log('\n\n🎉 Migration completed successfully!');
    console.log('\n📋 Consolidated into canonical_settings JSON:');
    console.log('  - canonical_base_url → base_url');
    console.log('  - auto_canonical_filtered_pages → auto_canonical_filtered_pages');
    console.log('\n✅ Old columns removed successfully!');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
}

runMigration();
