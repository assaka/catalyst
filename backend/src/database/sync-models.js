#!/usr/bin/env node

const { sequelize } = require('./connection');
const models = require('../models'); // Master DB models for sync utility

async function syncModels() {
  try {
    console.log('🚀 Starting model synchronization...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection verified');
    
    // Sync all models with the database
    console.log('🔄 Synchronizing models with database...');
    await sequelize.sync({ alter: true, force: false });
    
    console.log('✅ Model synchronization completed!');
    
    // Test the models
    console.log('🧪 Testing models...');
    
    const { User, Customer, Store, Address } = models;
    
    // Count existing records
    const userCount = await User.count();
    const customerCount = await Customer.count();
    const storeCount = await Store.count();
    const addressCount = await Address.count();
    
    console.log('📊 Current record counts:');
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Customers: ${customerCount}`);
    console.log(`  - Stores: ${storeCount}`);
    console.log(`  - Addresses: ${addressCount}`);
    
    // Test customer creation
    console.log('🧪 Testing customer creation...');
    try {
      const testCustomer = await Customer.create({
        email: 'test@example.com',
        password: 'testpassword123',
        first_name: 'Test',
        last_name: 'Customer',
        role: 'customer',
        account_type: 'individual'
      });
      
      console.log('✅ Test customer created successfully:', testCustomer.id);
      
      // Clean up test customer
      await testCustomer.destroy();
      console.log('🧹 Test customer cleaned up');
      
    } catch (error) {
      console.error('❌ Customer creation test failed:', error.message);
    }
    
    console.log('🎉 Model sync completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Model sync failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncModels();
}

module.exports = syncModels;