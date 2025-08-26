/**
 * Debug Current Token in Browser
 * Run this in your browser console to check what token is currently stored
 */

console.log('🔍 Current Token Analysis');
console.log('=========================');

const debugCurrentToken = () => {
  console.log('\n📋 Checking localStorage tokens...');
  
  // Check all possible token storage locations
  const authToken = localStorage.getItem('auth_token');
  const token = localStorage.getItem('token');
  const jwtToken = localStorage.getItem('jwt_token');
  const accessToken = localStorage.getItem('access_token');
  
  console.log('   auth_token:', authToken ? 'EXISTS' : 'NOT FOUND');
  console.log('   token:', token ? 'EXISTS' : 'NOT FOUND');
  console.log('   jwt_token:', jwtToken ? 'EXISTS' : 'NOT FOUND');
  console.log('   access_token:', accessToken ? 'EXISTS' : 'NOT FOUND');
  
  // Use the first available token
  const currentToken = authToken || token || jwtToken || accessToken;
  
  if (!currentToken) {
    console.log('❌ NO TOKEN FOUND IN LOCALSTORAGE!');
    console.log('💡 This means you need to log in again');
    return;
  }
  
  console.log('\n🔍 Analyzing current token...');
  
  try {
    // Decode the JWT without verification
    const parts = currentToken.split('.');
    if (parts.length !== 3) {
      console.log('❌ Invalid JWT format');
      return;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    
    console.log('📋 Token Details:');
    console.log('   User ID:', payload.id);
    console.log('   Email:', payload.email);
    console.log('   Role:', payload.role);
    console.log('   Session ID:', payload.session_id);
    
    console.log('\n⏰ Timing Analysis:');
    const now = Math.floor(Date.now() / 1000);
    const iat = payload.iat;
    const exp = payload.exp;
    
    console.log('   Current Unix Time:', now, '→', new Date(now * 1000).toLocaleString());
    console.log('   Token Issued (iat):', iat, '→', new Date(iat * 1000).toLocaleString());
    console.log('   Token Expires (exp):', exp, '→', new Date(exp * 1000).toLocaleString());
    
    const ageInMinutes = Math.floor((now - iat) / 60);
    const validForMinutes = Math.floor((exp - now) / 60);
    
    console.log('   Token Age:', ageInMinutes, 'minutes');
    console.log('   Valid For:', validForMinutes, 'minutes');
    console.log('   Is Expired?:', exp < now);
    
    if (exp < now) {
      console.log('\n🚨 TOKEN IS EXPIRED!');
      console.log('   Expired', Math.floor((now - exp) / 60), 'minutes ago');
      console.log('   This explains the 401 errors');
    } else {
      console.log('\n✅ TOKEN IS VALID');
      console.log('   Will expire in', validForMinutes, 'minutes');
    }
    
    // Check when this token was supposedly created
    const tokenDate = new Date(iat * 1000);
    const today = new Date();
    const daysDiff = Math.floor((today - tokenDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 7) {
      console.log('\n⚠️ OLD TOKEN DETECTED!');
      console.log('   This token is', daysDiff, 'days old');
      console.log('   You may need to clear localStorage and login fresh');
    }
    
  } catch (error) {
    console.log('❌ Error decoding token:', error.message);
    console.log('   Token might be corrupted');
  }
};

const forceTokenRefresh = () => {
  console.log('\n🔄 FORCE TOKEN REFRESH:');
  console.log('1. Clear all tokens from localStorage');
  console.log('2. Go to login page and login again');
  console.log('3. Check if new token has current dates');
  
  console.log('\nTo clear tokens now, run:');
  console.log('   clearAllTokens()');
};

const clearAllTokens = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token');
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('access_token');
  console.log('🧹 All tokens cleared from localStorage');
  console.log('Now please login again');
};

// Auto-run analysis
debugCurrentToken();
forceTokenRefresh();

// Make functions available globally
window.debugCurrentToken = debugCurrentToken;
window.clearAllTokens = clearAllTokens;

console.log('\n🚀 Token analysis complete!');
console.log('💡 If token is expired/old, run: clearAllTokens()');