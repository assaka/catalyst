// Test the actual API response structure
const https = require('https');

const sessionId = 'cs_test_b1MOk0fey1zHYTM4yUbjcHo1sLDNaRbJ0ZRwBsQ3zTMyeOqP5X68iFn2Gp';

const options = {
  hostname: 'catalyst-backend-fzhu.onrender.com',
  port: 443,
  path: `/api/orders/by-payment-reference/${sessionId}`,
  method: 'GET'
};

console.log('🔍 Testing API response structure for session:', sessionId);

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('Response status:', res.statusCode);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('\n📋 FULL API RESPONSE:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.data) {
        console.log('\n🔍 ORDER DATA KEYS:', Object.keys(result.data));
        console.log('📊 OrderItems exists:', !!result.data.OrderItems);
        console.log('📊 OrderItems type:', typeof result.data.OrderItems);
        console.log('📊 OrderItems length:', result.data.OrderItems?.length);
        console.log('📊 OrderItems content:', result.data.OrderItems);
      }
    } catch (parseError) {
      console.log('❌ Parse error:', parseError.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error.message);
});

req.end();