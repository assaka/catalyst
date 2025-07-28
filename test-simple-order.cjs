// Test the simplified order fetch
const https = require('https');

const sessionId = 'cs_test_b1MOk0fey1zHYTM4yUbjcHo1sLDNaRbJ0ZRwBsQ3zTMyeOqP5X68iFn2Gp';

const options = {
  hostname: 'catalyst-backend-fzhu.onrender.com',
  port: 443,
  path: `/api/orders/by-payment-reference/${sessionId}`,
  method: 'GET'
};

console.log('🔍 Testing simplified order fetch for session:', sessionId);

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('Response status:', res.statusCode);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ Order fetch result:');
      console.log('Order ID:', result.data?.id);
      console.log('OrderItems length:', result.data?.OrderItems?.length);
      
      if (result.data?.OrderItems?.length > 0) {
        console.log('🎉 SUCCESS! OrderItems are now included!');
        console.log('First OrderItem:', JSON.stringify(result.data.OrderItems[0], null, 2));
      } else {
        console.log('❌ OrderItems still empty or undefined');
        console.log('Full order keys:', Object.keys(result.data || {}));
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