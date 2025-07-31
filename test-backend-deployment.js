/**
 * Test if backend deployment is working
 * Run this in browser console
 */

console.log('🔍 TESTING BACKEND DEPLOYMENT STATUS');
console.log('='.repeat(50));

async function testBackendDeployment() {
    const token = localStorage.getItem('store_owner_auth_token');
    
    // 1. Test backend connection
    console.log('\n1. Testing backend connection:');
    try {
        const response = await fetch('https://catalyst-backend-fzhu.onrender.com/api/test-connection');
        const data = await response.json();
        console.log('   Backend status:', response.status);
        console.log('   Connection test:', data.success ? '✅ Working' : '❌ Failed');
    } catch (e) {
        console.log('   ❌ Backend unreachable:', e.message);
    }

    // 2. Test dropdown API directly
    console.log('\n2. Testing dropdown API with authentication:');
    try {
        const response = await fetch('https://catalyst-backend-fzhu.onrender.com/api/stores/dropdown', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('   Response status:', response.status);
        
        if (response.status === 401) {
            console.log('   ❌ Authentication failed - token may be expired');
            return;
        }
        
        const text = await response.text();
        console.log('   Raw response (first 300 chars):', text.substring(0, 300));
        
        try {
            const data = JSON.parse(text);
            if (data.success && data.data) {
                console.log('   ✅ Parsed successfully');
                console.log('   Stores returned:', data.data.length);
                data.data.forEach((store, i) => {
                    console.log(`      ${i+1}. ${store.name} (${store.access_role})`);
                });
                
                // If this shows ALL stores, the backend fix didn't deploy
                if (data.data.length > 2) {
                    console.log('   ⚠️ TOO MANY STORES - Backend fix not deployed yet');
                } else {
                    console.log('   ✅ Correct number of stores - Backend fix working');
                }
            }
        } catch (parseError) {
            console.log('   ❌ JSON parse error:', parseError.message);
        }
    } catch (e) {
        console.log('   ❌ Network error:', e.message);
    }

    // 3. Check git commit hash (if available)
    console.log('\n3. Checking deployment version:');
    try {
        const response = await fetch('https://catalyst-backend-fzhu.onrender.com/api/version');
        if (response.ok) {
            const version = await response.json();
            console.log('   Deployed version:', version);
        } else {
            console.log('   Version endpoint not available');
        }
    } catch (e) {
        console.log('   Could not check version');
    }

    // 4. Instructions
    console.log('\n📋 NEXT STEPS:');
    console.log('If you see ALL stores in step 2:');
    console.log('1. Check Render dashboard: https://dashboard.render.com/');
    console.log('2. Look for "catalyst-backend-fzhu" service');
    console.log('3. Check if latest deployment completed');
    console.log('4. Look at deploy logs for errors');
    console.log('\nIf deployment is complete but still showing all stores:');
    console.log('1. There may be a logic error in the backend code');
    console.log('2. PostgreSQL parameters might still be wrong');
    console.log('3. Database connection might be failing');
}

// Run the test
testBackendDeployment();

// Also provide direct curl command
console.log('\n💡 You can also test directly with curl:');
console.log(`curl -H "Authorization: Bearer ${localStorage.getItem('store_owner_auth_token')}" https://catalyst-backend-fzhu.onrender.com/api/stores/dropdown`);