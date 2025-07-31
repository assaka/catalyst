/**
 * Debug the filtering bug where stores show for wrong users
 * Run this for BOTH users to compare results
 */

async function debugFilteringBug() {
    const problemStoreId = '81b6dba6-3edd-477d-9432-061551fbfc5b';
    const token = localStorage.getItem('store_owner_auth_token');
    
    console.log('🐛 DEBUGGING FILTERING BUG');
    console.log('='.repeat(50));
    
    if (!token) {
        console.log('❌ No token - please login');
        return;
    }
    
    try {
        // Get current user
        const userResp = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const user = await userResp.json();
        
        console.log(`🔍 Current User: ${user.email} (ID: ${user.id})`);
        
        // Get dropdown stores
        const dropdownResp = await fetch('/api/stores/dropdown', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const dropdownData = await dropdownResp.json();
        
        console.log(`📊 Dropdown shows ${dropdownData.data.length} stores:`);
        dropdownData.data.forEach(store => {
            const isProblematic = store.id === problemStoreId;
            console.log(`   ${isProblematic ? '🚨' : '  '} ${store.name} (ID: ${store.id})`);
        });
        
        // Check if problematic store is in results
        const hasProblemStore = dropdownData.data.some(s => s.id === problemStoreId);
        
        if (user.email === 'info@itomoti.com' && hasProblemStore) {
            console.log('🚨 BUG CONFIRMED: info@itomoti.com sees store they don\'t own');
        } else if (user.email === 'playamin998@gmail.com' && !hasProblemStore) {
            console.log('🚨 BUG CONFIRMED: playamin998@gmail.com doesn\'t see store they own');
        }
        
        // Try to access the problematic store directly
        console.log(`\n🔍 Testing direct access to problematic store...`);
        const storeResp = await fetch(`/api/stores/${problemStoreId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (storeResp.ok) {
            const storeData = await storeResp.json();
            console.log('✅ Can access store directly:', {
                name: storeData.data.name,
                owner_id: storeData.data.user_id,
                current_user_id: user.id,
                matches: storeData.data.user_id === user.id
            });
        } else {
            console.log('❌ Cannot access store directly:', storeResp.status);
        }
        
        console.log('\n📋 ANALYSIS:');
        console.log('This suggests:');
        console.log('1. Backend SQL query is wrong');
        console.log('2. User ID comparison is failing');
        console.log('3. Caching issue on backend');
        console.log('4. Backend deployment didn\'t update properly');
        
    } catch (error) {
        console.log('❌ Debug failed:', error.message);
    }
}

debugFilteringBug();