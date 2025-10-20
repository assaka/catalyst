// Check if Render has the latest code
const axios = require('axios');

async function checkRender() {
  try {
    console.log('🔍 Checking Render deployment status...\n');
    console.log('Latest local commit: e1001913 - Fix admin sidebar not loading from database\n');

    // Try to hit the health endpoint
    try {
      const health = await axios.get('https://catalyst-backend-fzhu.onrender.com/health', { timeout: 5000 });
      console.log('✅ Health endpoint response:', health.data);
    } catch (err) {
      console.log('Health endpoint error:', err.response?.status, err.message);
    }

    // Try the navigation endpoint
    console.log('\n🧪 Testing navigation endpoint on Render...');
    const nav = await axios.get('https://catalyst-backend-fzhu.onrender.com/api/admin/navigation', { timeout: 10000 });
    console.log('✅ Navigation endpoint works!');
    console.log('Navigation items:', nav.data.navigation?.length || 0);
  } catch (error) {
    console.error('\n❌ Navigation endpoint error:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data);

    if (error.response?.status === 500) {
      console.log('\n💡 Possible causes:');
      console.log('  1. Deployment still in progress (wait 2-3 minutes)');
      console.log('  2. Environment variables not set on Render');
      console.log('  3. Database connection issue on Render');
      console.log('\n🔧 Next steps:');
      console.log('  - Check Render dashboard for deployment status');
      console.log('  - Verify SUPABASE_DB_URL is set in Render environment variables');
      console.log('  - Check Render logs for specific error messages');
    }
  }
}

checkRender();
