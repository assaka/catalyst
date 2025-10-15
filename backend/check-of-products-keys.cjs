#!/usr/bin/env node
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

(async () => {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query("SELECT key, value FROM translations WHERE language_code = 'en' AND (key = 'common.of' OR key = 'common.products') ORDER BY key");
    console.log('\nChecking common.of and common.products:\n');
    results.forEach(r => console.log(`  ${r.key} = "${r.value}"`));
    if (results.length === 0) {
      console.log('  NOT FOUND - need to add to database');
    }
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
