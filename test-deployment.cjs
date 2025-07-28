// Test deployment verification endpoint
const https = require('https');

const options = {
  hostname: 'catalyst-backend-fzhu.onrender.com',
  port: 443,
  path: '/api/orders/deployment-check',
  method: 'GET'
};

console.log('🔍 Testing deployment verification...');

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('Response status:', res.statusCode);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('📋 DEPLOYMENT STATUS:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.version === '3.0') {
        console.log('✅ Deployment v3.0 is ACTIVE!');
      } else {
        console.log('❌ Old deployment still active');
      }
    } catch (parseError) {
      console.log('❌ Parse error:', parseError.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error.message);
});

req.end();