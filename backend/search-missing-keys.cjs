#!/usr/bin/env node
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

(async () => {
  try {
    await sequelize.authenticate();

    console.log('\n🔍 Searching for add_to_cart keys:\n');
    const [addToCart] = await sequelize.query("SELECT key, value FROM translations WHERE language_code = 'en' AND (key LIKE '%add%cart%' OR value LIKE '%Add to Cart%') ORDER BY key");
    addToCart.forEach(r => console.log(`  ${r.key} = "${r.value}"`));

    console.log('\n🔍 Searching for recommended/suggestion keys:\n');
    const [recommended] = await sequelize.query("SELECT key, value FROM translations WHERE language_code = 'en' AND (key LIKE '%recommend%' OR key LIKE '%suggest%' OR value LIKE '%Recommend%' OR value LIKE '%Suggest%') ORDER BY key");
    recommended.forEach(r => console.log(`  ${r.key} = "${r.value}"`));

    console.log('\n🔍 Searching for filters key:\n');
    const [filters] = await sequelize.query("SELECT key, value FROM translations WHERE language_code = 'en' AND (key LIKE '%filter%' OR value = 'Filters') ORDER BY key");
    filters.forEach(r => console.log(`  ${r.key} = "${r.value}"`));

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
