// Test the order fetch with comprehensive logging
const https = require('https');

const sessionId = 'cs_test_b1MOk0fey1zHYTM4yUbjcHo1sLDNaRbJ0ZRwBsQ3zTMyeOqP5X68iFn2Gp';

const options = {
  hostname: 'catalyst-backend-fzhu.onrender.com',
  port: 443,
  path: `/api/orders/by-payment-reference/${sessionId}`,
  method: 'GET',
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
};

console.log('🔍 Testing order fetch with logging for session:', sessionId);
console.log('🕐 Request time:', new Date().toISOString());

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('Response status:', res.statusCode);
  console.log('Response headers:', res.headers);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ Order fetch result:');
      console.log('Order ID:', result.data?.id);
      console.log('OrderItems length:', result.data?.OrderItems?.length);
      console.log('Debug info:', result.debug);
      
      if (result.data?.OrderItems?.length > 0) {
        console.log('🎉 SUCCESS! OrderItems are included!');
        console.log('First OrderItem:', JSON.stringify(result.data.OrderItems[0], null, 2));
      } else {
        console.log('❌ OrderItems still empty or undefined');
      }
    } catch (parseError) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error.message);
});

req.end();