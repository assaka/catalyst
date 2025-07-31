import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl, createStoreUrl, getStoreSlugFromUrl } from "@/utils";
import { createAdminUrl, createPublicUrl, getStoreSlugFromPublicUrl } from "@/utils/urlUtils";
import { setRoleBasedAuthData } from "@/utils/auth";
import { Auth as AuthService, User } from "@/api/entities";
import apiClient from "@/api/client";
import StoreOwnerAuthLayout from "./StoreOwnerAuthLayout";
import CustomerAuthLayout from "./CustomerAuthLayout";

// Helper function for debugging authentication status
window.debugAuth = () => {
  console.log('=== AUTH DEBUG INFO ===');
  console.log('API Client isLoggedOut:', apiClient.isLoggedOut);
  console.log('API Client token:', apiClient.getToken() ? 'Token exists' : 'No token');
  console.log('Stored tokens:', {
    storeOwner: localStorage.getItem('store_owner_auth_token') ? 'Exists' : 'Missing',
    customer: localStorage.getItem('customer_auth_token') ? 'Exists' : 'Missing'
  });
  console.log('User data:', {
    storeOwner: localStorage.getItem('store_owner_user_data') ? JSON.parse(localStorage.getItem('store_owner_user_data')) : null,
    customer: localStorage.getItem('customer_user_data') ? JSON.parse(localStorage.getItem('customer_user_data')) : null
  });
  console.log('Logout flag:', localStorage.getItem('user_logged_out'));
  console.log('Current URL:', window.location.href);
  console.log('All localStorage keys:', Object.keys(localStorage));
};

// Helper function to clear logout state and retry authentication
window.clearLogoutState = () => {
  console.log('🔧 Clearing logout state...');
  console.log('Before:', {
    isLoggedOut: apiClient.isLoggedOut,
    logoutFlag: localStorage.getItem('user_logged_out')
  });
  
  localStorage.removeItem('user_logged_out');
  apiClient.isLoggedOut = false;
  
  console.log('After:', {
    isLoggedOut: apiClient.isLoggedOut,
    logoutFlag: localStorage.getItem('user_logged_out')
  });
  
  console.log('✅ Logout state cleared. Reload the page to retry authentication.');
  window.location.reload();
};

// Helper function to simulate a login (for testing)
window.simulateStoreOwnerLogin = (email = 'test@example.com') => {
  console.log('🔧 Simulating store owner login...');
  const mockToken = 'mock_store_owner_token_' + Date.now();
  const mockUser = {
    id: 1,
    email: email,
    role: 'store_owner',
    first_name: 'Test',
    last_name: 'Owner'
  };
  
  localStorage.setItem('store_owner_auth_token', mockToken);
  localStorage.setItem('store_owner_user_data', JSON.stringify(mockUser));
  localStorage.removeItem('user_logged_out');
  
  console.log('✅ Mock store owner login created. Reload the page.');
  window.location.reload();
};

// Helper function to check localStorage user data
window.checkUserData = () => {
  console.log('=== USER DATA CHECK ===');
  const storeOwnerUserData = localStorage.getItem('store_owner_user_data');
  const customerUserData = localStorage.getItem('customer_user_data'); 
  
  console.log('Raw store owner data:', storeOwnerUserData);
  console.log('Raw customer data:', customerUserData);
  
  if (storeOwnerUserData) {
    try {
      const parsed = JSON.parse(storeOwnerUserData);
      console.log('Parsed store owner data:', parsed);
    } catch (e) {
      console.error('Error parsing store owner data:', e);
    }
  }
  
  if (customerUserData) {
    try {
      const parsed = JSON.parse(customerUserData);
      console.log('Parsed customer data:', parsed);
    } catch (e) {
      console.error('Error parsing customer data:', e);
    }
  }
};

// Helper function to decode JWT token and compare with localStorage data
window.checkTokenData = () => {
  console.log('=== TOKEN DATA CHECK ===');
  const token = localStorage.getItem('store_owner_auth_token');
  const userData = localStorage.getItem('store_owner_user_data');
  
  if (token) {
    try {
      // Decode JWT payload (basic decode, not verification)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const tokenData = JSON.parse(jsonPayload);
      console.log('Token payload:', tokenData);
      
      if (userData) {
        const userDataParsed = JSON.parse(userData);
        console.log('localStorage userData:', userDataParsed);
        
        console.log('Data comparison:', {
          tokenId: tokenData.id,
          userDataId: userDataParsed.id,
          tokenRole: tokenData.role,
          userDataRole: userDataParsed.role,
          tokenAccountType: tokenData.account_type,
          userDataAccountType: userDataParsed.account_type,
          idsMatch: tokenData.id === userDataParsed.id,
          rolesMatch: tokenData.role === userDataParsed.role,
          accountTypesMatch: tokenData.account_type === userDataParsed.account_type
        });
      }
    } catch (e) {
      console.error('Error decoding token:', e);
    }
  } else {
    console.log('No token found');
  }
};

// Helper function to test different API endpoints and methods
window.testApiMethods = async () => {
  console.log('=== API METHOD TEST ===');
  const { User, Store, Product } = await import('@/api/entities');
  
  const tests = [
    {
      name: 'User Profile Update (PUT)',
      test: async () => {
        try {
          const user = await User.me();
          if (user) {
            const result = await User.updateProfile({ first_name: user.first_name });
            return { success: true, result };
          }
          return { success: false, error: 'No user data' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    },
    {
      name: 'Store List (GET)',
      test: async () => {
        try {
          const stores = await Store.getUserStores();
          return { success: true, count: stores.length };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    },
    {
      name: 'Product List (GET)',
      test: async () => {
        try {
          const products = await Product.filter({ limit: 1 });
          return { success: true, count: products.length };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    }
  ];
  
  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    const result = await test.test();
    console.log(`Result:`, result);
  }
  
  console.log('\n=== SUMMARY ===');
  console.log('If User Profile Update fails with 403, it\'s a general PUT/POST issue');
  console.log('If only delivery endpoints fail, it\'s delivery-specific permissions');
};

// Helper function to manually fetch and store user data for current session
window.fixUserData = async () => {
  console.log('🔧 Manually fetching and storing user data...');
  
  try {
    const token = localStorage.getItem('store_owner_auth_token');
    if (!token) {
      console.error('❌ No store owner token found. Please login first.');
      return;
    }
    
    console.log('🔍 Found token, setting in API client...');
    apiClient.setToken(token);
    
    console.log('🔍 Calling User.me()...');
    const { User } = await import('@/api/entities');
    const user = await User.me();
    console.log('🔍 User.me() response:', user);
    
    if (user && user.id) {
      console.log('🔧 Storing user data in localStorage...');
      localStorage.setItem('store_owner_user_data', JSON.stringify(user));
      console.log('✅ User data stored successfully:', user);
      console.log('🔄 Reload the page to apply changes.');
      window.location.reload();
    } else {
      console.error('❌ No valid user data returned from User.me()');
      console.log('🔍 This might indicate an authentication issue');
    }
  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    if (error.status === 401 || error.status === 403) {
      console.log('🔍 Authentication error - token might be invalid');
      console.log('💡 Try logging out and logging back in');
    }
  }
};

// Helper function to test navigation
window.testNavigation = () => {
  console.log('🔧 Testing navigation to dashboard...');
  try {
    const dashboardUrl = '/admin/dashboard';
    console.log('Dashboard URL:', dashboardUrl);
    console.log('Current location:', window.location.href);
    console.log('Attempting navigation...');
    window.location.href = dashboardUrl;
  } catch (error) {
    console.error('Navigation error:', error);
  }
};

// Helper function to manually test the auth flow
window.testAuthFlow = async () => {
  console.log('🔧 Testing complete auth flow...');
  
  // Clear any existing state
  localStorage.removeItem('user_logged_out');
  apiClient.isLoggedOut = false;
  
  // Create mock token and user
  const mockToken = 'test_token_' + Date.now();
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: 'store_owner',
    first_name: 'Test',
    last_name: 'Owner'
  };
  
  localStorage.setItem('store_owner_auth_token', mockToken);
  localStorage.setItem('store_owner_user_data', JSON.stringify(mockUser));
  apiClient.setToken(mockToken);
  
  console.log('✅ Auth data set');
  console.log('Token in apiClient:', apiClient.getToken() ? 'Set' : 'Not set');
  console.log('User data:', mockUser);
  
  // Test the createAdminUrl function
  try {
    const { createAdminUrl } = await import('../utils/urlUtils.js');
    const dashboardUrl = createAdminUrl("DASHBOARD");
    console.log('Dashboard URL from createAdminUrl:', dashboardUrl);
    
    // Try navigation
    console.log('Navigating to dashboard...');
    window.location.href = dashboardUrl;
  } catch (error) {
    console.error('Error in testAuthFlow:', error);
  }
};

// Helper function to create a complete authenticated session (NOTE: Creates mock token - backend will reject)
window.createAuthSession = () => {
  console.log('🔧 Creating authenticated session...');
  console.log('⚠️ WARNING: This creates a MOCK token that the backend will reject!');
  
  // Clear logout state completely
  localStorage.removeItem('user_logged_out');
  apiClient.isLoggedOut = false;
  
  // Create realistic auth data
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InRlc3RAYXV0aGVudGljYXRlZC5jb20iLCJyb2xlIjoic3RvcmVfb3duZXIifQ.test_signature';
  const userData = {
    id: 1,
    email: 'test@authenticated.com',
    role: 'store_owner',
    account_type: 'agency',
    first_name: 'Store',
    last_name: 'Owner',
    is_active: true,
    email_verified: true
  };
  
  // Set both in localStorage and apiClient
  localStorage.setItem('store_owner_auth_token', token);
  localStorage.setItem('store_owner_user_data', JSON.stringify(userData));
  apiClient.setToken(token);
  
  console.log('✅ Authenticated session created');
  console.log('Token set:', apiClient.getToken() ? 'Yes' : 'No');
  console.log('localStorage updated:', Object.keys(localStorage));
  
  // Reload to trigger auth check
  console.log('🔄 Reloading page to trigger authentication check...');
  window.location.reload();
};

// Helper function to clear all authentication data
window.clearAllAuth = () => {
  console.log('🔧 Clearing all authentication data...');
  
  // Clear all possible auth-related keys
  const authKeys = [
    'user_logged_out',
    'store_owner_auth_token',
    'store_owner_user_data', 
    'customer_auth_token',
    'customer_user_data',
    'guest_session_id'
  ];
  
  authKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  apiClient.setToken(null);
  apiClient.isLoggedOut = false;
  
  console.log('✅ All authentication data cleared');
  console.log('Remaining localStorage keys:', Object.keys(localStorage));
  window.location.reload();
};

// Helper function to test Google OAuth endpoint directly
window.testGoogleAuth = async () => {
  console.log('🔧 Testing Google OAuth endpoint...');
  
  const googleAuthUrl = `${apiClient.baseURL}/api/auth/google`;
  console.log('🔍 Testing URL:', googleAuthUrl);
  
  try {
    // Test with a simple fetch to see what happens
    const response = await fetch(googleAuthUrl, {
      method: 'GET',
      credentials: 'include',
      redirect: 'manual' // Don't follow redirects automatically
    });
    
    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response type:', response.type);
    console.log('🔍 Response headers:', [...response.headers.entries()]);
    
    if (response.status === 0) {
      console.log('⚠️ Status 0 - possible CORS or redirect');
    } else if (response.status >= 200 && response.status < 400) {
      console.log('✅ Endpoint appears to be working');
    } else {
      console.log('❌ Endpoint returned error status');
    }
    
    // If there's a location header, it means we got a redirect
    const location = response.headers.get('location');
    if (location) {
      console.log('🔍 Redirect location:', location);
      if (location.includes('accounts.google.com')) {
        console.log('✅ Google OAuth redirect detected - authentication is configured!');
      }
    }
    
  } catch (error) {
    console.error('🔍 Error testing Google auth endpoint:', error);
    console.log('🔍 This might be normal for CORS-protected endpoints');
    
    if (error.message && error.message.includes('notsameorigin')) {
      console.log('ℹ️ CORS error is expected for OAuth endpoints - this means the endpoint exists!');
    }
  }
  
  console.log('🔍 If you want to test the actual redirect, click the Google login button');
};

// Helper function to directly navigate to Google OAuth (bypasses CORS)
window.testDirectGoogleAuth = () => {
  console.log('🔧 Testing direct navigation to Google OAuth...');
  
  const googleAuthUrl = `${apiClient.baseURL}/api/auth/google`;
  console.log('🔍 Navigating directly to:', googleAuthUrl);
  console.log('🔍 This will either:');
  console.log('   - Redirect to Google login (OAuth configured)');
  console.log('   - Show error page (OAuth not configured)');
  console.log('   - Show 404 (endpoint does not exist)');
  
  // Open in new tab so we don't lose our current debug session
  const newWindow = window.open(googleAuthUrl, '_blank');
  
  if (newWindow) {
    console.log('✅ New tab opened - check what happens there');
  } else {
    console.log('❌ Popup blocked - allow popups and try again');
  }
};

// Helper function to test the login flow with actual credentials
window.testLogin = async (email, password) => {
  console.log('🔧 Testing login flow...');
  console.log('🔍 Email:', email);
  console.log('🔍 Role: store_owner');
  
  try {
    // Clear any existing invalid tokens first
    clearAllAuth();
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test the login API directly
    const response = await fetch(`${apiClient.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        role: 'store_owner',
        rememberMe: false
      })
    });
    
    const data = await response.json();
    console.log('🔍 Login API response:', data);
    console.log('🔍 Response status:', response.status);
    
    if (response.ok && (data.token || data.data?.token)) {
      const token = data.token || data.data.token;
      console.log('✅ Login successful, token received');
      
      // Store the token
      localStorage.setItem('store_owner_auth_token', token);
      if (data.user || data.data?.user) {
        localStorage.setItem('store_owner_user_data', JSON.stringify(data.user || data.data.user));
      }
      
      console.log('🔍 Reloading page to test authentication flow...');
      window.location.reload();
    } else {
      console.error('❌ Login failed:', data);
    }
    
  } catch (error) {
    console.error('❌ Login test error:', error);
  }
};

// Helper function to test dashboard access after login
window.testDashboardAccess = async () => {
  console.log('🔧 Testing dashboard access...');
  
  console.log('🔍 Current auth state:');
  debugAuth();
  
  console.log('🔍 Testing User.me() API call...');
  try {
    const { User } = await import('../api/entities.js');
    const user = await User.me();
    console.log('✅ User.me() successful:', user);
    
    if (user && (user.role === 'store_owner' || user.role === 'admin')) {
      console.log('✅ User has correct role for dashboard access');
      console.log('🔍 Attempting navigation to dashboard...');
      window.location.href = '/dashboard';
    } else {
      console.log('❌ User role incorrect for dashboard:', user?.role);
    }
    
  } catch (error) {
    console.error('❌ User.me() failed:', error);
    console.log('🔍 This is likely why dashboard is redirecting to auth');
    
    if (error.message && error.message.includes('Invalid token')) {
      console.log('🔧 Invalid token - run clearAllAuth() and login again');
    }
  }
};

export default function AuthMiddleware({ role = 'store_owner' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    console.log('🔍 AuthMiddleware useEffect triggered');
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Search params:', Object.fromEntries(searchParams.entries()));
    
    const token = searchParams.get('token');
    const oauth = searchParams.get('oauth');
    const errorParam = searchParams.get('error');

    if (token && oauth === 'success') {
      console.log('🔍 OAuth success with token, setting up...');
      apiClient.setToken(token);
      checkAuthStatus();
    } else if (errorParam) {
      console.log('🔍 OAuth error detected:', errorParam);
      setError(getErrorMessage(errorParam));
    } else {
      // Check if user is already logged in based on role
      const tokenKey = role === 'customer' ? 'customer_auth_token' : 'store_owner_auth_token';
      const existingToken = localStorage.getItem(tokenKey);
      
      console.log('🔍 Checking existing token:', { 
        role, 
        tokenKey, 
        hasToken: !!existingToken, 
        tokenLength: existingToken ? existingToken.length : 0,
        loggedOut: localStorage.getItem('user_logged_out') 
      });
      
      if (existingToken) {
        // Always clear logout flag when we have a token - important for post-login flow
        if (localStorage.getItem('user_logged_out') === 'true') {
          console.log('🔧 CRITICAL FIX: Clearing logout flag for existing token');
          localStorage.removeItem('user_logged_out');
          apiClient.isLoggedOut = false;
        }
        
        console.log('🔍 Found valid existing token, setting up...');
        apiClient.setToken(existingToken);
        console.log('🔍 Token set in apiClient, calling checkAuthStatus...');
        checkAuthStatus();
      } else {
        console.log('🔍 No valid existing token found');
      }
    }
  }, [searchParams, role]);

  const getErrorMessage = (error) => {
    const errorMessages = {
      'oauth_failed': 'Google authentication failed. Please try again.',
      'token_generation_failed': 'Failed to generate authentication token. Please try again.',
      'database_connection_failed': 'Database connection issue. Please try again in a few moments.'
    };
    return errorMessages[error] || 'An error occurred. Please try again.';
  };

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking auth status...');
      console.log('🔍 API client isLoggedOut:', apiClient.isLoggedOut);
      console.log('🔍 Expected role:', role);
      console.log('🔍 Current token:', apiClient.getToken() ? 'Token exists' : 'No token');
      console.log('🔍 Stored tokens:', {
        storeOwner: localStorage.getItem('store_owner_auth_token') ? 'Exists' : 'Missing',
        customer: localStorage.getItem('customer_auth_token') ? 'Exists' : 'Missing'
      });
      
      if (apiClient.isLoggedOut) {
        console.log('🔍 User is marked as logged out, staying on auth page');
        return;
      }
      
      console.log('🔍 Calling User.me() with token:', apiClient.getToken() ? 'Token present' : 'No token');
      const user = await User.me();
      console.log('🔍 User.me() result:', user);
      console.log('🔍 User.me() type:', typeof user);
      console.log('🔍 User.me() keys:', user ? Object.keys(user) : 'null');
      
      if (!user) {
        console.log('🔍 No user data returned, staying on auth page');
        return;
      }
      
      // CRITICAL FIX: Store user data in localStorage
      const currentToken = apiClient.getToken();
      if (currentToken && user) {
        console.log('🔧 CRITICAL FIX: Storing user data in localStorage for role:', user.role);
        setRoleBasedAuthData(user, currentToken);
        console.log('✅ User data stored successfully');
      }
      
      console.log('🔍 User role:', user.role, 'Expected role:', role);
      
      // Redirect based on user role and expected role
      if (role === 'customer') {
        if (user.role === 'store_owner' || user.role === 'admin') {
          console.log('🔍 Store owner/admin on customer auth page, redirecting to admin auth');
          navigate(createAdminUrl("ADMIN_AUTH"));
        } else if (user.role === 'customer') {
          const returnTo = searchParams.get('returnTo');
          if (returnTo) {
            console.log('🔍 Customer has returnTo, redirecting to:', returnTo);
            navigate(returnTo);
          } else {
            const storefrontUrl = await getStorefrontUrl();
            console.log('🔍 Customer redirecting to storefront:', storefrontUrl);
            navigate(storefrontUrl);
          }
        }
      } else {
        if (user.role === 'customer') {
          // Get store slug from current URL or use default
          const currentStoreSlug = getStoreSlugFromPublicUrl(window.location.pathname) || 'default';
          console.log('🔍 Customer on store owner auth page, redirecting to customer auth');
          navigate(createPublicUrl(currentStoreSlug, "CUSTOMER_AUTH"));
        } else if (user.role === 'store_owner' || user.role === 'admin') {
          const dashboardUrl = createAdminUrl("DASHBOARD");
          console.log('🔍 Store owner/admin authenticated, redirecting to dashboard:', dashboardUrl);
          navigate(dashboardUrl);
        }
      }
    } catch (error) {
      console.log('🔍 Auth check error:', error);
      console.log('🔍 Error message:', error.message);
      
      // If token is invalid, clear it automatically
      if (error.message && (error.message.includes('Invalid token') || error.message.includes('Unauthorized'))) {
        console.log('🔧 Invalid token detected, clearing authentication data...');
        
        // Clear tokens for the current role
        const tokenKey = role === 'customer' ? 'customer_auth_token' : 'store_owner_auth_token';
        const userDataKey = role === 'customer' ? 'customer_user_data' : 'store_owner_user_data';
        
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(userDataKey);
        apiClient.setToken(null);
        
        console.log('✅ Invalid authentication data cleared');
      }
      
      console.log('🔍 User not authenticated, staying on auth page');
    }
  };

  const getCustomerAccountUrl = async () => {
    // First try to get from localStorage
    const savedStoreCode = localStorage.getItem('customer_auth_store_code');
    if (savedStoreCode) {
      return createPublicUrl(savedStoreCode, 'CUSTOMER_DASHBOARD');
    }
    
    // Try to get from current URL (new and legacy)
    const currentStoreSlug = getStoreSlugFromPublicUrl(window.location.pathname) || 
                             getStoreSlugFromUrl(window.location.pathname);
    if (currentStoreSlug) {
      return createPublicUrl(currentStoreSlug, 'CUSTOMER_DASHBOARD');
    }
    
    // Try to fetch the first available store
    try {
      const { Store } = await import('@/api/entities');
      const stores = await Store.findAll();
      if (stores && stores.length > 0) {
        const firstStore = stores[0];
        return createPublicUrl(firstStore.slug, 'CUSTOMER_DASHBOARD');
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    }
    
    // Default fallback to new URL structure
    return createPublicUrl('default', 'CUSTOMER_DASHBOARD');
  };

  const handleAuth = async (formData, isLogin) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        console.log('🔍 Starting login process...', { email: formData.email, role });
        
        const response = await AuthService.login(
          formData.email, 
          formData.password, 
          formData.rememberMe, 
          role
        );
        
        console.log('🔍 Login response:', response);
        console.log('🔍 Response structure:', {
          hasSuccess: 'success' in response,
          success: response.success,
          hasData: 'data' in response,
          hasToken: response.token || response.data?.token,
          keys: Object.keys(response)
        });
        
        // Handle both array and object responses
        let actualResponse = response;
        if (Array.isArray(response)) {
          console.log('🔍 Response is array, taking first element');
          actualResponse = response[0];
          console.log('🔍 Array element structure:', {
            keys: Object.keys(actualResponse || {}),
            hasSuccess: 'success' in (actualResponse || {}),
            successValue: actualResponse?.success,
            actualResponse: actualResponse
          });
        }
        
        // Check multiple possible success indicators
        const isSuccess = actualResponse?.success || 
                         actualResponse?.status === 'success' || 
                         actualResponse?.token || 
                         (actualResponse && Object.keys(actualResponse).length > 0);
        
        console.log('🔍 Success check result:', isSuccess);
        
        if (isSuccess) {
          const token = actualResponse.data?.token || actualResponse.token;
          console.log('🔍 Extracted token:', token ? 'Token found' : 'No token found');
          
          if (token) {
            console.log('🔍 Processing login token:', { role, tokenLength: token.length });
            
            // Clear logged out flag before setting token
            localStorage.removeItem('user_logged_out');
            console.log('🔍 Cleared user_logged_out flag');
            
            // Store token based on role
            const tokenKey = role === 'customer' ? 'customer_auth_token' : 'store_owner_auth_token';
            localStorage.setItem(tokenKey, token);
            console.log('🔍 Stored token in localStorage with key:', tokenKey);
            
            apiClient.setToken(token);
            console.log('🔍 Set token in apiClient, isLoggedOut:', apiClient.isLoggedOut);
            
            // CRITICAL FIX: Store user data from login response
            const userData = actualResponse.data?.user || actualResponse.user || actualResponse;
            if (userData && userData.id) {
              console.log('🔧 CRITICAL FIX: Storing user data from login response');
              setRoleBasedAuthData(userData, token);
              console.log('✅ User data stored from login response:', userData.role);
            } else {
              console.warn('⚠️ No user data found in login response, will fetch via User.me()');
            }
            
            // For customers, navigate immediately without verification
            if (role === 'customer') {
              console.log('🔍 Customer login successful, navigating to storefront');
              localStorage.removeItem('customer_auth_store_id');
              localStorage.removeItem('customer_auth_store_code');
              
              const returnTo = searchParams.get('returnTo');
              if (returnTo) {
                console.log('🔍 Navigating to returnTo:', returnTo);
                navigate(returnTo);
              } else {
                const accountUrl = await getCustomerAccountUrl();
                console.log('🔍 Navigating to customer account:', accountUrl);
                navigate(accountUrl);
              }
              return;
            }
            
            // For store owners, redirect directly to dashboard
            console.log('✅ Store owner login successful, redirecting to dashboard...');
            setTimeout(() => {
              const dashboardUrl = createAdminUrl("DASHBOARD");
              console.log('🔍 Redirecting to dashboard:', dashboardUrl);
              navigate(dashboardUrl);
            }, 100); // Small delay to ensure token is set
          }
        }
      } else {
        // Registration
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return;
        }

        const registerData = {
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: role,
          account_type: role === 'customer' ? 'individual' : 'agency'
        };

        // Add store_id for customer registration
        if (role === 'customer') {
          const savedStoreId = localStorage.getItem('customer_auth_store_id');
          registerData.store_id = savedStoreId;
        }
        
        const response = await AuthService.register(registerData);
        
        // Handle both array and object responses for registration
        let actualRegResponse = response;
        if (Array.isArray(response)) {
          console.log('🔍 Registration response is array, taking first element');
          actualRegResponse = response[0];
        }
        
        if (actualRegResponse?.success) {
          const token = actualRegResponse.data?.token || actualRegResponse.token;
          
          if (token) {
            // Clear logged out flag before setting token
            localStorage.removeItem('user_logged_out');
            
            const tokenKey = role === 'customer' ? 'customer_auth_token' : 'store_owner_auth_token';
            localStorage.setItem(tokenKey, token);
            apiClient.setToken(token);
            
            if (role === 'customer') {
              localStorage.removeItem('customer_auth_store_id');
              localStorage.removeItem('customer_auth_store_code');
              const accountUrl = await getCustomerAccountUrl();
              navigate(accountUrl);
            } else {
              setSuccess("Registration successful! Redirecting...");
              setTimeout(() => {
                navigate(createAdminUrl("DASHBOARD"));
              }, 1500);
            }
          }
        }
      }
    } catch (error) {
      console.error('🔍 Auth error:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      });
      setError(error.message || `${isLogin ? 'Login' : 'Registration'} failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    if (role === 'customer') {
      setError("Google authentication is not available for customers.");
      return;
    }
    
    console.log('🔍 Google auth initiated');
    console.log('🔍 API Base URL:', apiClient.baseURL);
    console.log('🔍 Full Google auth URL:', `${apiClient.baseURL}/api/auth/google`);
    console.log('🔍 Current URL before redirect:', window.location.href);
    
    setLoading(true);
    setError("");
    
    const googleAuthUrl = `${apiClient.baseURL}/api/auth/google`;
    console.log('🔍 Redirecting to:', googleAuthUrl);
    
    // Test if the URL is accessible
    fetch(googleAuthUrl, { method: 'HEAD', mode: 'no-cors' })
      .then(() => {
        console.log('🔍 Google auth endpoint appears accessible');
      })
      .catch(error => {
        console.log('🔍 Google auth endpoint test failed:', error);
      });
    
    // Add a timeout to check if redirect fails
    const redirectTimeout = setTimeout(() => {
      console.log('🔍 Google auth redirect timeout - checking what happened');
      console.log('🔍 Current URL after timeout:', window.location.href);
      setError("Google authentication redirect failed. The service may not be configured properly.");
      setLoading(false);
    }, 5000);
    
    // Clear timeout if page unloads (successful redirect)
    window.addEventListener('beforeunload', () => {
      console.log('🔍 Page unloading - Google auth redirect started');
      clearTimeout(redirectTimeout);
    });
    
    try {
      console.log('🔍 Attempting redirect to Google auth...');
      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error('🔍 Error during redirect:', error);
      setError("Failed to redirect to Google authentication.");
      setLoading(false);
    }
  };

  // Render appropriate layout based on role
  if (role === 'customer') {
    return (
      <CustomerAuthLayout
        loading={loading}
        error={error}
        success={success}
        onAuth={handleAuth}
        onGoogleAuth={handleGoogleAuth}
      />
    );
  } else {
    return (
      <StoreOwnerAuthLayout
        loading={loading}
        error={error}
        success={success}
        onAuth={handleAuth}
        onGoogleAuth={handleGoogleAuth}
      />
    );
  }
}