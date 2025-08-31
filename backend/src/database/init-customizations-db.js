/**
 * Initialize Customizations Database Tables
 * Run this script to create the customization system tables
 */

const fs = require('fs');
const path = require('path');
const { sequelize } = require('./connection');

async function initCustomizationsTables() {
  try {
    console.log('🚀 Initializing Customizations Database Tables...');
    
    // Read the SQL migration file
    const sqlFilePath = path.join(__dirname, 'migrations', 'create-customizations-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL to create tables
    await sequelize.query(sqlContent);
    
    console.log('✅ Customizations tables created successfully!');
    console.log('📋 Created tables:');
    console.log('   - customizations (main table)');
    console.log('   - customization_versions (version control)');
    console.log('   - customization_releases (release management)');
    console.log('   - customization_logs (application tracking)');
    console.log('📊 Created indexes for performance optimization');
    
    // Verify tables exist
    const tableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'customization%'
      ORDER BY table_name;
    `;
    
    const [results] = await sequelize.query(tableQuery);
    
    if (results.length > 0) {
      console.log('\n🔍 Verified tables exist:');
      results.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
    } else {
      console.log('⚠️ Warning: Could not verify table creation');
    }
    
    console.log('\n🎯 Customization system ready to use!');
    console.log('🔧 Supported customization types:');
    console.log('   - file_modification (code changes)');
    console.log('   - layout_modification (UI layout)');
    console.log('   - css_injection (styling)');
    console.log('   - javascript_injection (behavior)');
    console.log('   - component_replacement (React components)');
    console.log('   - hook_customization (WordPress-style hooks)');
    console.log('   - event_handler (DOM events)');
    
  } catch (error) {
    console.error('❌ Error initializing customizations tables:', error);
    console.error('📝 Error details:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('ℹ️ Tables may already exist - this is normal if running multiple times');
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initCustomizationsTables()
    .then(() => {
      console.log('\n🏁 Database initialization complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fatal error during initialization:', error);
      process.exit(1);
    });
}

module.exports = {
  initCustomizationsTables
};