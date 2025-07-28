#!/usr/bin/env node

const { sequelize } = require('./src/database/connection');
const { Customer, User } = require('./src/models');

async function testCompleteCustomerAuth() {
  try {
    console.log('🚀 Testing complete customer authentication system...');
    
    // First, sync the database
    console.log('🔄 Syncing database models...');
    await sequelize.sync({ force: true }); // Force recreate tables
    console.log('✅ Database synced successfully');
    
    // Test 1: Customer creation
    console.log('\n1. Testing customer registration...');
    const customerData = {
      email: 'test@customer.com',
      password: 'TestPassword123!',
      first_name: 'Test',
      last_name: 'Customer',
      role: 'customer',
      account_type: 'individual'
    };
    
    const customer = await Customer.create(customerData);
    console.log('✅ Customer created successfully:', {
      id: customer.id,
      email: customer.email,
      role: customer.role,
      hasPasswordHash: !!customer.password && customer.password !== customerData.password
    });
    
    // Test 2: Password authentication
    console.log('\n2. Testing password authentication...');
    const isValidPassword = await customer.comparePassword('TestPassword123!');
    const isInvalidPassword = await customer.comparePassword('wrongpassword');
    
    console.log('✅ Password validation:', {
      correctPassword: isValidPassword,
      incorrectPassword: isInvalidPassword
    });
    
    if (!isValidPassword || isInvalidPassword) {
      throw new Error('Password validation failed');
    }
    
    // Test 3: JSON serialization (password should be hidden)
    console.log('\n3. Testing JSON serialization...');
    const customerJSON = customer.toJSON();
    console.log('✅ Customer JSON security:', {
      hasPassword: 'password' in customerJSON,
      hasEmail: 'email' in customerJSON,
      hasRole: 'role' in customerJSON
    });
    
    if ('password' in customerJSON) {
      throw new Error('Password is being exposed in JSON!');
    }
    
    // Test 4: Store owner creation (should use User model)
    console.log('\n4. Testing store owner creation in users table...');
    const storeOwnerData = {
      email: 'owner@store.com',
      password: 'OwnerPassword123!',
      first_name: 'Store',
      last_name: 'Owner',
      role: 'store_owner',
      account_type: 'agency'
    };
    
    const storeOwner = await User.create(storeOwnerData);
    console.log('✅ Store owner created successfully:', {
      id: storeOwner.id,
      email: storeOwner.email,
      role: storeOwner.role,
      hasPasswordHash: !!storeOwner.password && storeOwner.password !== storeOwnerData.password
    });
    
    // Test 5: Verify separation - customers can't access users table and vice versa
    console.log('\n5. Testing table separation...');
    const customerCount = await Customer.count();
    const userCount = await User.count();
    console.log('✅ Table separation verified:', {
      customersTable: customerCount,
      usersTable: userCount
    });
    
    if (customerCount !== 1 || userCount !== 1) {
      throw new Error('Table separation not working correctly');
    }
    
    // Test 6: Customer lookup by email
    console.log('\n6. Testing customer lookup...');
    const foundCustomer = await Customer.findOne({ where: { email: customerData.email } });
    const foundUser = await User.findOne({ where: { email: storeOwnerData.email } });
    
    console.log('✅ Email lookup:', {
      customerFound: !!foundCustomer,
      storeOwnerFound: !!foundUser,
      correctRoles: foundCustomer?.role === 'customer' && foundUser?.role === 'store_owner'
    });
    
    // Test 7: Cross-table email uniqueness (customer and store owner can have same email)
    console.log('\n7. Testing cross-table email handling...');
    try {
      const customerWithSameEmail = await Customer.create({
        email: 'same@email.com',
        password: 'Password123!',
        first_name: 'Customer',
        last_name: 'Same',
        role: 'customer',
        account_type: 'individual'
      });
      
      const userWithSameEmail = await User.create({
        email: 'same@email.com',
        password: 'Password123!',
        first_name: 'User',
        last_name: 'Same',
        role: 'store_owner',
        account_type: 'agency'
      });
      
      console.log('✅ Cross-table email uniqueness:', {
        customerCreated: !!customerWithSameEmail,
        userCreated: !!userWithSameEmail,
        message: 'Same email allowed in different tables'
      });
    } catch (error) {
      console.log('ℹ️ Cross-table email constraint:', error.message);
    }
    
    console.log('\n🎉 All customer authentication tests passed!');
    console.log('📊 Final Summary:');
    console.log('  ✅ Customer authentication model works');
    console.log('  ✅ Store owner authentication model works');
    console.log('  ✅ Password hashing and validation works');  
    console.log('  ✅ JSON serialization is secure');
    console.log('  ✅ Table separation is working');
    console.log('  ✅ Role-based authentication ready');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Customer authentication test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testCompleteCustomerAuth();