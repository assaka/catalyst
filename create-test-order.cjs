// Create a new test order via webhook to test fresh OrderItems
const https = require('https');

const testWebhookData = {
  id: 'cs_test_neworder123',
  object: 'checkout.session',
  amount_total: 2500,
  currency: 'usd',
  customer_details: {
    email: 'test@example.com',
    name: 'Test Customer'
  },
  metadata: {
    store_id: 'a6b4d8c2-4f8e-4b2a-8c9d-1e3f5a7b9c2d',
    items: JSON.stringify([
      {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        product_name: 'Test Product',
        quantity: 2,
        price: 12.50,
        total: 25.00
      }
    ])
  },
  payment_status: 'paid',
  status: 'complete'
};

const postData = JSON.stringify(testWebhookData);

const options = {
  hostname: 'catalyst-backend-fzhu.onrender.com',
  port: 443,
  path: '/api/payments/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'stripe-signature': 'test'
  }
};

console.log('🔄 Creating test order via webhook...');

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('Response status:', res.statusCode);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Webhook response:', data);
    
    // Now test fetching the order
    setTimeout(() => {
      const fetchOptions = {
        hostname: 'catalyst-backend-fzhu.onrender.com',
        port: 443,
        path: '/api/orders/by-payment-reference/cs_test_neworder123',
        method: 'GET'
      };
      
      console.log('\n🔍 Fetching newly created order...');
      
      const fetchReq = https.request(fetchOptions, (fetchRes) => {
        let fetchData = '';
        
        fetchRes.on('data', (chunk) => {
          fetchData += chunk;
        });
        
        fetchRes.on('end', () => {
          try {
            const result = JSON.parse(fetchData);
            console.log('✅ New order fetch result:');
            console.log('Order ID:', result.data?.id);
            console.log('OrderItems length:', result.data?.OrderItems?.length);
            
            if (result.data?.OrderItems?.length > 0) {
              console.log('🎉 SUCCESS! New order has OrderItems!');
            } else {
              console.log('❌ New order also has empty OrderItems');
            }
          } catch (parseError) {
            console.log('Raw fetch response:', fetchData);
          }
        });
      });
      
      fetchReq.on('error', (error) => {
        console.error('Fetch failed:', error.message);
      });
      
      fetchReq.end();
    }, 2000);
  });
});

req.on('error', (error) => {
  console.error('Webhook request failed:', error.message);
});

req.write(postData);
req.end();