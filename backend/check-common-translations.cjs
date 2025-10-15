#!/usr/bin/env node
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

(async () => {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query(`
      SELECT key, value
      FROM translations
      WHERE language_code = 'en'
        AND key LIKE 'common.%'
      ORDER BY key
      LIMIT 50
    `);
    console.log('\nChecking common.* translation keys:\n');
    results.forEach(r => console.log(`  ${r.key} = "${r.value}"`));
    console.log(`\nTotal: ${results.length} keys found`);
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
