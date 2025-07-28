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
    const result = await Auth.logout();
    
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
    localStorage.removeItem('customer_session_id');
    localStorage.removeItem('customer_wishlist_id');
    localStorage.removeItem('customer_cart_session');
    localStorage.removeItem('customer_addresses');
    localStorage.removeItem('last_customer_activity');
  } else if (role === 'store_owner' || role === 'admin') {
    // Clear store owner/admin-specific session data
    localStorage.removeItem('store_owner_session_id');
    localStorage.removeItem('admin_preferences');
    localStorage.removeItem('dashboard_state');
    localStorage.removeItem('store_management_cache');
  }
};

/**
 * Set role-based authentication data
 */
export const setRoleBasedAuthData = (user, token) => {
  // Store common auth data
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user_data', JSON.stringify(user));
  
  // Generate and store role-specific session data
  const sessionId = generateSessionId();
  
  if (user.role === 'customer') {
    localStorage.setItem('customer_session_id', sessionId);
    localStorage.setItem('session_role', 'customer');
  } else if (user.role === 'store_owner' || user.role === 'admin') {
    localStorage.setItem('store_owner_session_id', sessionId);
    localStorage.setItem('session_role', user.role);
  }
  
  // Store session creation time for expiry management
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