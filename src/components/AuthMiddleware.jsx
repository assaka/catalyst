import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl, createStoreUrl, getStoreSlugFromUrl } from "@/utils";
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
          navigate(createPageUrl("Auth"));
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
          navigate(createPageUrl("CustomerAuth"));
        } else if (user.role === 'store_owner' || user.role === 'admin') {
          navigate(createPageUrl("Dashboard"));
        }
      }
    } catch (error) {
      // User not authenticated, stay on auth page
    }
  };

  const getStorefrontUrl = async () => {
    // First try to get from localStorage
    const savedStoreCode = localStorage.getItem('customer_auth_store_code');
    if (savedStoreCode) {
      return createStoreUrl(savedStoreCode, 'storefront');
    }
    
    // Try to get from current URL
    const currentStoreSlug = getStoreSlugFromUrl(window.location.pathname);
    if (currentStoreSlug) {
      return createStoreUrl(currentStoreSlug, 'storefront');
    }
    
    // Try to fetch the first available store
    try {
      const { Store } = await import('@/api/entities');
      const stores = await Store.findAll();
      if (stores && stores.length > 0) {
        const firstStore = stores[0];
        return createStoreUrl(firstStore.slug, 'storefront');
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    }
    
    // Default fallback
    return '/storefront';
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
        
        if (response.success) {
          const token = response.data?.token || response.token;
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
                const storefrontUrl = await getStorefrontUrl();
                console.log('🔍 Navigating to storefront:', storefrontUrl);
                navigate(storefrontUrl);
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
              
              navigate(createPageUrl("Dashboard"));
            } catch (error) {
              // If verification fails, still navigate to dashboard
              console.error('Role verification failed:', error);
              navigate(createPageUrl("Dashboard"));
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
        
        if (response.success) {
          const token = response.data?.token || response.token;
          
          if (token) {
            // Clear logged out flag before setting token
            localStorage.removeItem('user_logged_out');
            
            const tokenKey = role === 'customer' ? 'customer_auth_token' : 'store_owner_auth_token';
            localStorage.setItem(tokenKey, token);
            apiClient.setToken(token);
            
            if (role === 'customer') {
              localStorage.removeItem('customer_auth_store_id');
              localStorage.removeItem('customer_auth_store_code');
              const storefrontUrl = await getStorefrontUrl();
              navigate(storefrontUrl);
            } else {
              setSuccess("Registration successful! Redirecting...");
              setTimeout(() => {
                navigate(createPageUrl("Dashboard"));
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
    
    setLoading(true);
    setError("");
    window.location.href = `${apiClient.baseURL}/api/auth/google`;
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