// Script to create system CMS pages (404, Privacy Policy) for all stores
// Run this once to backfill existing stores

const { sequelize } = require('./src/database/connection');
const { Store, CmsPage } = require('./src/models');
const { createSystemPagesForAllStores } = require('./src/utils/createSystemPages');

async function main() {
  try {
    console.log('🚀 Starting system pages creation...\n');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Create system pages for all stores
    await createSystemPagesForAllStores(Store, CmsPage);

    console.log('\n✅ All done!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
