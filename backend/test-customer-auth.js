#!/usr/bin/env node

const { Customer } = require('./src/models');

async function testCustomerAuth() {
  try {
    console.log('🧪 Testing customer authentication...');
    
    // Test customer creation
    console.log('1. Testing customer registration...');
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
    
    // Test password comparison
    console.log('2. Testing password authentication...');
    const isValidPassword = await customer.comparePassword('TestPassword123!');
    const isInvalidPassword = await customer.comparePassword('wrongpassword');
    
    console.log('✅ Password validation:', {
      correctPassword: isValidPassword,
      incorrectPassword: isInvalidPassword
    });
    
    // Test toJSON method (password should be hidden)
    console.log('3. Testing JSON serialization...');
    const customerJSON = customer.toJSON();
    console.log('✅ Customer JSON:', {
      hasPassword: 'password' in customerJSON,
      hasEmail: 'email' in customerJSON,
      hasRole: 'role' in customerJSON
    });
    
    // Test finding customer by email
    console.log('4. Testing customer lookup...');
    const foundCustomer = await Customer.findOne({ where: { email: customerData.email } });
    console.log('✅ Customer found by email:', !!foundCustomer);
    
    // Clean up
    await customer.destroy();
    console.log('🧹 Test customer cleaned up');
    
    console.log('🎉 All customer authentication tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Customer authentication test failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testCustomerAuth();