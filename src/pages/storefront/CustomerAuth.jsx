import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User } from "@/api/entities";
import { Auth as AuthService } from "@/api/entities";
import apiClient from "@/api/client";
import { createPublicUrl } from "@/utils/urlUtils";
import { useStore } from "@/components/storefront/StoreProvider";
import slotConfigurationService from '@/services/slotConfigurationService';
import { UnifiedSlotRenderer } from '@/components/editor/slot/UnifiedSlotRenderer';
import '@/components/editor/slot/AccountLoginSlotComponents'; // Register account/login components
import { loginConfig } from '@/components/editor/slot/configs/login-config';

export default function CustomerAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { storeCode } = useParams();
  const navigate = useNavigate();
  const { store, loading: storeLoading } = useStore();

  // Slot configuration state
  const [loginLayoutConfig, setLoginLayoutConfig] = useState(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Load login layout configuration
  useEffect(() => {
    const loadLoginLayoutConfig = async () => {
      if (!store?.id) {
        return;
      }

      try {
        const response = await slotConfigurationService.getPublishedConfiguration(store.id, 'login');

        // Check for valid published config
        if (response.success && response.data &&
            response.data.configuration &&
            response.data.configuration.slots &&
            Object.keys(response.data.configuration.slots).length > 0) {

          const publishedConfig = response.data;
          setLoginLayoutConfig(publishedConfig.configuration);
          setConfigLoaded(true);

        } else {
          // Fallback to login-config.js
          const fallbackConfig = {
            slots: { ...loginConfig.slots },
            metadata: {
              ...loginConfig.metadata,
              fallbackUsed: true,
              fallbackReason: 'No valid published configuration'
            }
          };

          setLoginLayoutConfig(fallbackConfig);
          setConfigLoaded(true);
        }
      } catch (error) {
        console.error('❌ CUSTOMER_AUTH: Error loading published slot configuration:', error);

        // Fallback to login-config.js
        const fallbackConfig = {
          slots: { ...loginConfig.slots },
          metadata: {
            ...loginConfig.metadata,
            fallbackUsed: true,
            fallbackReason: `Error loading configuration: ${error.message}`
          }
        };

        setLoginLayoutConfig(fallbackConfig);
        setConfigLoaded(true);
      }
    };

    loadLoginLayoutConfig();
  }, [store]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const customerToken = localStorage.getItem('customer_auth_token');
      if (customerToken) {
        const userData = await User.me();
        if (userData && userData.role === 'customer') {
          // User is already authenticated, redirect to dashboard
          const accountUrl = await getCustomerAccountUrl();
          navigate(accountUrl);
          return;
        }
      }
    } catch (error) {
      // User not authenticated, stay on auth page
    } finally {
      setLoading(false);
    }
  };

  const getCustomerAccountUrl = async () => {
    // Use current store from URL
    if (storeCode) {
      return createPublicUrl(storeCode, 'CUSTOMER_DASHBOARD');
    }

    // Fallback to saved store code
    const savedStoreCode = localStorage.getItem('customer_auth_store_code');
    if (savedStoreCode) {
      return createPublicUrl(savedStoreCode, 'CUSTOMER_DASHBOARD');
    }

    return createPublicUrl('default', 'CUSTOMER_DASHBOARD');
  };

  // Extract settings from store for loginData
  const { settings } = useStore();

  const handleAuth = async (formData, isLogin) => {
    setAuthLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        // Extract store_id from store context for customer login validation

        const storeId = store?.id;

        if (!storeId) {
          setError("Store information not available. Please refresh the page.");
          setAuthLoading(false);
          return;
        }

        const response = await AuthService.login(
          formData.email,
          formData.password,
          formData.rememberMe,
          'customer',
          storeId // Pass store_id to validate customer belongs to this store
        );

        // Handle both array and object responses
        let actualResponse = response;
        if (Array.isArray(response)) {
          actualResponse = response[0];
        }

        const isSuccess = actualResponse?.success ||
                         actualResponse?.status === 'success' ||
                         actualResponse?.token ||
                         (actualResponse && Object.keys(actualResponse).length > 0);

        if (isSuccess) {
          const token = actualResponse.data?.token || actualResponse.token;

          if (token) {
            // Clear logged out flag before setting token
            localStorage.removeItem('user_logged_out');

            // Store token
            localStorage.setItem('customer_auth_token', token);
            apiClient.setToken(token);

            // Navigate to customer account
            const accountUrl = await getCustomerAccountUrl();
            navigate(accountUrl);
            return;
          }
        }
      } else {
        // Registration
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return;
        }

        // Extract store_id from store context for customer registration
        const storeId = store?.id;

        if (!storeId) {
          setError("Store information not available. Please refresh the page.");
          setAuthLoading(false);
          return;
        }

        const registerData = {
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'customer',
          account_type: 'individual',
          store_id: storeId, // CRITICAL: Bind customer to this specific store
          send_welcome_email: true // Send welcome email after registration
        };

        const response = await AuthService.register(registerData);

        // Handle both array and object responses for registration
        let actualRegResponse = response;
        if (Array.isArray(response)) {
          actualRegResponse = response[0];
        }

        if (actualRegResponse?.success) {
          const token = actualRegResponse.data?.token || actualRegResponse.token;

          if (token) {
            // Set success message for welcome email
            setSuccess("Registration successful! A welcome email has been sent to your email address.");

            // Clear logged out flag before setting token
            localStorage.removeItem('user_logged_out');

            localStorage.setItem('customer_auth_token', token);
            apiClient.setToken(token);

            // Wait a moment to show the success message before redirecting
            setTimeout(async () => {
              const accountUrl = await getCustomerAccountUrl();
              navigate(accountUrl);
            }, 2000);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message || `${isLogin ? 'Login' : 'Registration'} failed`);
    } finally {
      setAuthLoading(false);
    }
  };

  // Wait for both config AND store to be loaded before rendering
  if (loading || !configLoaded || !store) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasConfig = loginLayoutConfig && loginLayoutConfig.slots;
  const hasSlots = hasConfig && Object.keys(loginLayoutConfig.slots).length > 0;

  return (
    <div className="min-h-screen bg-gray-50 sm:py-12 sm:px-4">
      {hasConfig && hasSlots ? (
        <UnifiedSlotRenderer
          slots={loginLayoutConfig.slots}
          parentId={null}
          viewMode="register"
          context="storefront"
          loginData={{
            loading: authLoading,
            error,
            success,
            handleAuth,
            navigate,
            storeCode,
            createPublicUrl,
            settings,  // Add settings for translations
            store      // Add store data
          }}
        />
      ) : (
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-center mb-4">Customer Authentication</h2>
            <p className="text-gray-600 text-center">
              Authentication configuration not available. Please contact support.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
