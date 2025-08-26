/**
 * Debug Token Generation System
 * Run this to test if token generation is working correctly
 */

console.log('🔍 Token Generation Debug');
console.log('========================');

const debugTokenGeneration = () => {
  console.log('\n📅 System Time Analysis:');
  
  const now = new Date();
  const nowUtc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
  const nowUnix = Math.floor(now.getTime() / 1000);
  
  console.log('   Local Time:', now.toLocaleString());
  console.log('   UTC Time:', nowUtc.toLocaleString());
  console.log('   Unix Timestamp:', nowUnix);
  console.log('   Timezone Offset:', now.getTimezoneOffset(), 'minutes');
  
  // Test JWT expiration calculation
  console.log('\n🧪 JWT Expiration Test:');
  
  // Simulate 24h expiration
  const expiresIn24h = nowUnix + (24 * 60 * 60); // 24 hours in seconds
  const expires30d = nowUnix + (30 * 24 * 60 * 60); // 30 days in seconds
  
  console.log('   Current Unix Time:', nowUnix);
  console.log('   24h expiry should be:', expiresIn24h);
  console.log('   30d expiry should be:', expires30d);
  console.log('   24h expiry as date:', new Date(expiresIn24h * 1000).toLocaleString());
  console.log('   30d expiry as date:', new Date(expires30d * 1000).toLocaleString());
  
  // Check if there's a date parsing issue
  console.log('\n🔍 Your Token Analysis:');
  console.log('   Your token expires: 30-7-2025 (this appears to be PAST date?)');
  
  // Check if 30-7-2025 is actually in the past
  const suspectedDate = new Date('2025-07-30'); // ISO format
  const altDate1 = new Date('30-7-2025'); // Non-standard format
  const altDate2 = new Date('2025-07-30T16:53:14'); // With time
  
  console.log('   Parse "2025-07-30":', suspectedDate.toLocaleString());
  console.log('   Parse "30-7-2025":', altDate1.toLocaleString()); // This might be invalid
  console.log('   Parse "2025-07-30T16:53:14":', altDate2.toLocaleString());
  console.log('   Is 2025-07-30 in future?:', suspectedDate > now);
  
  if (suspectedDate > now) {
    console.log('   ✅ 2025-07-30 IS in the future - token should be valid');
    console.log('   🚨 ISSUE: System incorrectly reporting token as expired!');
  } else {
    console.log('   ❌ 2025-07-30 IS in the past - token is actually expired');
    console.log('   🚨 ISSUE: Token generation created past date!');
  }
};

const testTokenDecoding = () => {
  console.log('\n🧪 Token Decoding Test:');
  
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  if (!token) {
    console.log('   ❌ No token found in localStorage');
    return;
  }
  
  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    
    console.log('   📋 Token Payload Analysis:');
    console.log('   IAT (issued at):', payload.iat, '→', new Date(payload.iat * 1000).toLocaleString());
    console.log('   EXP (expires at):', payload.exp, '→', new Date(payload.exp * 1000).toLocaleString());
    
    const now = Math.floor(Date.now() / 1000);
    const validFor = payload.exp - now;
    const validForMinutes = Math.floor(validFor / 60);
    
    console.log('   Current Unix:', now);
    console.log('   Valid for:', validFor, 'seconds (', validForMinutes, 'minutes )');
    console.log('   Is expired?:', payload.exp < now);
    
    // Calculate what the expiration SHOULD be for 24h
    const issuedAt = payload.iat;
    const shouldExpireAt = issuedAt + (24 * 60 * 60); // 24 hours
    const actualExp = payload.exp;
    
    console.log('\n🔍 Expiration Logic Check:');
    console.log('   Token issued at:', issuedAt, '→', new Date(issuedAt * 1000).toLocaleString());
    console.log('   Should expire at (24h):', shouldExpireAt, '→', new Date(shouldExpireAt * 1000).toLocaleString());
    console.log('   Actually expires at:', actualExp, '→', new Date(actualExp * 1000).toLocaleString());
    console.log('   Difference:', actualExp - shouldExpireAt, 'seconds');
    
    if (Math.abs(actualExp - shouldExpireAt) > 3600) { // More than 1 hour difference
      console.log('   🚨 ISSUE: Actual expiration differs significantly from expected 24h!');
      console.log('   This suggests a bug in token generation logic');
    } else {
      console.log('   ✅ Expiration looks correct for 24h token');
    }
    
  } catch (error) {
    console.log('   ❌ Error decoding token:', error.message);
  }
};

const suggestFix = () => {
  console.log('\n💡 DIAGNOSIS & FIX:');
  console.log('Based on your error showing "30-7-2025" as expired:');
  console.log('');
  console.log('LIKELY ISSUES:');
  console.log('1. System time/timezone mismatch between frontend and backend');
  console.log('2. JWT library using wrong timezone for expiration calculation');
  console.log('3. Server running in different timezone than expected');
  console.log('4. Date parsing error in JWT creation');
  console.log('');
  console.log('IMMEDIATE ACTIONS:');
  console.log('1. Check server timezone: date command on server');
  console.log('2. Check JWT_SECRET environment variable consistency');
  console.log('3. Verify backend server system time is correct');
  console.log('4. Test fresh login with detailed logging');
};

// Auto-run all diagnostics
debugTokenGeneration();
testTokenDecoding();
suggestFix();

// Make functions globally available
window.debugTokenGeneration = debugTokenGeneration;
window.testTokenDecoding = testTokenDecoding;

console.log('\n🚀 Diagnosis complete! Check the analysis above.');