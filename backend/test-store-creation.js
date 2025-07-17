#!/usr/bin/env node

const { User, Store } = require('./src/models');
const { sequelize } = require('./src/database/connection');

async function testStoreCreation() {
  try {
    console.log('🔍 Testing store creation with foreign key constraint...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // First, let's check if the user exists
    const user = await User.findOne({ 
      where: { email: 'hamidelabassi99@gmail.com' } 
    });
    
    if (!user) {
      console.log('❌ User not found! Creating test user...');
      
      // Create the user first
      const newUser = await User.create({
        email: 'hamidelabassi99@gmail.com',
        password: 'testpassword123',
        first_name: 'Hamid',
        last_name: 'Abassi',
        role: 'store_owner',
        account_type: 'individual',
        is_active: true,
        email_verified: true
      });
      
      console.log('✅ User created:', newUser.email);
    } else {
      console.log('✅ User found:', user.email);
    }
    
    // Now try to create a store
    const testStore = {
      name: 'Test Store ' + Date.now(),
      slug: 'test-store-' + Date.now(),
      description: 'Test store for foreign key testing',
      owner_email: 'hamidelabassi99@gmail.com'
    };
    
    console.log('🔄 Creating test store...');
    const store = await Store.create(testStore);
    
    console.log('✅ Store created successfully!');
    console.log('Store ID:', store.id);
    console.log('Store name:', store.name);
    console.log('Owner email:', store.owner_email);
    
    // Clean up - delete the test store
    await store.destroy();
    console.log('✅ Test store cleaned up');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      console.error('🔍 Foreign key constraint error details:');
      console.error('- Table:', error.table);
      console.error('- Constraint:', error.constraint);
      console.error('- Fields:', error.fields);
      console.error('- Value:', error.value);
    }
  } finally {
    await sequelize.close();
  }
}

testStoreCreation();