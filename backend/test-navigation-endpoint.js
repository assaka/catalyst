// Test navigation endpoint to see the actual error
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Start server in test mode
process.env.PORT = 5001;

const app = require('./src/server');

// Wait for server to start, then test the endpoint
setTimeout(async () => {
  const axios = require('axios');

  try {
    console.log('🧪 Testing navigation endpoint...\n');
    const response = await axios.get('http://localhost:5001/api/admin/navigation');
    console.log('✅ Success!');
    console.log('Navigation items:', response.data.navigation?.length || 0);
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.statusText);
    console.error('Error details:', error.response?.data);
    console.error('\nFull error:');
    console.error(error);
  } finally {
    process.exit(0);
  }
}, 3000);
