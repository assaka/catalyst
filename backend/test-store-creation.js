// Set environment to production to use PostgreSQL
process.env.DATABASE_URL = "postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";
process.env.NODE_ENV = "production";

const { sequelize } = require('./src/database/connection');
const { Store, User } = require('./src/models');

async function testStoreCreation() {
  try {
    console.log('🧪 Testing store creation...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // First verify the user exists
    const userEmail = 'playamin998@gmail.com';
    const user = await User.findOne({ where: { email: userEmail } });
    
    if (!user) {
      console.error('❌ User not found:', userEmail);
      return;
    }
    
    console.log('✅ User found:', { id: user.id, email: user.email });
    
    // Test store creation
    const storeData = {
      name: 'Test Store ' + Date.now(),
      slug: 'test-store-' + Date.now(),
      description: 'Test store created after fixing constraints',
      owner_email: userEmail
    };
    
    console.log('🏪 Creating store:', storeData);
    
    const store = await Store.create(storeData);
    console.log('✅ Store created successfully:', {
      id: store.id,
      name: store.name,
      slug: store.slug,
      owner_email: store.owner_email
    });
    
    // Verify the store exists
    const createdStore = await Store.findByPk(store.id);
    if (createdStore) {
      console.log('✅ Store verification successful');
    } else {
      console.error('❌ Store verification failed');
    }
    
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await sequelize.close();
  }
}

testStoreCreation();
