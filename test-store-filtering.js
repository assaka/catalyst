/**
 * Test store filtering after deployment
 * Run this in browser console after logging in
 * 
 * Expected results:
 * - info@itomoti.com should see 6 owned stores  
 * - playamin998@gmail.com should see 1 owned store (Playamin Store)
 */

async function testStoreFiltering() {
    console.log('🧪 TESTING STORE FILTERING');
    console.log('='.repeat(50));
    
    const token = localStorage.getItem('store_owner_auth_token');
    if (!token) {
        console.log('❌ No auth token - please log in first');
        return;
    }
    
    // Step 1: Get current user
    console.log('\n1. Getting current user info...');
    try {
        const userResp = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!userResp.ok) {
            console.log('❌ Auth failed - token may be expired');
            return;
        }
        
        const user = await userResp.json();
        console.log(`✅ Logged in as: ${user.email} (ID: ${user.id})`);
        
        // Step 2: Test dropdown API 
        console.log('\n2. Testing store dropdown API...');
        const dropdownResp = await fetch('/api/stores/dropdown', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`   Status: ${dropdownResp.status}`);
        
        if (!dropdownResp.ok) {
            const errorText = await dropdownResp.text();
            console.log(`❌ API Error: ${errorText.substring(0, 300)}`);
            return;
        }
        
        const data = await dropdownResp.json();
        console.log('✅ API Response received');
        
        if (data.success && data.data) {
            console.log(`📊 Found ${data.data.length} stores:`);
            data.data.forEach((store, i) => {
                console.log(`   ${i+1}. ${store.name} (${store.access_role})`);
            });
            
            // Expected results check
            console.log('\n3. VALIDATION:');
            if (user.email === 'info@itomoti.com') {
                console.log('   Expected: 6 owned stores');
                console.log(`   Actual: ${data.data.length} stores`);
                if (data.data.length === 6) {
                    console.log('   ✅ CORRECT - info@itomoti.com sees only owned stores');
                } else {
                    console.log('   ❌ WRONG - should see 6 stores');
                }
            } else if (user.email === 'playamin998@gmail.com') {
                console.log('   Expected: 1 owned store (Playamin Store)');
                console.log(`   Actual: ${data.data.length} stores`);
                if (data.data.length === 1 && data.data[0].name === 'Playamin Store') {
                    console.log('   ✅ CORRECT - playamin sees only owned store');
                } else {
                    console.log('   ❌ WRONG - should see 1 store (Playamin Store)');
                }
            }
            
            // Check for unauthorized stores
            const hasHamid = data.data.some(store => store.name === 'Hamid');
            if (user.email === 'playamin998@gmail.com' && hasHamid) {
                console.log('   ❌ SECURITY ISSUE: playamin can see Hamid store (should not)');
            }
            
        } else {
            console.log('❌ Unexpected API response format:', data);
        }
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
    }
    
    console.log('\n📋 NEXT STEPS:');
    console.log('If filtering is still broken:');
    console.log('1. Check Render backend logs for SQL queries');
    console.log('2. Verify user IDs match between JWT and database');
    console.log('3. Test with fresh login tokens');
}

testStoreFiltering();