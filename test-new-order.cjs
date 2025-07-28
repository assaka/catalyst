// Test new order - need session ID from user
const https = require('https');

// You'll need to provide the new session ID here
const newSessionId = process.argv[2];

if (!newSessionId) {
  console.log('❌ Please provide the new session ID as an argument:');
  console.log('node test-new-order.cjs cs_test_YOUR_NEW_SESSION_ID');
  process.exit(1);
}

console.log('🔍 Testing NEW order with session ID:', newSessionId);

const options = {
  hostname: 'catalyst-backend-fzhu.onrender.com',
  port: 443,
  path: `/api/orders/by-payment-reference/${newSessionId}`,
  method: 'GET',
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('📊 Response Status:', res.statusCode);
  console.log('📊 Response ETag:', res.headers.etag);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      console.log('\n🔍 NEW ORDER ANALYSIS:');
      console.log('Success:', result.success);
      
      if (result.data) {
        const order = result.data;
        console.log('Order ID:', order.id);
        console.log('Order Number:', order.order_number);
        console.log('Created At:', order.createdAt);
        console.log('Total Amount:', order.total_amount);
        
        console.log('\n📦 ORDERITEMS ANALYSIS:');
        console.log('OrderItems exists:', !!order.OrderItems);
        console.log('OrderItems length:', order.OrderItems?.length);
        console.log('OrderItems content:', order.OrderItems);
        
        console.log('\n🏪 STORE ANALYSIS:');
        console.log('Store exists:', !!order.Store);
        console.log('Store content:', order.Store);
        
        if (order.OrderItems && order.OrderItems.length > 0) {
          console.log('\n🎉 SUCCESS! OrderItems are now working!');
          console.log('First OrderItem:', JSON.stringify(order.OrderItems[0], null, 2));
        } else {
          console.log('\n❌ OrderItems still empty in new order');
          console.log('This suggests a deeper database association issue');
        }
      }
      
    } catch (parseError) {
      console.log('❌ Parse error:', parseError.message);
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.end();