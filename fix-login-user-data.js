/**
 * Debug and fix login user data issue
 * Run this in browser console on the login page
 */

// Monkey patch the login function to ensure user data is immediately available
if (window.Auth) {
    const originalLogin = window.Auth.login;
    
    window.Auth.login = async function(email, password, rememberMe = false, role = 'store_owner') {
        console.log('🔧 PATCHED LOGIN: Starting login process...');
        
        try {
            // Call original login
            const result = await originalLogin.call(this, email, password, rememberMe, role);
            console.log('🔧 PATCHED LOGIN: Original login result:', result);
            
            // Double-check user data is stored
            const token = localStorage.getItem('store_owner_auth_token');
            const userData = localStorage.getItem('store_owner_user_data');
            
            console.log('🔧 PATCHED LOGIN: Post-login check:', {
                hasToken: !!token,
                hasUserData: !!userData,
                tokenPreview: token ? token.substring(0, 20) + '...' : 'None'
            });
            
            if (token && !userData) {
                console.log('🚨 PATCHED LOGIN: Missing user data after login! Fixing...');
                
                // Try to get user data from result
                const user = result.user || result;
                if (user && user.id) {
                    localStorage.setItem('store_owner_user_data', JSON.stringify(user));
                    console.log('✅ PATCHED LOGIN: User data fixed');
                }
            }
            
            // Ensure apiClient has the token
            if (token && window.apiClient) {
                window.apiClient.setToken(token);
                console.log('✅ PATCHED LOGIN: API client token set');
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ PATCHED LOGIN: Login failed:', error);
            throw error;
        }
    };
    
    console.log('✅ Login function patched - try logging in now');
} else {
    console.log('❌ Auth service not found - make sure you are on the login page');
}

// Also add a function to manually fix user data after login
window.fixUserData = async function() {
    console.log('🔧 MANUAL FIX: Attempting to fix user data...');
    
    const token = localStorage.getItem('store_owner_auth_token');
    if (!token) {
        console.log('❌ No token found - please login first');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
            const user = await response.json();
            localStorage.setItem('store_owner_user_data', JSON.stringify(user));
            console.log('✅ User data fixed:', user);
            
            // Reload the page to refresh all components
            window.location.reload();
        } else {
            console.log('❌ Failed to get user data:', response.status);
        }
    } catch (error) {
        console.log('❌ Error fixing user data:', error.message);
    }
};

console.log('💡 Available functions:');
console.log('- Login normally (patched to fix user data)');
console.log('- Run fixUserData() if login still has issues');