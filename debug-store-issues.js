/**
 * Comprehensive diagnostic script for store access issues
 * Run this in browser console when logged in
 */

async function debugStoreIssues() {
    console.log('🔍 DEBUGGING STORE ACCESS ISSUES');
    console.log('='.repeat(50));
    
    // Get current user info
    const token = localStorage.getItem('store_owner_auth_token');
    console.log('1. Auth token exists:', !!token);
    
    if (!token) {
        console.log('❌ Not logged in - please log in first');
        return;
    }
    
    // Test direct API calls
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    
    try {
        // Test 1: Stores dropdown API
        console.log('\n2. Testing /api/stores/dropdown');
        const dropdownResponse = await fetch('/api/stores/dropdown', { headers });
        console.log('   Status:', dropdownResponse.status);
        
        if (dropdownResponse.ok) {
            const dropdownData = await dropdownResponse.json();
            console.log('   Response:', dropdownData);
            
            const stores = dropdownData.data || dropdownData;
            console.log('   📊 Dropdown stores count:', stores.length);
            stores.forEach(store => {
                console.log(`     - ${store.name} (${store.access_role})`);
            });
        } else {
            const error = await dropdownResponse.text();
            console.log('   ❌ Error:', error);
        }
        
        // Test 2: Regular stores API (should be different)
        console.log('\n3. Testing /api/stores (regular API)');
        const regularResponse = await fetch('/api/stores', { headers });
        console.log('   Status:', regularResponse.status);
        
        if (regularResponse.ok) {
            const regularData = await regularResponse.json();
            console.log('   Response type:', typeof regularData);
            console.log('   Is array:', Array.isArray(regularData));
            
            const regularStores = Array.isArray(regularData) ? regularData : regularData.data || [];
            console.log('   📊 Regular stores count:', regularStores.length);
            regularStores.forEach(store => {
                console.log(`     - ${store.name} (owner: ${store.user_id})`);
            });
        }
        
        // Test 3: Frontend Store.findAll()
        console.log('\n4. Testing frontend Store.findAll()');
        if (window.Store) {
            const frontendStores = await window.Store.findAll();
            console.log('   📊 Frontend stores count:', frontendStores.length);
            frontendStores.forEach(store => {
                console.log(`     - ${store.name} (${store.access_role})`);
            });
        } else {
            console.log('   ⚠️ Store entity not available in window');
        }
        
        // Test 4: Current store selection context
        console.log('\n5. Checking store selection context');
        const selectedStoreId = localStorage.getItem('selectedStoreId');
        console.log('   Selected store ID:', selectedStoreId);
        
        // Test 5: Check who the current user is
        console.log('\n6. Testing current user identity');
        const userResponse = await fetch('/api/auth/me', { headers });
        if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('   Current user:', userData.email);
            console.log('   User ID:', userData.id);
        }
        
        // Test 6: Check team memberships for current user
        console.log('\n7. Testing team memberships');
        try {
            // This might fail if user doesn't have access
            const hamidStores = stores.filter(s => s.name === 'Hamid');
            if (hamidStores.length > 0) {
                const hamidStore = hamidStores[0];
                const teamResponse = await fetch(`/api/store-teams/${hamidStore.id}`, { headers });
                if (teamResponse.ok) {
                    const teamData = await teamResponse.json();
                    console.log('   Team data for Hamid:', teamData);
                } else {
                    console.log('   Cannot access team data for Hamid:', teamResponse.status);
                }
            }
        } catch (err) {
            console.log('   Team check failed:', err.message);
        }
        
    } catch (error) {
        console.log('❌ Network error:', error.message);
    }
    
    console.log('\n='.repeat(50));
    console.log('🎯 DIAGNOSIS COMPLETE');
    console.log('Expected results:');
    console.log('- info@itomoti.com: Should see all their owned stores');
    console.log('- playamin998@gmail.com: Should see ONLY Hamid store');
}

// Auto-run
debugStoreIssues();

// Also expose for manual use
window.debugStoreIssues = debugStoreIssues;