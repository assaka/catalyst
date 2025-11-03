/**
 * Run email templates migration to add is_system field and seed system templates
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Running email templates migration...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'src/database/migrations/add-system-email-templates.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify results
    const result = await client.query(`
      SELECT store_id, identifier, subject, is_system, is_active
      FROM email_templates
      WHERE is_system = TRUE
      ORDER BY store_id, sort_order
    `);

    console.log('📧 System email templates created:');
    console.log('Total:', result.rows.length);
    console.log('\nTemplates:');
    result.rows.forEach(row => {
      console.log(`  - ${row.identifier} (${row.subject}) [${row.is_active ? 'Active' : 'Inactive'}]`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  });
