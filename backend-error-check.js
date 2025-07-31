/**
 * Check backend error - HTML response means server error
 * Run this in browser console
 */

async function checkBackendError() {
    const token = localStorage.getItem('store_owner_auth_token');
    
    console.log('🔍 CHECKING BACKEND ERROR');
    console.log('='.repeat(40));
    
    // Check if we can reach the backend at all
    console.log('\n1. Testing backend connectivity...');
    try {
        const testResp = await fetch('/api/test-connection');
        console.log('   Connection test status:', testResp.status);
        const testText = await testResp.text();
        
        if (testText.includes('<!doctype')) {
            console.log('   ❌ Backend is returning HTML (error page)');
            console.log('   First 200 chars:', testText.substring(0, 200));
        } else {
            console.log('   ✅ Backend responding with data');
        }
    } catch (e) {
        console.log('   ❌ Cannot reach backend:', e.message);
    }
    
    // Check stores dropdown specifically
    console.log('\n2. Testing stores dropdown...');
    try {
        const resp = await fetch('/api/stores/dropdown', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('   Status:', resp.status);
        console.log('   Content-Type:', resp.headers.get('content-type'));
        
        const text = await resp.text();
        
        if (text.includes('<!doctype') || text.includes('<html>')) {
            console.log('   ❌ Getting HTML error page');
            console.log('   Error page content (first 300 chars):');
            console.log('   ', text.substring(0, 300));
            
            // Try to extract error info
            const titleMatch = text.match(/<title>(.*?)<\/title>/);
            if (titleMatch) {
                console.log('   Error title:', titleMatch[1]);
            }
        } else {
            console.log('   ✅ Getting JSON response');
            try {
                const data = JSON.parse(text);
                console.log('   Data:', data);
            } catch (e) {
                console.log('   ❌ JSON parse error:', e.message);
            }
        }
    } catch (e) {
        console.log('   ❌ Network error:', e.message);
    }
    
    // Check authentication
    console.log('\n3. Testing authentication...');
    try {
        const authResp = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('   Auth status:', authResp.status);
        
        if (authResp.status === 401) {
            console.log('   ❌ Token expired - need to log in again');
        } else if (authResp.ok) {
            const user = await authResp.json();
            console.log('   ✅ Authenticated as:', user.email);
        }
    } catch (e) {
        console.log('   ❌ Auth check failed:', e.message);
    }
    
    console.log('\n📋 DIAGNOSIS:');
    console.log('If you see HTML responses:');
    console.log('1. Backend deployment failed');
    console.log('2. PostgreSQL parameter syntax errors crashed the server');
    console.log('3. Database connection failed');
    
    console.log('\n🔧 SOLUTIONS:');
    console.log('1. Check Render dashboard for deployment errors');
    console.log('2. Look at server logs for specific error messages');
    console.log('3. May need to rollback the parameter changes');
}

checkBackendError();