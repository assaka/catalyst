// Test script to understand the API response format
const https = require('https');

function testAPI() {
  const options = {
    hostname: 'catalyst-backend-fzhu.onrender.com',
    port: 443,
    path: '/api/storage/list?folder=library',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  console.log('Making request to:', `https://${options.hostname}${options.path}`);

  const req = https.request(options, (res) => {
    console.log('Response status:', res.statusCode);
    console.log('Response headers:', res.headers);

    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Raw response body:', data);

      try {
        const parsed = JSON.parse(data);
        console.log('Parsed response:', JSON.stringify(parsed, null, 2));

        // Test our error detection logic
        console.log('\n--- Testing Error Detection Logic ---');
        const fakeError = {
          message: parsed.message || '',
          status: res.statusCode,
          data: parsed
        };

        console.log('Error object that would be created:', fakeError);

        // Test our conditions
        if (fakeError.status === 401 ||
            fakeError.message.includes('Access denied') ||
            fakeError.message.includes('No token provided') ||
            fakeError.message.includes('Authentication') ||
            fakeError.message.includes('Unauthorized')) {
          console.log('✅ Would detect as authentication error');
        } else {
          console.log('❌ Would NOT detect as authentication error');
        }

      } catch (err) {
        console.log('Failed to parse JSON:', err.message);
      }
    });
  });

  req.on('error', (err) => {
    console.log('Request error:', err.message);
  });

  req.end();
}

testAPI();