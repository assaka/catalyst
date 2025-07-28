// Test database diagnostic endpoint
const https = require('https');

const sessionId = 'cs_test_b1MOk0fey1zHYTM4yUbjcHo1sLDNaRbJ0ZRwBsQ3zTMyeOqP5X68iFn2Gp';

console.log('🔍 Testing database diagnostic for session:', sessionId);

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
        console.log('OrderItems count:', result.order_items_count);
        
        if (result.order_items_count === 0) {
          console.log('❌ NO ORDERITEMS FOUND IN DATABASE');
          console.log('This explains why Sequelize returns empty array');
          console.log('Issue: OrderItems were never created during checkout');
        } else {
          console.log('✅ OrderItems exist in database but Sequelize not returning them');
          console.log('Issue: Sequelize association problem');
        }
      } else {
        console.log('❌ Order not found in database');
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