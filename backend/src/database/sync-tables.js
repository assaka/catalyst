#!/usr/bin/env node

const { sequelize } = require('./connection');
const ProductTab = require('../models/ProductTab');

async function syncTables() {
  try {
    console.log('🚀 Starting table synchronization...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection verified');
    
    // Sync all models - this will add missing columns
    await sequelize.sync({ alter: true });
    console.log('✅ Tables synchronized successfully!');
    
    // Test ProductTab creation to verify it works
    console.log('🧪 Testing ProductTab model...');
    const testData = {
      store_id: '123e4567-e89b-12d3-a456-426614174000', // fake UUID for test
      name: 'Test Tab',
      tab_type: 'text',
      content: 'Test content'
    };
    
    // Just validate the model structure without actually creating
    const instance = ProductTab.build(testData);
    await instance.validate();
    console.log('✅ ProductTab model validation passed');
    
    console.log('🎉 Table synchronization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Table synchronization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncTables();
}

module.exports = syncTables;