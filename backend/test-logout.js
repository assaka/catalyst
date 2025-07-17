#!/usr/bin/env node

const { User } = require('./src/models');
const { sequelize } = require('./src/database/connection');

async function testLogout() {
  try {
    console.log('🔄 Testing logout functionality...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // First, create a test user if not exists
    const testEmail = 'test@example.com';
    let user = await User.findOne({ where: { email: testEmail } });
    
    if (!user) {
      user = await User.create({
        email: testEmail,
        password: 'TestPassword123!',
        first_name: 'Test',
        last_name: 'User',
        role: 'customer'
      });
      console.log('✅ Test user created:', user.email);
    } else {
      console.log('✅ Test user found:', user.email);
    }
    
    // Test logout API endpoint simulation
    const jwt = require('jsonwebtoken');
    const { LoginAttempt } = require('./src/models');
    
    // Create a test token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    console.log('✅ Test token generated');
    
    // Simulate logout event logging
    const logoutEvent = await LoginAttempt.create({
      email: user.email,
      ip_address: '127.0.0.1',
      user_agent: 'Test User Agent',
      action: 'logout',
      success: true,
      attempted_at: new Date()
    });
    
    console.log('✅ Logout event logged successfully');
    console.log('Event ID:', logoutEvent.id);
    console.log('Action:', logoutEvent.action);
    console.log('Success:', logoutEvent.success);
    
    // Verify the event was logged
    const recentLogouts = await LoginAttempt.findAll({
      where: { 
        email: user.email,
        action: 'logout'
      },
      order: [['attempted_at', 'DESC']],
      limit: 5
    });
    
    console.log(`\n📋 Recent logout events for ${user.email}:`);
    recentLogouts.forEach((event, index) => {
      console.log(`${index + 1}. ${event.attempted_at} - ${event.action} - Success: ${event.success}`);
    });
    
    // Clean up test data
    await logoutEvent.destroy();
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

testLogout();