// Test associations
const https = require('https');

const orderId = 'd6588d24-3d47-4f60-b82b-14f95d5c921f';

const options = {
  hostname: 'catalyst-backend-fzhu.onrender.com',
  port: 443,
  path: `/api/orders/test-associations/${orderId}`,
  method: 'GET'
};

console.log('🔍 Testing associations for order:', orderId);

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('Response status:', res.statusCode);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ Association test results:', JSON.stringify(result, null, 2));
    } catch (parseError) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error.message);
});

req.end();