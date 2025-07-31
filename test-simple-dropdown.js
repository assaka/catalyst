/**
 * Test the simplified dropdown after deployment
 * Run this in browser console
 */

async function testSimpleDropdown() {
    console.log('🧪 TESTING SIMPLIFIED DROPDOWN');
    console.log('='.repeat(40));
    
    const token = localStorage.getItem('store_owner_auth_token');
    if (!token) {
        console.log('❌ No auth token - please log in');
        return;
    }
    
    // Test current user
    console.log('\n1. Current user:');
    try {
        const userResp = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const user = await userResp.json();
        console.log(`   Logged in as: ${user.email} (ID: ${user.id})`);
    } catch (e) {
        console.log('   ❌ Cannot get user info');
        return;
    }
    
    // Test dropdown API
    console.log('\n2. Testing simplified dropdown:');
    try {
        const resp = await fetch('/api/stores/dropdown', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`   Status: ${resp.status}`);
        
        if (!resp.ok) {
            const errorText = await resp.text();
            console.log(`   ❌ Error response: ${errorText.substring(0, 200)}`);
            return;
        }
        
        const data = await resp.json();
        console.log('   ✅ Success! Response:', data);
        
        if (data.success && data.data) {
            console.log(`   📊 Found ${data.data.length} stores:`);
            data.data.forEach((store, i) => {
                console.log(`      ${i+1}. ${store.name} (${store.access_role})`);
            });
            
            // Expected results check
            console.log('\n3. Expected vs Actual:');
            console.log('   info@itomoti.com should see: 6 owned stores');
            console.log('   playamin998@gmail.com should see: 1 owned store (Playamin Store)');
            console.log(`   Actual: ${data.data.length} stores`);
            
        } else {
            console.log('   ⚠️ Unexpected response format');
        }
        
    } catch (e) {
        console.log('   ❌ Network error:', e.message);
    }
    
    console.log('\n📋 NEXT STEPS:');
    console.log('If this shows the correct number of owned stores:');
    console.log('✅ Basic dropdown filtering is working');
    console.log('Then we can add team access back gradually');
}

testSimpleDropdown();