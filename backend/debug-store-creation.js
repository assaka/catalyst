#!/usr/bin/env node

const { sequelize } = require('./src/database/connection');
const { Store } = require('./src/models');

async function debugStoreCreation() {
  console.log('🔍 Debugging store creation issue...\n');
  
  try {
    // Step 1: Test basic database connection
    console.log('1️⃣ Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Step 2: Check if Store model is properly loaded
    console.log('2️⃣ Checking Store model...');
    console.log('Store model name:', Store.name);
    console.log('Store table name:', Store.tableName);
    console.log('Store attributes:', Object.keys(Store.rawAttributes));
    console.log('✅ Store model loaded successfully\n');
    
    // Step 3: Try to sync the Store table
    console.log('3️⃣ Syncing Store table...');
    await Store.sync({ alter: true });
    console.log('✅ Store table sync successful\n');
    
    // Step 4: Try a simple query
    console.log('4️⃣ Testing Store query...');
    const stores = await Store.findAll({ limit: 1 });
    console.log(`✅ Store query successful - found ${stores.length} stores\n`);
    
    // Step 5: Try to create a test store
    console.log('5️⃣ Testing store creation...');
    const testStore = {
      name: 'Test Store ' + Date.now(),
      slug: 'test-store-' + Date.now(),
      description: 'Test store for debugging',
      owner_email: 'test@example.com'
    };
    
    console.log('Test store data:', testStore);
    
    const createdStore = await Store.create(testStore);
    console.log('✅ Store creation successful!');
    console.log('Created store ID:', createdStore.id);
    
    // Clean up - delete the test store
    await createdStore.destroy();
    console.log('✅ Test store cleaned up\n');
    
    console.log('🎉 All tests passed! Store creation should work.');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('\n💡 This is a connection error. Check your DATABASE_URL environment variable.');
    }
    
    if (error.name === 'SequelizeConnectionRefusedError') {
      console.error('\n💡 Connection refused. Check if your database is running and accessible.');
    }
    
    if (error.name === 'SequelizeHostNotFoundError') {
      console.error('\n💡 Host not found. Check your database hostname.');
    }
    
    if (error.name === 'SequelizeAccessDeniedError') {
      console.error('\n💡 Access denied. Check your database credentials.');
    }
    
    console.error('\nFull error details:');
    console.error(error.stack);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the debug
debugStoreCreation().catch(console.error);