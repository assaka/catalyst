// Set environment to production to use PostgreSQL
process.env.DATABASE_URL = "postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";
process.env.NODE_ENV = "production";

const { sequelize } = require('./src/database/connection');
const { Store, User } = require('./src/models');

async function testStoresAPI() {
  try {
    console.log('🧪 Testing stores API functionality...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Test 1: Get all stores in database
    console.log('\n📋 All stores in database:');
    const allStores = await Store.findAll({
      order: [['created_at', 'DESC']]
    });
    
    console.log(`Total stores: ${allStores.length}`);
    allStores.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name} (${store.slug}) - Owner: ${store.owner_email}`);
    });
    
    // Test 2: Get stores for specific user (simulate API call)
    const userEmail = 'playamin998@gmail.com';
    console.log(`\n🔍 Stores for user: ${userEmail}`);
    
    const userStores = await Store.findAll({
      where: { owner_email: userEmail },
      order: [['created_at', 'DESC']]
    });
    
    console.log(`User stores: ${userStores.length}`);
    userStores.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name} (${store.slug}) - Created: ${store.created_at}`);
    });
    
    // Test 3: Simulate what the API endpoint returns
    console.log('\n📤 Simulated API response:');
    const apiResponse = userStores.map(store => ({
      id: store.id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      owner_email: store.owner_email,
      created_at: store.created_at,
      is_active: store.is_active
    }));
    
    console.log('API would return:', JSON.stringify(apiResponse, null, 2));
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await sequelize.close();
  }
}

testStoresAPI();