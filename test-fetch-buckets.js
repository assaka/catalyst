const axios = require('axios');

// Test configuration
const API_URL = 'http://localhost:5001/api';
const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

// You'll need to get a valid auth token from your browser's localStorage
// Open the app in browser, login, then run: localStorage.getItem('token')
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // Replace with actual token

async function testFetchBuckets() {
  try {
    console.log('🧪 Testing Supabase bucket fetching...\n');
    
    // First, check connection status
    console.log('1. Checking Supabase connection status...');
    const statusResponse = await axios.get(`${API_URL}/supabase/status`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'x-store-id': STORE_ID
      }
    });
    
    if (!statusResponse.data.connected) {
      console.log('❌ Supabase is not connected. Please connect first.');
      return;
    }
    
    console.log('✅ Supabase is connected');
    console.log('   Project URL:', statusResponse.data.projectUrl);
    console.log('   Has Anon Key:', statusResponse.data.hasAnonKey);
    console.log('   Has Service Role Key:', statusResponse.data.hasServiceRoleKey);
    
    // Now fetch buckets
    console.log('\n2. Fetching storage buckets...');
    const bucketsResponse = await axios.get(`${API_URL}/supabase/storage/buckets`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'x-store-id': STORE_ID
      }
    });
    
    if (bucketsResponse.data.success) {
      console.log('✅ Successfully fetched buckets\n');
      
      const buckets = bucketsResponse.data.buckets || [];
      console.log(`📦 Found ${buckets.length} bucket(s):\n`);
      
      buckets.forEach((bucket, index) => {
        console.log(`${index + 1}. ${bucket.name || bucket.id}`);
        console.log(`   - ID: ${bucket.id}`);
        console.log(`   - Public: ${bucket.public ? 'Yes' : 'No'}`);
        console.log(`   - Created: ${bucket.created_at || 'Unknown'}`);
        console.log(`   - Updated: ${bucket.updated_at || 'Unknown'}`);
        console.log('');
      });
      
      if (bucketsResponse.data.limited) {
        console.log('⚠️  Note: Showing limited bucket list. Service role key required for full access.');
      }
    } else {
      console.log('❌ Failed to fetch buckets:', bucketsResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.log('\n💡 Please update the AUTH_TOKEN in this script with a valid token from your browser.');
      console.log('   1. Open the app in your browser and login');
      console.log('   2. Open browser console and run: localStorage.getItem("token")');
      console.log('   3. Copy the token and replace AUTH_TOKEN in this script');
    }
  }
}

// Instructions for getting the auth token
console.log('===============================================');
console.log('📝 Before running this test:');
console.log('===============================================');
console.log('1. Make sure the backend is running (npm run dev in backend folder)');
console.log('2. Get your auth token from the browser:');
console.log('   - Login to the app');
console.log('   - Open browser console (F12)');
console.log('   - Run: localStorage.getItem("token")');
console.log('   - Copy the token (without quotes)');
console.log('3. Replace YOUR_AUTH_TOKEN_HERE in this script');
console.log('===============================================\n');

if (AUTH_TOKEN === 'YOUR_AUTH_TOKEN_HERE') {
  console.log('❌ Please update AUTH_TOKEN first!');
  process.exit(1);
}

testFetchBuckets();