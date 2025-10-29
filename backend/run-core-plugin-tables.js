// Create core plugin tables: plugin_entities and plugin_controllers
require('dotenv').config();
const fs = require('path');
const { sequelize } = require('./src/database/connection');

async function createCoreTables() {
  try {
    console.log('🚀 Creating core plugin tables...\n');

    // Read and execute plugin_entities table
    console.log('1️⃣ Creating plugin_entities table...');
    const entitiesSQL = require('fs').readFileSync(
      './src/database/migrations/create-plugin-entities-table.sql',
      'utf8'
    );
    await sequelize.query(entitiesSQL);
    console.log('   ✅ plugin_entities table created\n');

    // Read and execute plugin_controllers table
    console.log('2️⃣ Creating plugin_controllers table...');
    const controllersSQL = require('fs').readFileSync(
      './src/database/migrations/create-plugin-controllers-table.sql',
      'utf8'
    );
    await sequelize.query(controllersSQL);
    console.log('   ✅ plugin_controllers table created\n');

    console.log('✅ Core plugin tables created successfully!\n');
    console.log('📋 Next steps:');
    console.log('   - Add entities to plugins via AI Studio');
    console.log('   - Add controllers to plugins via AI Studio');
    console.log('   - Run entity migrations to create actual database tables');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

createCoreTables();
