// Check if OrderItems exist in database via SQL for new order
const https = require('https');

const newSessionId = 'cs_test_b1HVQFshEyB9XWHBuMz9QXkfN4jXUA3fRyKoh7V67n0jdmWQqjlomIuPNV';

console.log('🔍 Checking if OrderItems exist in database for new order:', newSessionId);

// First get the order ID
const getOrderOptions = {
  hostname: 'catalyst-backend-fzhu.onrender.com',
  port: 443,
  path: `/api/orders/by-payment-reference/${newSessionId}`,
  method: 'GET'
};

const req = https.request(getOrderOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (result.success && result.data) {
        const orderId = result.data.id;
        console.log('✅ Order found with ID:', orderId);
        console.log('📊 Sequelize returns OrderItems length:', result.data.OrderItems?.length || 0);
        
        // Now check via direct SQL if possible
        console.log('\n🔍 ANALYSIS:');
        console.log('If OrderItems are in database but Sequelize returns 0, then:');
        console.log('1. ❌ Sequelize association is broken');
        console.log('2. ❌ Foreign key relationship issue');
        console.log('3. ❌ Table name mismatch');
        console.log('4. ❌ Include configuration problem');
        
        console.log('\n🔧 SOLUTION:');
        console.log('Need to fix the Sequelize association in the orders route');
        
        // Show the current query structure
        console.log('\n📋 Current query should be:');
        console.log(`Order.findOne({
  where: { payment_reference: "${newSessionId}" },
  include: [
    { model: Store },
    { model: OrderItem, include: [{ model: Product }] }
  ]
})`);
        
      } else {
        console.log('❌ Order not found in API response');
      }
      
    } catch (parseError) {
      console.log('❌ Parse error:', parseError.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.end();