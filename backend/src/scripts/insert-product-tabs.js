#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../database/connection');

async function insertProductTabs() {
  try {
    console.log('🚀 Starting product tabs insertion...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '../../insert-sample-product-tabs.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL file loaded');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection verified');

    // Execute the SQL
    console.log('🔄 Inserting product tabs...');
    const [results] = await sequelize.query(sql);

    console.log('✅ Product tabs inserted successfully!');

    // Show the results
    if (results && results.length > 0) {
      console.log('\n📊 Product tabs created:');
      console.table(results);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to insert product tabs:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  insertProductTabs();
}

module.exports = insertProductTabs;
