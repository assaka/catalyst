const jwt = require('jsonwebtoken');
const { User } = require('./src/models');

console.log('🔍 Authentication Token Debugging...');

async function debugAuthToken() {
  console.log('\n1. Checking JWT_SECRET...');
  let jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.log('⚠️ JWT_SECRET not set in environment, using default for testing');
    jwtSecret = 'catalyst-dev-jwt-secret-key-change-in-production';
  }
  console.log('✅ JWT_SECRET is available');

  console.log('\n2. Looking for existing store owners...');
  try {
    const users = await User.findAll({
      where: { role: 'store_owner' },
      limit: 5
    });

    if (users.length === 0) {
      console.log('❌ No store owners found in database');
      return;
    }

    console.log(`✅ Found ${users.length} store owner(s):`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id}) - Active: ${user.is_active}`);
    });

    // Use the first active store owner
    const activeUser = users.find(u => u.is_active) || users[0];
    console.log(`\n3. Using store owner: ${activeUser.email}`);

    // Generate a valid JWT token
    const tokenPayload = {
      id: activeUser.id,
      email: activeUser.email,
      role: activeUser.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    const token = jwt.sign(tokenPayload, jwtSecret);
    console.log('\n4. Generated valid JWT token:');
    console.log('📋 Token (first 50 chars):', token.substring(0, 50) + '...');
    console.log('📋 Full token:', token);

    // Verify the token works
    console.log('\n5. Verifying token...');
    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log('✅ Token verification successful:');
      console.log('   User ID:', decoded.id);
      console.log('   Email:', decoded.email);
      console.log('   Role:', decoded.role);
      console.log('   Expires:', new Date(decoded.exp * 1000).toISOString());
    } catch (verifyError) {
      console.log('❌ Token verification failed:', verifyError.message);
    }

    console.log('\n6. Testing with AI Context API...');
    await testTokenWithAPI(token);

  } catch (error) {
    console.log('❌ Database error:', error.message);
  }
}

async function testTokenWithAPI(token) {
  const https = require('https');

  const requestData = JSON.stringify({
    prompt: "Add a new function called testFunction",
    sourceCode: "const example = () => { return 'hello'; };",
    filePath: 'test.js',
    context: { timestamp: new Date().toISOString() }
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'catalyst-backend-fzhu.onrender.com',
      port: 443,
      path: '/api/ai-context/nl-to-patch',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData),
        'Authorization': `Bearer ${token}`
      }
    };

    console.log('   Making authenticated request to production API...');

    const req = https.request(options, (res) => {
      let responseData = '';
      
      console.log(`   Response status: ${res.statusCode}`);

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.success) {
            console.log('   ✅ API request successful with valid token!');
            console.log('   📋 Patch operations:', parsed.data?.patch?.length || 0);
            console.log('   📋 Confidence:', parsed.data?.confidence);
          } else {
            console.log('   ❌ API request failed:', parsed.message);
          }
        } catch (parseError) {
          console.log('   ❌ Response parsing error:', parseError.message);
          console.log('   Raw response (first 200 chars):', responseData.substring(0, 200));
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('   ❌ Request error:', error.message);
      resolve();
    });

    req.setTimeout(10000);
    req.write(requestData);
    req.end();
  });
}

// Set up environment
process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = 'postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres';

debugAuthToken().catch(error => {
  console.error('❌ Debug failed:', error.message);
  console.error('📍 Stack:', error.stack);
});