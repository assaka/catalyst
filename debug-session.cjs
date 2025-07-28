// Debug script to test specific session processing
const https = require('https');

const sessionId = 'cs_test_b1fZ2fBwEvmDQAIl0WUNrf39xpLZNtbGDzWqTNXx5oysBChFKNoE8NNUNw';

const postData = JSON.stringify({
  session_id: sessionId
});

const options = {
  hostname: 'catalyst-backend-fzhu.onrender.com',
  port: 443,
  path: '/api/payments/debug-session',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🔍 Testing session processing for:', sessionId);

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('Response status:', res.statusCode);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ Result:', JSON.stringify(result, null, 2));
    } catch (parseError) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error.message);
});

req.write(postData);
req.end();