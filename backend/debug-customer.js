#!/usr/bin/env node

const { sequelize } = require('./src/database/connection');
const { Customer } = require('./src/models');

async function debugCustomer() {
  try {
    console.log('🔍 Debugging customer: info@assaka.nl\n');
    
    // Sync database first
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced\n');
    
    // Find the customer
    const customer = await Customer.findOne({ 
      where: { email: 'info@assaka.nl' },
      raw: true // Get raw data including password hash
    });
    
    if (!customer) {
      console.log('❌ Customer not found in customers table');
      console.log('💡 Try checking if customer was created in users table instead:');
      
      const { User } = require('./src/models');
      const userCustomer = await User.findOne({ 
        where: { email: 'info@assaka.nl' },
        raw: true
      });
      
      if (userCustomer) {
        console.log('📋 Found in users table:', {
          id: userCustomer.id,
          email: userCustomer.email,
          role: userCustomer.role,
          hasPassword: !!userCustomer.password,
          passwordLength: userCustomer.password ? userCustomer.password.length : 0
        });
      } else {
        console.log('❌ Customer not found in users table either');
        console.log('💡 Customer may need to be re-registered');
      }
      
    } else {
      console.log('✅ Customer found in customers table:', {
        id: customer.id,
        email: customer.email,
        role: customer.role,
        account_type: customer.account_type,
        store_id: customer.store_id,
        hasPassword: !!customer.password,
        passwordLength: customer.password ? customer.password.length : 0,
        is_active: customer.is_active,
        email_verified: customer.email_verified,
        created_at: customer.created_at
      });
      
      // Test password comparison if password exists
      if (customer.password) {
        console.log('\n🧪 Testing password comparison...');
        const customerModel = await Customer.findOne({ where: { email: 'info@assaka.nl' } });
        
        // Test with common passwords
        const testPasswords = ['password', '123456', 'test123', 'Password123!'];
        
        for (const testPassword of testPasswords) {
          try {
            const isMatch = await customerModel.comparePassword(testPassword);
            console.log(`  - "${testPassword}": ${isMatch ? '✅ MATCH' : '❌ No match'}`);
            if (isMatch) break;
          } catch (error) {
            console.log(`  - "${testPassword}": ❌ Error - ${error.message}`);
          }
        }
      } else {
        console.log('\n⚠️ Customer has no password set!');
        console.log('💡 This explains why login fails - customer needs to register again');
      }
    }
    
    // Check all customers in the table
    console.log('\n📊 All customers in database:');
    const allCustomers = await Customer.findAll({ 
      attributes: ['id', 'email', 'role', 'store_id', 'created_at'],
      raw: true 
    });
    
    if (allCustomers.length === 0) {
      console.log('  No customers found');
    } else {
      allCustomers.forEach((cust, index) => {
        console.log(`  ${index + 1}. ${cust.email} (${cust.role}) - store_id: ${cust.store_id}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

debugCustomer();