#!/usr/bin/env node
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function checkTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected\n');

    const [results] = await sequelize.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'translations'
      ORDER BY ordinal_position
    `);

    console.log('Translations table structure:');
    results.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));

    const [count] = await sequelize.query("SELECT COUNT(*) as count FROM translations");
    console.log(`\nCurrent row count: ${count[0].count}`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTable();
