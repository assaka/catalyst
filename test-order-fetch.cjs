// Test fetching the specific order to see if OrderItems are included
const https = require('https');

const sessionId = 'cs_test_b1fZ2fBwEvmDQAIl0WUNrf39xpLZNtbGDzWqTNXx5oysBChFKNoE8NNUNw';

const options = {
  hostname: 'catalyst-backend-fzhu.onrender.com',
  port: 443,
  path: `/api/orders/by-payment-reference/${sessionId}`,
  method: 'GET'
};

console.log('🔍 Testing order fetch for session:', sessionId);

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
      console.log('OrderItems:', JSON.stringify(result.data?.OrderItems, null, 2));
    } catch (parseError) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error.message);
});

req.end();