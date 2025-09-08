#!/usr/bin/env node

const { sequelize } = require('./src/database/connection');

async function fixVersioningConstraint() {
  try {
    console.log('🔧 Fixing slot_configurations versioning constraint...');
    
    // Remove the old unique constraint
    try {
      await sequelize.query(`
        DROP INDEX IF EXISTS unique_user_store_config;
      `);
      console.log('✅ Removed old unique_user_store_config constraint');
    } catch (err) {
      console.log('⚠️ Old constraint might not exist, continuing...');
    }
    
    // Add new constraint that allows only one draft per user/store/page
    try {
      await sequelize.query(`
        CREATE UNIQUE INDEX unique_draft_per_user_store_page 
        ON slot_configurations (user_id, store_id, page_type, status) 
        WHERE status = 'draft';
      `);
      console.log('✅ Added new unique_draft_per_user_store_page constraint');
    } catch (err) {
      console.log('⚠️ New constraint might already exist, continuing...');
    }
    
    console.log('✅ Constraint fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing constraint:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fixVersioningConstraint();
}

module.exports = fixVersioningConstraint;