const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log
});

async function runMigration() {
  try {
    console.log('🚀 Running canonical settings migration on Supabase...\n');

    // Step 1: Add new JSON column
    console.log('Step 1: Adding canonical_settings column...');
    await sequelize.query(`
      ALTER TABLE seo_settings
      ADD COLUMN IF NOT EXISTS canonical_settings JSONB DEFAULT '{"base_url": "", "auto_canonical_filtered_pages": true}'::jsonb;
    `);
    console.log('✅ Column added\n');

    // Step 2: Migrate existing data
    console.log('Step 2: Migrating data to canonical_settings...');
    const [result] = await sequelize.query(`
      UPDATE seo_settings
      SET canonical_settings = jsonb_build_object(
        'base_url', COALESCE(canonical_base_url, ''),
        'auto_canonical_filtered_pages', COALESCE(auto_canonical_filtered_pages, true)
      )
      WHERE canonical_settings IS NULL OR canonical_settings = '{}'::jsonb;
    `);
    console.log(`✅ Migrated ${result.rowCount || 0} rows\n`);

    // Step 3: Drop old columns
    console.log('Step 3: Dropping old columns...');
    await sequelize.query(`
      ALTER TABLE seo_settings
      DROP COLUMN IF EXISTS canonical_base_url;
    `);
    await sequelize.query(`
      ALTER TABLE seo_settings
      DROP COLUMN IF EXISTS auto_canonical_filtered_pages;
    `);
    console.log('✅ Old columns dropped\n');

    // Step 4: Add comment
    console.log('Step 4: Adding column comment...');
    await sequelize.query(`
      COMMENT ON COLUMN seo_settings.canonical_settings IS 'Consolidated canonical URL settings including base URL and auto-canonical configuration';
    `);
    console.log('✅ Comment added\n');

    console.log('🎉 Migration completed successfully!\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
}

runMigration();
