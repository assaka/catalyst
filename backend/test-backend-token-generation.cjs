/**
 * Backend Token Generation Test
 * Tests the actual token generation logic used by the login system
 */

const jwt = require('jsonwebtoken');

console.log('🔍 Backend Token Generation Test');
console.log('=================================');

const testTokenGeneration = () => {
  console.log('\n📅 Backend System Time:');
  
  const now = new Date();
  const nowUnix = Math.floor(now.getTime() / 1000);
  
  console.log('   Server Local Time:', now.toLocaleString());
  console.log('   Server Unix Time:', nowUnix);
  console.log('   Server Timezone Offset:', now.getTimezoneOffset(), 'minutes');
  console.log('   Process TZ:', process.env.TZ || 'not set');
  
  console.log('\n🧪 Testing JWT Generation:');
  
  // Test the exact same logic as in auth.js
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'store_owner',
    account_type: 'agency'
  };
  
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-testing';
  console.log('   JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('   JWT_SECRET length:', jwtSecret.length);
  
  // Test different expiration formats
  const expirations = ['24h', '30d', '1h'];
  
  expirations.forEach(expiration => {
    try {
      console.log(`\n   🧪 Testing ${expiration} expiration:`);
      
      const token = jwt.sign(
        { 
          id: mockUser.id, 
          email: mockUser.email, 
          role: mockUser.role, 
          account_type: mockUser.account_type,
          session_id: 'test_session_' + Date.now(),
          session_role: mockUser.role,
          issued_at: Date.now()
        },
        jwtSecret,
        { expiresIn: expiration }
      );
      
      console.log('     ✅ Token generated successfully');
      
      // Decode the token to check expiration
      const decoded = jwt.decode(token);
      const issuedAt = decoded.iat;
      const expiresAt = decoded.exp;
      
      console.log('     IAT:', issuedAt, '→', new Date(issuedAt * 1000).toLocaleString());
      console.log('     EXP:', expiresAt, '→', new Date(expiresAt * 1000).toLocaleString());
      console.log('     Valid for:', Math.floor((expiresAt - nowUnix) / 60), 'minutes');
      console.log('     Is expired?:', expiresAt < nowUnix);
      
      // Verify the token can be verified
      try {
        const verified = jwt.verify(token, jwtSecret);
        console.log('     ✅ Token verification successful');
      } catch (verifyError) {
        console.log('     ❌ Token verification failed:', verifyError.message);
        if (verifyError.name === 'TokenExpiredError') {
          console.log('     🚨 ISSUE: Newly generated token is already expired!');
        }
      }
      
    } catch (error) {
      console.log(`     ❌ Error generating ${expiration} token:`, error.message);
    }
  });
};

const testActualAuthLogic = () => {
  console.log('\n🔍 Testing Actual Auth Logic:');
  
  // Simulate the exact generateToken function from auth.js
  const generateToken = (user, rememberMe = false) => {
    const expiresIn = rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '24h');
    const sessionId = Math.random().toString(36).substring(2, 15) + Date.now();
    
    console.log('   Using expiresIn:', expiresIn);
    console.log('   JWT_EXPIRES_IN env:', process.env.JWT_EXPIRES_IN || 'not set');
    
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        account_type: user.account_type,
        session_id: sessionId,
        session_role: user.role,
        issued_at: Date.now()
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn }
    );
  };
  
  const mockUser = {
    id: 'test-user-123',
    email: 'testuser@example.com',
    role: 'store_owner',
    account_type: 'agency'
  };
  
  console.log('\n   🧪 Normal login (24h):');
  try {
    const normalToken = generateToken(mockUser, false);
    const decoded = jwt.decode(normalToken);
    console.log('     Generated successfully');
    console.log('     Expires:', new Date(decoded.exp * 1000).toLocaleString());
    console.log('     Valid for:', Math.floor((decoded.exp - Math.floor(Date.now() / 1000)) / 60), 'minutes');
  } catch (error) {
    console.log('     ❌ Error:', error.message);
  }
  
  console.log('\n   🧪 Remember me (30d):');
  try {
    const rememberToken = generateToken(mockUser, true);
    const decoded = jwt.decode(rememberToken);
    console.log('     Generated successfully');
    console.log('     Expires:', new Date(decoded.exp * 1000).toLocaleString());
    console.log('     Valid for:', Math.floor((decoded.exp - Math.floor(Date.now() / 1000)) / (60 * 24)), 'days');
  } catch (error) {
    console.log('     ❌ Error:', error.message);
  }
};

const checkEnvironment = () => {
  console.log('\n🔧 Environment Check:');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('   JWT_SECRET set:', !!process.env.JWT_SECRET);
  console.log('   JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || 'not set (defaults to 24h)');
  console.log('   TZ (timezone):', process.env.TZ || 'not set (uses system default)');
  console.log('   System timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
};

const diagnoseIssue = () => {
  console.log('\n🚨 DIAGNOSIS:');
  console.log('If tokens are being generated as expired, possible causes:');
  console.log('1. System clock is wrong (server time vs real time)');
  console.log('2. Timezone mismatch between server and JWT library');
  console.log('3. JWT_SECRET mismatch between login and auth middleware');
  console.log('4. Environment variable issues');
  console.log('5. JWT library version incompatibility');
  console.log('');
  console.log('💡 NEXT STEPS:');
  console.log('1. Check if this script shows same expired token issue');
  console.log('2. Compare server time with your local time');
  console.log('3. Test with a fresh JWT_SECRET');
  console.log('4. Check if production server has different timezone');
};

// Run all tests
checkEnvironment();
testTokenGeneration();
testActualAuthLogic();
diagnoseIssue();

console.log('\n✅ Backend token generation test completed!');