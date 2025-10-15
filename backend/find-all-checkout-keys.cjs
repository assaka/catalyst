#!/usr/bin/env node
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

(async () => {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query("SELECT key, language_code, value FROM translations WHERE language_code = 'en' AND (key LIKE '%checkout%' OR value LIKE '%Checkout%') ORDER BY key");
    console.log('\n🔍 All checkout-related keys:\n');
    results.forEach(r => console.log(`  ${r.key} = "${r.value}"`));
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
