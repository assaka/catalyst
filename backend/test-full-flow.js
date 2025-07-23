// Set environment to production to use PostgreSQL
process.env.DATABASE_URL = "postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";
process.env.NODE_ENV = "production";
process.env.JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

const { sequelize } = require('./src/database/connection');
const jwt = require('jsonwebtoken');
const { User, Store } = require('./src/models');

async function testFullFlow() {
  try {
    console.log('🧪 Testing full authentication and stores flow...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Step 1: Find the user
    const userEmail = 'playamin998@gmail.com';
    const user = await User.findOne({ where: { email: userEmail } });
    
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    
    console.log(`✅ User found: ${user.email} (${user.role})`);
    
    // Step 2: Create a JWT token (simulate login)
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      }, 
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    
    console.log('✅ JWT token created');
    console.log(`Token: ${token.substring(0, 50)}...`);
    
    // Step 3: Verify token can be decoded
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      console.log('✅ Token verification successful');
      console.log(`Decoded payload:`, decoded);
    } catch (tokenError) {
      console.error('❌ Token verification failed:', tokenError.message);
      return;
    }
    
    // Step 4: Simulate auth middleware check
    console.log('\n🔒 Simulating auth middleware...');
    try {
      const authUser = await User.findByPk(user.id);
      if (authUser && authUser.is_active) {
        console.log('✅ Auth middleware would pass');
      } else {
        console.error('❌ Auth middleware would fail - user inactive or not found');
        return;
      }
    } catch (authError) {
      console.error('❌ Auth middleware error:', authError.message);
      return;
    }
    
    // Step 5: Check role authorization
    const requiredRoles = ['admin', 'store_owner'];
    if (requiredRoles.includes(user.role)) {
      console.log('✅ Role authorization would pass');
    } else {
      console.error(`❌ Role authorization would fail - user role '${user.role}' not in [${requiredRoles.join(', ')}]`);
      return;
    }
    
    // Step 6: Simulate stores endpoint logic
    console.log('\n🏪 Simulating stores endpoint...');
    
    const where = {};
    if (user.role !== 'admin') {
      where.owner_email = user.email;
    }
    
    console.log('Query where clause:', where);
    
    const { count, rows } = await Store.findAndCountAll({
      where,
      limit: 10,
      offset: 0,
      order: [['created_at', 'DESC']]
    });
    
    console.log(`✅ Stores query successful: found ${count} stores`);
    
    if (rows.length > 0) {
      console.log('Stores data:');
      rows.forEach((store, index) => {
        console.log(`${index + 1}. ${store.name} (${store.slug}) - Owner: ${store.owner_email}`);
      });
      
      // Test the exact response format
      console.log('\n📤 API Response format:');
      console.log(JSON.stringify(rows, null, 2));
    } else {
      console.log('⚠️  No stores found for this user');
    }
    
    console.log('\n🎉 Full flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

testFullFlow();