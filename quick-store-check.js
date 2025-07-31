/**
 * Quick check for store 81b6dba6-3edd-477d-9432-061551fbfc5b
 * Run in browser console as playamin998@gmail.com
 */

async function quickStoreCheck() {
    const storeId = '81b6dba6-3edd-477d-9432-061551fbfc5b';
    const token = localStorage.getItem('store_owner_auth_token');
    
    console.log('🔍 QUICK STORE CHECK');
    console.log('='.repeat(30));
    
    try {
        // Get store details directly
        const resp = await fetch(`/api/stores/${storeId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (resp.ok) {
            const data = await resp.json();
            const store = data.data;
            
            console.log('📊 STORE DETAILS:');
            console.log(`   Name: ${store.name}`);
            console.log(`   ID: ${store.id}`);
            console.log(`   Owner ID: ${store.user_id}`);
            console.log(`   Is Active: ${store.is_active}`);
            console.log(`   Created: ${store.created_at}`);
            
            if (store.is_active === false || store.is_active === 0) {
                console.log('❌ PROBLEM FOUND: Store is INACTIVE');
                console.log('💡 SOLUTION: Store needs to be activated');
                console.log('   The dropdown only shows active stores (is_active = true)');
            } else {
                console.log('✅ Store is active - checking other issues...');
            }
            
        } else {
            console.log('❌ Cannot access store:', resp.status);
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

quickStoreCheck();