const { CustomerActivity } = require('./backend/src/database/models');
const { sequelize } = require('./backend/src/database/connection.js');

// Test script to verify customer activity tracking
async function testTracking() {
  try {
    console.log('🧪 Testing customer activity tracking...');
    
    // Create a test activity record
    const testData = {
      session_id: 'test_session_123',
      store_id: '157d4590-49bf-4b0b-bd77-abe131909528', // Use your store ID
      activity_type: 'test_tracking',
      page_url: 'http://localhost:3000/test',
      referrer: '',
      user_agent: 'Test Script',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('📝 Creating test activity record...');
    const activity = await CustomerActivity.create(testData);
    console.log('✅ Test activity created:', activity.id);
    
    // Verify it was created
    const count = await CustomerActivity.count();
    console.log('📊 Total customer activities in database:', count);
    
    // Clean up test record
    await CustomerActivity.destroy({ where: { id: activity.id } });
    console.log('🧹 Test record cleaned up');
    
    console.log('✅ Customer activity tracking is working!');
    
  } catch (error) {
    console.error('❌ Customer activity tracking test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testTracking();