// Debug the specific order to understand why OrderItems are empty
const https = require('https');

const sessionId = 'cs_test_b1MOk0fey1zHYTM4yUbjcHo1sLDNaRbJ0ZRwBsQ3zTMyeOqP5X68iFn2Gp';

console.log('🔍 Debugging specific order with comprehensive logging...');
console.log('Session ID:', sessionId);

const options = {
  hostname: 'catalyst-backend-fzhu.onrender.com',
  port: 443,
  path: `/api/orders/by-payment-reference/${sessionId}`,
  method: 'GET',
  headers: {
    'Cache-Control': 'no-cache',
    'User-Agent': 'OrderItems-Debug/1.0'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('📊 Response Status:', res.statusCode);
  console.log('📊 Response Headers:', res.headers);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      console.log('\n🔍 DETAILED ANALYSIS:');
      console.log('Success:', result.success);
      
      if (result.data) {
        const order = result.data;
        console.log('Order ID:', order.id);
        console.log('Order Number:', order.order_number);
        console.log('Customer Email:', order.customer_email);
        console.log('Total Amount:', order.total_amount);
        console.log('Store ID:', order.store_id);
        console.log('Created At:', order.createdAt);
        
        console.log('\n📦 ORDERITEMS ANALYSIS:');
        console.log('OrderItems exists:', !!order.OrderItems);
        console.log('OrderItems type:', typeof order.OrderItems);
        console.log('OrderItems length:', order.OrderItems?.length);
        console.log('OrderItems is array:', Array.isArray(order.OrderItems));
        console.log('OrderItems content:', order.OrderItems);
        
        console.log('\n🏪 STORE ANALYSIS:');
        console.log('Store exists:', !!order.Store);
        console.log('Store content:', order.Store);
        
        // Check if this order should have items based on the total
        if (parseFloat(order.total_amount) > 0 && (!order.OrderItems || order.OrderItems.length === 0)) {
          console.log('\n⚠️  ISSUE DETECTED:');
          console.log('Order has a total amount but no OrderItems!');
          console.log('This suggests OrderItems exist in DB but are not being fetched.');
        }
        
        // Look for any alternative item fields
        console.log('\n🔍 CHECKING FOR ALTERNATIVE ITEM FIELDS:');
        const orderKeys = Object.keys(order);
        const itemRelatedKeys = orderKeys.filter(key => 
          key.toLowerCase().includes('item') || 
          key.toLowerCase().includes('product') ||
          key.toLowerCase().includes('line')
        );
        console.log('Item-related keys found:', itemRelatedKeys);
        
        itemRelatedKeys.forEach(key => {
          console.log(`${key}:`, order[key]);
        });
      }
      
    } catch (parseError) {
      console.log('❌ Parse error:', parseError.message);
      console.log('Raw response data:', data.substring(0, 500) + '...');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.end();