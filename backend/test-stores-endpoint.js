// Set environment to production to use PostgreSQL
process.env.DATABASE_URL = "postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";
process.env.NODE_ENV = "production";

const express = require('express');
const { sequelize } = require('./src/database/connection');
const { Store, User } = require('./src/models');

async function testStoresEndpointLogic() {
  try {
    console.log('🧪 Testing stores endpoint logic directly...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Test 1: Find the user
    const userEmail = 'playamin998@gmail.com';
    const user = await User.findOne({ where: { email: userEmail } });
    
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    
    console.log(`✅ User found: ${user.email} (${user.role})`);
    
    // Test 2: Check role authorization
    const requiredRoles = ['admin', 'store_owner'];
    if (!requiredRoles.includes(user.role)) {
      console.error(`❌ Role check failed: ${user.role} not in [${requiredRoles.join(', ')}]`);
      return;
    }
    
    console.log('✅ Role authorization passed');
    
    // Test 3: Build where clause like the endpoint does
    const where = {};
    if (user.role !== 'admin') {
      where.owner_email = user.email;
    }
    
    console.log('Query where clause:', where);
    
    // Test 4: Execute the exact query from the endpoint
    const { count, rows } = await Store.findAndCountAll({
      where,
      limit: 10,
      offset: 0,
      order: [['created_at', 'DESC']]
    });
    
    console.log(`✅ Query successful: ${count} stores found`);
    
    // Test 5: Check response format
    console.log('\n📤 Response that endpoint would return:');
    if (rows.length > 0) {
      console.log(`Array of ${rows.length} stores:`);
      rows.forEach((store, index) => {
        console.log(`${index + 1}. ${store.name} (${store.slug})`);
      });
      
      // Show first store structure
      console.log('\nFirst store structure:');
      console.log(JSON.stringify(rows[0], null, 2));
    } else {
      console.log('Empty array []');
    }
    
    // Test 6: Simulate potential issues
    console.log('\n🔍 Checking for potential issues...');
    
    // Check if stores have null or undefined critical fields
    rows.forEach((store, index) => {
      if (!store.name) console.log(`⚠️  Store ${index + 1} has no name`);
      if (!store.owner_email) console.log(`⚠️  Store ${index + 1} has no owner_email`);
      if (store.is_active === null || store.is_active === undefined) {
        console.log(`⚠️  Store ${index + 1} has no is_active value`);
      }
    });
    
    // Check serialization (like express would do)
    try {
      const serialized = JSON.stringify(rows);
      const parsed = JSON.parse(serialized);
      console.log('✅ JSON serialization/parsing works correctly');
      console.log(`Serialized size: ${serialized.length} characters`);
    } catch (serializeError) {
      console.error('❌ JSON serialization error:', serializeError.message);
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

testStoresEndpointLogic();