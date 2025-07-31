import { Auth } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { createAdminUrl, createPublicUrl, getCurrentUrlType, getStoreSlugFromPublicUrl } from '@/utils/urlUtils';
import apiClient from '@/api/client';

/**
 * Standardized logout function that handles:
 * - Backend logout API call
 * - Client-side token cleanup
 * - Role-based redirection to appropriate auth page
 * - Loading state management
 */
export const handleLogout = async () => {
  try {
    const currentUser = getCurrentUser();
    const userRole = currentUser?.role;
    
    // Call the logout API which handles backend logging and token cleanup
    await Auth.logout();
    
    // Clear role-specific session data
    clearRoleBasedAuthData(userRole);
    
    // Redirect based on role - customers reload page, others go to auth
    if (userRole === 'customer') {
      // For customers, just reload the current page after logout
      window.location.reload();
    } else {
      // For admin users, redirect to new admin login URL
      const authUrl = createAdminUrl('ADMIN_AUTH');
      window.location.href = authUrl;
    }
    
  } catch (error) {
    console.error('❌ Logout failed:', error);
    
    // Even if logout fails, redirect appropriately for security
    const currentUser = getCurrentUser();
    const userRole = currentUser?.role;
    
    if (userRole === 'customer') {
      // For customers, just reload the current page after logout
      window.location.reload();
    } else {
      // For admin users, redirect to new admin login URL
      const authUrl = createAdminUrl('ADMIN_AUTH');
      window.location.href = authUrl;
    }
  }
};

/**
 * Logout function for React Router environments
 * Uses navigate instead of window.location.href for better UX
 */
export const handleLogoutWithNavigate = async (navigate) => {
  try {
    const currentUser = getCurrentUser();
    const userRole = currentUser?.role;
    
    // Call the logout API which handles backend logging and token cleanup
    await Auth.logout();
    
    // Clear role-specific session data
    clearRoleBasedAuthData(userRole);
    
    // Navigate based on role - customers reload page, others go to auth
    if (userRole === 'customer') {
      // For customers, just reload the current page after logout
      window.location.reload();
    } else {
      // For admin users, navigate to new admin login URL
      navigate('/admin/auth');
    }
    
  } catch (error) {
    console.error('❌ Logout failed:', error);
    
    // Even if logout fails, navigate appropriately for security
    const currentUser = getCurrentUser();
    const userRole = currentUser?.role;
    
    if (userRole === 'customer') {
      // For customers, just reload the current page after logout
      window.location.reload();
    } else {
      // For admin users, navigate to new admin login URL
      navigate('/admin/auth');
    }
  }
};

/**
 * Check if user is authenticated with valid role-based session
 */
export const isAuthenticated = (requiredRole = null) => {
  // Respect the logout state from apiClient
  if (apiClient.isLoggedOut) {
    return false;
  }
  
  // Check role-specific tokens directly
  if (requiredRole === 'customer') {
    return !!(localStorage.getItem('customer_auth_token') && localStorage.getItem('customer_user_data'));
  } else if (requiredRole === 'store_owner' || requiredRole === 'admin') {
    return !!(localStorage.getItem('store_owner_auth_token') && localStorage.getItem('store_owner_user_data'));
  } else {
    // If no specific role required, check if any role is authenticated
    const hasCustomer = !!(localStorage.getItem('customer_auth_token') && localStorage.getItem('customer_user_data'));
    const hasStoreOwner = !!(localStorage.getItem('store_owner_auth_token') && localStorage.getItem('store_owner_user_data'));
    return hasCustomer || hasStoreOwner;
  }
};

/**
 * Get current user data based on context and active session
 */
export const getCurrentUser = () => {
  try {
    // Determine based on current URL context first
    const currentPath = window.location.pathname.toLowerCase();
    const isCustomerContext = currentPath.startsWith('/public/') ||
                             currentPath.includes('/storefront') || 
                             currentPath.includes('/cart') || 
                             currentPath.includes('/checkout');
    
    if (isCustomerContext) {
      const customerData = localStorage.getItem('customer_user_data');
      if (customerData) {
        return JSON.parse(customerData);
      }
    }
    
    // For admin contexts or default, prioritize store owner
    const storeOwnerData = localStorage.getItem('store_owner_user_data');
    if (storeOwnerData) {
      return JSON.parse(storeOwnerData);
    }
    
    // Fallback to customer
    const customerData = localStorage.getItem('customer_user_data');
    if (customerData) {
      return JSON.parse(customerData);
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  const currentUser = getCurrentUser();
  const userRole = currentUser?.role;
  
  localStorage.removeItem('selectedStoreId');
  localStorage.removeItem('storeProviderCache');
  localStorage.removeItem('onboarding_form_data');
  localStorage.removeItem('guest_session_id');
  localStorage.removeItem('cart_session_id');
  localStorage.removeItem('user_logged_out'); // Clear logout flag for fresh start
  localStorage.removeItem('session_created_at');
  
  // Clear role-specific session data
  clearRoleBasedAuthData(userRole);
};

/**
 * Clear role-specific authentication data
 */
export const clearRoleBasedAuthData = (role) => {
  if (role === 'customer') {
    // Clear customer-specific session data
    localStorage.removeItem('customer_auth_token');
    localStorage.removeItem('customer_user_data');
    localStorage.removeItem('customer_session_id');
    localStorage.removeItem('customer_wishlist_id');
    localStorage.removeItem('customer_cart_session');
    localStorage.removeItem('customer_addresses');
    localStorage.removeItem('last_customer_activity');
  } else if (role === 'store_owner' || role === 'admin') {
    // Clear store owner/admin-specific session data
    localStorage.removeItem('store_owner_auth_token');
    localStorage.removeItem('store_owner_user_data');
    localStorage.removeItem('store_owner_session_id');
    localStorage.removeItem('admin_preferences');
    localStorage.removeItem('dashboard_state');
    localStorage.removeItem('store_management_cache');
  }
};

/**
 * Set role-based authentication data - independent dual sessions
 */
export const setRoleBasedAuthData = (user, token) => {
  console.log('🔧 Setting auth data for:', user.role);
  
  // Store role-specific data separately to maintain both sessions
  if (user.role === 'customer') {
    localStorage.setItem('customer_auth_token', token);
    localStorage.setItem('customer_user_data', JSON.stringify(user));
    localStorage.setItem('customer_session_id', generateSessionId());
    apiClient.setToken(token);
    console.log('✅ Customer session stored');
    
  } else if (user.role === 'store_owner' || user.role === 'admin') {
    localStorage.setItem('store_owner_auth_token', token);
    localStorage.setItem('store_owner_user_data', JSON.stringify(user));
    localStorage.setItem('store_owner_session_id', generateSessionId());
    apiClient.setToken(token);
    console.log('✅ Store owner session stored');
  }
  
  localStorage.setItem('session_created_at', new Date().toISOString());
};

/**
 * Generate a unique session ID
 */
const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
};


/**
 * Switch active session to specific role (maintaining both sessions)
 */
export const switchToRole = (targetRole) => {
  console.log('🔄 Switching active session to role:', targetRole);
  
  if (targetRole === 'customer') {
    const customerToken = localStorage.getItem('customer_auth_token');
    
    if (customerToken) {
      // Update API client
      apiClient.setToken(customerToken);
      console.log('✅ Switched to customer session');
      return true;
    }
  } else if (targetRole === 'store_owner' || targetRole === 'admin') {
    const storeOwnerToken = localStorage.getItem('store_owner_auth_token');
    
    if (storeOwnerToken) {
      // Update API client
      apiClient.setToken(storeOwnerToken);
      console.log('✅ Switched to store owner/admin session');
      return true;
    }
  }
  
  console.log('❌ Failed to switch to role:', targetRole);
  return false;
};

/**
 * Check if both customer and store owner are logged in
 */
export const hasBothRolesLoggedIn = () => {
  const hasCustomer = !!(localStorage.getItem('customer_auth_token') && localStorage.getItem('customer_user_data'));
  const hasStoreOwner = !!(localStorage.getItem('store_owner_auth_token') && localStorage.getItem('store_owner_user_data'));
  
  return hasCustomer && hasStoreOwner;
};

/**
 * Check if a specific role is logged in (has valid session)
 */
export const hasRoleLoggedIn = (role) => {
  if (role === 'customer') {
    return !!(localStorage.getItem('customer_auth_token') && localStorage.getItem('customer_user_data'));
  } else if (role === 'store_owner' || role === 'admin') {
    return !!(localStorage.getItem('store_owner_auth_token') && localStorage.getItem('store_owner_user_data'));
  }
  return false;
};

/**
 * Get user data for specific role (without switching active session)
 */
export const getUserDataForRole = (role) => {
  try {
    if (role === 'customer') {
      const customerUserData = localStorage.getItem('customer_user_data');
      return customerUserData ? JSON.parse(customerUserData) : null;
    } else if (role === 'store_owner' || role === 'admin') {
      const storeOwnerUserData = localStorage.getItem('store_owner_user_data');
      return storeOwnerUserData ? JSON.parse(storeOwnerUserData) : null;
    }
  } catch (error) {
    console.error(`Error parsing user data for role ${role}:`, error);
  }
  return null;
};

/**
 * Explicitly activate a specific role session (used for UI switching)
 */
export const activateRoleSession = (targetRole) => {
  console.log('🔄 Activating role session:', targetRole);
  
  if (targetRole === 'customer') {
    const customerToken = localStorage.getItem('customer_auth_token');
    
    if (customerToken) {
      apiClient.setToken(customerToken);
      console.log('✅ Customer session activated');
      
      // Trigger a custom event and return true
      window.dispatchEvent(new CustomEvent('roleSessionChanged', { detail: { role: 'customer' } }));
      return true;
    }
  } else if (targetRole === 'store_owner' || targetRole === 'admin') {
    const storeOwnerToken = localStorage.getItem('store_owner_auth_token');
    const storeOwnerUserData = localStorage.getItem('store_owner_user_data');
    
    if (storeOwnerToken && storeOwnerUserData) {
      try {
        const userData = JSON.parse(storeOwnerUserData);
        apiClient.setToken(storeOwnerToken);
        console.log('✅ Store owner session activated');
        
        // Trigger a page refresh or navigation to update UI
        window.dispatchEvent(new CustomEvent('roleSessionChanged', { detail: { role: userData.role } }));
        return true;
      } catch (e) {
        console.error('Error parsing store owner data:', e);
      }
    }
  }
  
  console.log('❌ Failed to activate role session:', targetRole);
  return false;
};

/**
 * Force set a role as the active session (used for explicit switching)
 */
export const forceActivateRole = (targetRole) => {
  console.log('🔄 Force activating role:', targetRole);
  
  if (targetRole === 'customer') {
    const customerToken = localStorage.getItem('customer_auth_token');
    
    if (customerToken) {
      apiClient.setToken(customerToken);
      console.log('✅ Forced customer session active');
      return true;
    }
  } else if (targetRole === 'store_owner' || targetRole === 'admin') {
    const storeOwnerToken = localStorage.getItem('store_owner_auth_token');
    
    if (storeOwnerToken) {
      apiClient.setToken(storeOwnerToken);
      console.log('✅ Forced store owner session active');
      return true;
    }
  }
  
  console.log('❌ Failed to force activate role:', targetRole);
  return false;
};

