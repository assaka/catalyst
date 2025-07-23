const https = require('https');

const API_BASE_URL = 'https://catalyst-backend-fzhu.onrender.com';

function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Client'
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testLoginAPI() {
  console.log('🧪 Testing login API flow...');
  
  try {
    // Test 1: Attempt login
    console.log('\n1. Testing login with playamin998@gmail.com...');
    const loginResponse = await makeRequest('/api/auth/login', 'POST', {
      email: 'playamin998@gmail.com',
      password: 'your_password_here' // You'll need to provide the actual password
    });
    
    console.log(`   Status: ${loginResponse.status}`);
    
    if (loginResponse.status === 200) {
      console.log('   ✅ Login successful!');
      console.log('   Token present:', !!loginResponse.data.token);
      console.log('   User data:', {
        email: loginResponse.data.user?.email,
        role: loginResponse.data.user?.role,
        id: loginResponse.data.user?.id
      });
      
      const token = loginResponse.data.token;
      
      if (token) {
        // Test 2: Use token to access protected endpoints
        console.log('\n2. Testing /api/auth/me with token...');
        const meResponse = await makeRequest('/api/auth/me', 'GET', null, token);
        console.log(`   Status: ${meResponse.status}`);
        if (meResponse.status === 200) {
          console.log('   ✅ Auth/me successful!');
          console.log('   User:', meResponse.data.email, meResponse.data.role);
        } else {
          console.log('   ❌ Auth/me failed:', meResponse.data);
        }
        
        // Test 3: Test stores endpoint
        console.log('\n3. Testing /api/stores with token...');
        const storesResponse = await makeRequest('/api/stores', 'GET', null, token);
        console.log(`   Status: ${storesResponse.status}`);
        if (storesResponse.status === 200) {
          console.log(`   ✅ Stores successful! Found ${storesResponse.data.length} stores`);
          if (storesResponse.data.length > 0) {
            console.log('   First store:', storesResponse.data[0].name);
          }
        } else {
          console.log('   ❌ Stores failed:', storesResponse.data);
        }
      }
    } else {
      console.log('   ❌ Login failed:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🎉 Login API test completed!');
}

// Note: You need to provide the actual password for testing
console.log('⚠️  Please edit this script and add the actual password for playamin998@gmail.com');
console.log('   Then run: node test-login-api.cjs');

// Uncomment the line below after adding the password
// testLoginAPI();