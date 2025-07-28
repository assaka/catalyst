// Check if OrderItems exist for a specific order
const https = require('https');

const orderId = '0eebc3bb-b141-415d-a2e7-ee74a8758b2d';

const postData = JSON.stringify({
  query: `SELECT COUNT(*) as count FROM order_items WHERE order_id = '${orderId}'`
});

const options = {
  hostname: 'catalyst-backend-fzhu.onrender.com',
  port: 443,
  path: '/api/debug/sql', // We need to create this endpoint
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

// Alternative: Let's check via the order items API
const checkOrderItems = async () => {
  console.log('🔍 Checking OrderItems for order:', orderId);
  
  // Check direct count
  const countOptions = {
    hostname: 'catalyst-backend-fzhu.onrender.com',
    port: 443,
    path: `/api/payments/debug/order-items/${orderId}`,
    method: 'GET'
  };
  
  const req = https.request(countOptions, (res) => {
    let data = '';
    
    console.log('Response status:', res.statusCode);
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ OrderItems check result:', JSON.stringify(result, null, 2));
      } catch (parseError) {
        console.log('Raw response:', data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Request failed:', error.message);
  });
  
  req.end();
};

checkOrderItems();