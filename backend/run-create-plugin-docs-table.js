// Create plugin_docs table
require('dotenv').config();
const fs = require('fs');
const { sequelize } = require('./src/database/connection');

async function createPluginDocsTable() {
  try {
    console.log('🚀 Creating plugin_docs table...\n');

    const sql = fs.readFileSync('./src/database/migrations/create-plugin-docs-table.sql', 'utf8');
    await sequelize.query(sql);

    console.log('✅ plugin_docs table created successfully!\n');

    console.log('📋 Table Purpose:');
    console.log('   - Store documentation files (README.md, CHANGELOG.md)');
    console.log('   - Store metadata files (manifest.json)');
    console.log('   - Reference only, NOT executed');
    console.log('   - Clean separation from executable code\n');

    console.log('✨ Clean Architecture:');
    console.log('   plugin_docs → Documentation & metadata');
    console.log('   plugin_scripts → Executable frontend code ONLY');
    console.log('   plugin_events → Event listeners');
    console.log('   plugin_hooks → Hook handlers');
    console.log('   plugin_entities → Database schemas');
    console.log('   plugin_controllers → API endpoints');
    console.log('   plugin_migrations → Migration SQL');

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createPluginDocsTable();
