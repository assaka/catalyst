import { Auth } from '@/api/entities';
import { createPageUrl } from '@/utils';
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
    
    // Redirect to appropriate auth page based on role
    const authUrl = userRole === 'customer' ? createPageUrl('CustomerAuth') : createPageUrl('Auth');
    window.location.href = authUrl;
    
  } catch (error) {
    console.error('❌ Logout failed:', error);
    
    // Even if logout fails, redirect to appropriate auth page for security
    const currentUser = getCurrentUser();
    const userRole = currentUser?.role;
    const authUrl = userRole === 'customer' ? createPageUrl('CustomerAuth') : createPageUrl('Auth');
    window.location.href = authUrl;
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
    
    // Navigate to appropriate auth page based on role
    const authPath = userRole === 'customer' ? '/customerauth' : '/auth';
    navigate(authPath);
    
  } catch (error) {
    console.error('❌ Logout failed:', error);
    
    // Even if logout fails, navigate to appropriate auth page for security
    const currentUser = getCurrentUser();
    const userRole = currentUser?.role;
    const authPath = userRole === 'customer' ? '/customerauth' : '/auth';
    navigate(authPath);
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
  
  const hasToken = !!localStorage.getItem('auth_token');
  if (!hasToken) {
    return false;
  }
  
  // Validate role-based session
  return validateRoleBasedSession(requiredRole);
};

/**
 * Get current user data from localStorage
 */
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
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
  
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  localStorage.removeItem('selectedStoreId');
  localStorage.removeItem('storeProviderCache');
  localStorage.removeItem('onboarding_form_data');
  localStorage.removeItem('guest_session_id');
  localStorage.removeItem('cart_session_id');
  localStorage.removeItem('user_logged_out'); // Clear logout flag for fresh start
  
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
 * Set role-based authentication data - truly independent dual sessions
 */
export const setRoleBasedAuthData = (user, token) => {
  console.log('🔧 Setting auth data for:', user.role);
  
  // Always store role-specific data separately to maintain both sessions
  if (user.role === 'customer') {
    localStorage.setItem('customer_auth_token', token);
    localStorage.setItem('customer_user_data', JSON.stringify(user));
    localStorage.setItem('customer_session_id', generateSessionId());
    console.log('✅ Customer session stored separately');
    
    // Always set customer as the active session when they login
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    localStorage.setItem('session_role', user.role);
    apiClient.setToken(token);
    console.log('✅ Customer set as active session');
    
  } else if (user.role === 'store_owner' || user.role === 'admin') {
    localStorage.setItem('store_owner_auth_token', token);
    localStorage.setItem('store_owner_user_data', JSON.stringify(user));
    localStorage.setItem('store_owner_session_id', generateSessionId());
    console.log('✅ Store owner session stored separately');
    
    // Always set store owner as the active session when they login
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    localStorage.setItem('session_role', user.role);
    apiClient.setToken(token);
    console.log('✅ Store owner set as active session');
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
 * Get current session role
 */
export const getSessionRole = () => {
  return localStorage.getItem('session_role');
};

/**
 * Validate role-based session
 */
export const validateRoleBasedSession = (requiredRole) => {
  const sessionRole = getSessionRole();
  const currentUser = getCurrentUser();
  
  // Check if session role matches current user role
  if (!sessionRole || !currentUser || sessionRole !== currentUser.role) {
    return false;
  }
  
  // Check if required role matches session role
  if (requiredRole && requiredRole !== sessionRole) {
    return false;
  }
  
  // Check if session is expired (optional)
  const sessionCreatedAt = localStorage.getItem('session_created_at');
  if (sessionCreatedAt) {
    const createdTime = new Date(sessionCreatedAt);
    const currentTime = new Date();
    const sessionAge = currentTime - createdTime;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxAge) {
      return false;
    }
  }
  
  return true;
};

/**
 * Check if user has appropriate session for the current context
 */
export const hasValidRoleSession = (contextRole) => {
  const currentUser = getCurrentUser();
  const sessionRole = getSessionRole();
  
  if (!currentUser || !sessionRole) {
    return false;
  }
  
  // Ensure session role matches user role
  if (sessionRole !== currentUser.role) {
    return false;
  }
  
  // Ensure session role is appropriate for context
  if (contextRole && contextRole !== sessionRole) {
    return false;
  }
  
  return true;
};

/**
 * Switch active session to specific role (maintaining both sessions)
 */
export const switchToRole = (targetRole) => {
  console.log('🔄 Switching active session to role:', targetRole);
  
  if (targetRole === 'customer') {
    const customerToken = localStorage.getItem('customer_auth_token');
    const customerUserData = localStorage.getItem('customer_user_data');
    
    if (customerToken && customerUserData) {
      localStorage.setItem('auth_token', customerToken);
      localStorage.setItem('user_data', customerUserData);
      localStorage.setItem('session_role', 'customer');
      
      // Update API client
      apiClient.setToken(customerToken);
      
      console.log('✅ Switched to customer session');
      return true;
    }
  } else if (targetRole === 'store_owner' || targetRole === 'admin') {
    const storeOwnerToken = localStorage.getItem('store_owner_auth_token');
    const storeOwnerUserData = localStorage.getItem('store_owner_user_data');
    
    if (storeOwnerToken && storeOwnerUserData) {
      localStorage.setItem('auth_token', storeOwnerToken);
      localStorage.setItem('user_data', storeOwnerUserData);
      localStorage.setItem('session_role', targetRole);
      
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
    const customerUserData = localStorage.getItem('customer_user_data');
    
    if (customerToken && customerUserData) {
      localStorage.setItem('auth_token', customerToken);
      localStorage.setItem('user_data', customerUserData);
      localStorage.setItem('session_role', 'customer');
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
        localStorage.setItem('auth_token', storeOwnerToken);
        localStorage.setItem('user_data', storeOwnerUserData);
        localStorage.setItem('session_role', userData.role);
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
    const customerUserData = localStorage.getItem('customer_user_data');
    
    if (customerToken && customerUserData) {
      localStorage.setItem('auth_token', customerToken);
      localStorage.setItem('user_data', customerUserData);
      localStorage.setItem('session_role', 'customer');
      apiClient.setToken(customerToken);
      console.log('✅ Forced customer session active');
      return true;
    }
  } else if (targetRole === 'store_owner' || targetRole === 'admin') {
    const storeOwnerToken = localStorage.getItem('store_owner_auth_token');
    const storeOwnerUserData = localStorage.getItem('store_owner_user_data');
    
    if (storeOwnerToken && storeOwnerUserData) {
      localStorage.setItem('auth_token', storeOwnerToken);
      localStorage.setItem('user_data', storeOwnerUserData);
      localStorage.setItem('session_role', targetRole);
      apiClient.setToken(storeOwnerToken);
      console.log('✅ Forced store owner session active');
      return true;
    }
  }
  
  console.log('❌ Failed to force activate role:', targetRole);
  return false;
};

