import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl, createStoreUrl, getStoreSlugFromUrl } from "@/utils";
import { createAdminUrl, createPublicUrl, getStoreSlugFromPublicUrl } from "@/utils/urlUtils";
import { Auth as AuthService, User } from "@/api/entities";
import apiClient from "@/api/client";
import StoreOwnerAuthLayout from "./StoreOwnerAuthLayout";
import CustomerAuthLayout from "./CustomerAuthLayout";

export default function AuthMiddleware({ role = 'store_owner' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = searchParams.get('token');
    const oauth = searchParams.get('oauth');
    const errorParam = searchParams.get('error');

    if (token && oauth === 'success') {
      apiClient.setToken(token);
      checkAuthStatus();
    } else if (errorParam) {
      setError(getErrorMessage(errorParam));
    } else {
      // Check if user is already logged in based on role
      const tokenKey = role === 'customer' ? 'customer_auth_token' : 'store_owner_auth_token';
      const existingToken = localStorage.getItem(tokenKey);
      
      console.log('🔍 Checking existing token:', { 
        role, 
        tokenKey, 
        hasToken: !!existingToken, 
        loggedOut: localStorage.getItem('user_logged_out') 
      });
      
      if (existingToken && localStorage.getItem('user_logged_out') !== 'true') {
        console.log('🔍 Found valid existing token, setting up...');
        // Clear any logout flag and set token
        localStorage.removeItem('user_logged_out');
        apiClient.setToken(existingToken);
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
      if (apiClient.isLoggedOut) return;
      
      const user = await User.me();
      if (!user) return;
      
      // Redirect based on user role and expected role
      if (role === 'customer') {
        if (user.role === 'store_owner' || user.role === 'admin') {
          navigate(createAdminUrl("ADMIN_AUTH"));
        } else if (user.role === 'customer') {
          const returnTo = searchParams.get('returnTo');
          if (returnTo) {
            navigate(returnTo);
          } else {
            const storefrontUrl = await getStorefrontUrl();
            navigate(storefrontUrl);
          }
        }
      } else {
        if (user.role === 'customer') {
          // Get store slug from current URL or use default
          const currentStoreSlug = getStoreSlugFromPublicUrl(window.location.pathname) || 'default';
          navigate(createPublicUrl(currentStoreSlug, "CUSTOMER_AUTH"));
        } else if (user.role === 'store_owner' || user.role === 'admin') {
          navigate(createAdminUrl("DASHBOARD"));
        }
      }
    } catch (error) {
      // User not authenticated, stay on auth page
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
            
            // For store owners, verify role before navigating
            try {
              const user = await User.me();
              
              if (user && user.role === 'customer') {
                setError("Invalid credentials. Customers should use the customer login page.");
                await AuthService.logout();
                localStorage.removeItem(tokenKey);
                return;
              }
              
              navigate(createAdminUrl("DASHBOARD"));
            } catch (error) {
              // If verification fails, still navigate to dashboard
              console.error('Role verification failed:', error);
              navigate(createAdminUrl("DASHBOARD"));
            }
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
    
    setLoading(true);
    setError("");
    
    const googleAuthUrl = `${apiClient.baseURL}/api/auth/google`;
    console.log('🔍 Redirecting to:', googleAuthUrl);
    
    // Add a timeout to check if redirect fails
    const redirectTimeout = setTimeout(() => {
      setError("Google authentication is not configured. Please use email/password login or contact the administrator.");
      setLoading(false);
    }, 5000);
    
    // Clear timeout if page unloads (successful redirect)
    window.addEventListener('beforeunload', () => {
      clearTimeout(redirectTimeout);
    });
    
    window.location.href = googleAuthUrl;
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