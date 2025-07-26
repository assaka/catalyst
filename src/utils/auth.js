import { Auth } from '@/api/entities';
import { createPageUrl } from '@/utils';
import apiClient from '@/api/client';

/**
 * Standardized logout function that handles:
 * - Backend logout API call
 * - Client-side token cleanup
 * - Consistent redirection to Auth page
 * - Loading state management
 */
export const handleLogout = async () => {
  try {
    
    // Call the logout API which handles backend logging and token cleanup
    const result = await Auth.logout();
    
    
    // Redirect to auth page
    const authUrl = createPageUrl('Auth');
    window.location.href = authUrl;
    
  } catch (error) {
    console.error('❌ Logout failed:', error);
    
    // Even if logout fails, redirect to auth page for security
    const authUrl = createPageUrl('Auth');
    window.location.href = authUrl;
  }
};

/**
 * Logout function for React Router environments
 * Uses navigate instead of window.location.href for better UX
 */
export const handleLogoutWithNavigate = async (navigate) => {
  try {
    
    // Call the logout API which handles backend logging and token cleanup
    await Auth.logout();
    
    
    // Navigate to auth page using React Router
    navigate('/auth');
    
  } catch (error) {
    console.error('❌ Logout failed:', error);
    
    // Even if logout fails, navigate to auth page for security
    navigate('/auth');
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  // Respect the logout state from apiClient
  if (apiClient.isLoggedOut) {
    return false;
  }
  return !!localStorage.getItem('auth_token');
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
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  localStorage.removeItem('selectedStoreId');
  localStorage.removeItem('storeProviderCache');
  localStorage.removeItem('onboarding_form_data');
  localStorage.removeItem('guest_session_id');
  localStorage.removeItem('cart_session_id');
  localStorage.removeItem('user_logged_out'); // Clear logout flag for fresh start
};