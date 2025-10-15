#!/usr/bin/env node
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

(async () => {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query("SELECT key, value FROM translations WHERE language_code = 'en' AND key LIKE 'product.recommend%' ORDER BY key");
    console.log('\n Product recommended keys:\n');
    if (results.length === 0) {
      console.log('  No product.recommended_products key found - NEED TO ADD');
    } else {
      results.forEach(r => console.log(`  ${r.key} = "${r.value}"`));
    }
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
