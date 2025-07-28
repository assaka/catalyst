// Test database diagnostic for the new order
const https = require('https');

const sessionId = 'cs_test_b1HVQFshEyB9XWHBuMz9QXkfN4jXUA3fRyKoh7V67n0jdmWQqjlomIuPNV';

console.log('🔍 Testing database diagnostic for NEW order:', sessionId);

const options = {
  hostname: 'catalyst-backend-fzhu.onrender.com',
  port: 443,
  path: `/api/orders/db-diagnostic/${sessionId}`,
  method: 'GET'
};

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('📊 Response Status:', res.statusCode);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('\n📋 DATABASE DIAGNOSTIC RESULTS:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.order_found) {
        console.log('\n✅ Order exists in database');
        console.log('📊 Order ID:', result.order_data?.id);
        console.log('📊 Store ID:', result.order_data?.store_id);
        console.log('📊 Total Amount:', result.order_data?.total_amount);
        console.log('📊 OrderItems count:', result.order_items_count);
        
        if (result.order_items_count === 0) {
          console.log('\n❌ CRITICAL: NO ORDERITEMS IN DATABASE');
          console.log('🔧 Root cause: Webhook is not creating OrderItems');
          console.log('🔧 Check: Stripe webhook is receiving cart data correctly');
        } else {
          console.log('\n✅ OrderItems exist - Sequelize association issue');
          console.log('🔧 First OrderItem:', result.order_items[0]);
        }
      } else {
        console.log('\n❌ Order not found in database');
      }
      
    } catch (parseError) {
      console.log('❌ Parse error:', parseError.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.end();