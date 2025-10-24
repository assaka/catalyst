const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use Supabase database
const sequelize = new Sequelize(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function checkSchema() {
  try {
    console.log('📊 Checking seo_settings table structure on Supabase...\n');

    // Check table structure (PostgreSQL)
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'seo_settings'
      ORDER BY ordinal_position;
    `);

    console.log('Current columns in seo_settings table:');
    console.log('==========================================');
    columns.forEach(col => {
      console.log(`${col.column_name.padEnd(35)} | ${col.data_type}`);
    });

    // Check if canonical_settings exists
    const hasCanonicalSettings = columns.some(c => c.column_name === 'canonical_settings');
    const hasCanonicalBaseUrl = columns.some(c => c.column_name === 'canonical_base_url');
    const hasAutoCanonical = columns.some(c => c.column_name === 'auto_canonical_filtered_pages');

    console.log('\n✅ Verification:');
    console.log('==========================================');
    console.log(`canonical_settings column exists: ${hasCanonicalSettings ? '✅ YES' : '❌ NO'}`);
    console.log(`canonical_base_url column exists: ${hasCanonicalBaseUrl ? '⚠️  YES (should be removed)' : '✅ NO (removed)'}`);
    console.log(`auto_canonical_filtered_pages exists: ${hasAutoCanonical ? '⚠️  YES (should be removed)' : '✅ NO (removed)'}`);

    // Sample the data
    console.log('\n📋 Sample canonical_settings data:');
    console.log('==========================================');
    const [data] = await sequelize.query(`
      SELECT id, canonical_settings
      FROM seo_settings
      LIMIT 3;
    `);

    if (data.length > 0) {
      data.forEach((row, idx) => {
        console.log(`\nRecord ${idx + 1}:`);
        console.log(JSON.stringify(row.canonical_settings, null, 2));
      });
    } else {
      console.log('No data found in seo_settings table');
    }

    // Check all JSON columns
    console.log('\n\n📋 All JSON columns in seo_settings:');
    console.log('==========================================');
    const jsonColumns = columns.filter(c => c.data_type && c.data_type.toLowerCase().includes('json'));
    jsonColumns.forEach(col => {
      console.log(`✅ ${col.column_name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkSchema();
