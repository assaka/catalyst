// Check OrderItems for the latest order
const https = require('https');

const orderId = 'd6588d24-3d47-4f60-b82b-14f95d5c921f';

const options = {
  hostname: 'catalyst-backend-fzhu.onrender.com',
  port: 443,
  path: `/api/payments/debug/order-items/${orderId}`,
  method: 'GET'
};

console.log('🔍 Checking OrderItems for new order:', orderId);

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('Response status:', res.statusCode);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ OrderItems check result:', JSON.stringify(result, null, 2));
      
      if (result.order_items_count === 0) {
        console.log('\n❌ CRITICAL: No OrderItems were created by the webhook!');
        console.log('This means the webhook failed to create OrderItems during processing.');
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