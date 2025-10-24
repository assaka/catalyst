#!/usr/bin/env node
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function listAllNormalizedTables() {
  try {
    await sequelize.authenticate();

    console.log('📊 All Normalized Translation & SEO Tables:\n');

    const result = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND (
          table_name LIKE '%_translations'
          OR table_name LIKE '%_seo'
        )
      ORDER BY table_name
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('Translation Tables:');
    console.log('==================');
    for (const table of result.filter(t => t.table_name.includes('_translations'))) {
      const count = await sequelize.query(
        `SELECT COUNT(*) as count FROM ${table.table_name}`,
        { type: sequelize.QueryTypes.SELECT }
      );

      console.log(`✅ ${table.table_name.padEnd(45)} → ${count[0].count} records`);
    }

    console.log('\nSEO Tables:');
    console.log('==================');
    for (const table of result.filter(t => t.table_name.includes('_seo'))) {
      const count = await sequelize.query(
        `SELECT COUNT(*) as count FROM ${table.table_name}`,
        { type: sequelize.QueryTypes.SELECT }
      );

      console.log(`✅ ${table.table_name.padEnd(45)} → ${count[0].count} records`);
    }

    console.log(`\n📈 Total: ${result.length} normalized tables created\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listAllNormalizedTables();
