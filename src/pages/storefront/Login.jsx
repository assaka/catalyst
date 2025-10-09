import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Auth as AuthService } from "@/api/entities";
import apiClient from "@/api/client";
import { createPublicUrl } from "@/utils/urlUtils";
import { useStore } from "@/components/storefront/StoreProvider";
import slotConfigurationService from '@/services/slotConfigurationService';
import { UnifiedSlotRenderer } from '@/components/editor/slot/UnifiedSlotRenderer';
import '@/components/editor/slot/AccountLoginSlotComponents'; // Register account/login components
import { loginConfig } from '@/components/editor/slot/configs/login-config';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { storeCode } = useParams();
  const navigate = useNavigate();
  const { store } = useStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });

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
        console.error('❌ LOGIN: Error loading published slot configuration:', error);

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getCustomerAccountUrl = async () => {
    if (storeCode) {
      return createPublicUrl(storeCode, 'CUSTOMER_DASHBOARD');
    }
    const savedStoreCode = localStorage.getItem('customer_auth_store_code');
    if (savedStoreCode) {
      return createPublicUrl(savedStoreCode, 'CUSTOMER_DASHBOARD');
    }
    return createPublicUrl('default', 'CUSTOMER_DASHBOARD');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log('🔐 LOGIN: Starting login for:', formData.email);

      const response = await AuthService.login(
        formData.email,
        formData.password,
        formData.rememberMe,
        'customer'
      );

      console.log('🔐 LOGIN: Response received:', response);

      let actualResponse = response;
      if (Array.isArray(response)) {
        actualResponse = response[0];
      }

      const isSuccess = actualResponse?.success ||
                       actualResponse?.status === 'success' ||
                       actualResponse?.token ||
                       (actualResponse && Object.keys(actualResponse).length > 0);

      console.log('🔐 LOGIN: Success check:', isSuccess);
      console.log('🔐 LOGIN: Token:', actualResponse.data?.token || actualResponse.token);

      if (isSuccess) {
        const token = actualResponse.data?.token || actualResponse.token;

        if (token) {
          console.log('✅ LOGIN: Token found, setting up session');
          localStorage.removeItem('user_logged_out');
          localStorage.setItem('customer_auth_token', token);
          apiClient.setToken(token);

          const accountUrl = await getCustomerAccountUrl();
          console.log('✅ LOGIN: Navigating to:', accountUrl);
          navigate(accountUrl);
          return;
        } else {
          console.error('❌ LOGIN: No token in response');
          setError('Login failed: No authentication token received');
        }
      } else {
        console.error('❌ LOGIN: Response not successful');
        setError('Login failed: Invalid response from server');
      }
    } catch (error) {
      console.error('❌ LOGIN: Error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state until config is loaded
  if (!configLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const hasConfig = loginLayoutConfig && loginLayoutConfig.slots;
  const hasSlots = hasConfig && Object.keys(loginLayoutConfig.slots).length > 0;

  // Debug: Log loginData object before passing to renderer
  const loginDataObj = {
    formData,
    loading,
    error,
    success,
    showPassword,
    handleInputChange,
    handleSubmit,
    setShowPassword,
    navigate,
    storeCode,
    createPublicUrl
  };

  console.log('🔐 LOGIN.JSX: Creating loginData object:', {
    formData,
    loading,
    error,
    success,
    showPassword,
    handleInputChangeType: typeof handleInputChange,
    handleSubmitType: typeof handleSubmit,
    setShowPasswordType: typeof setShowPassword
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {hasConfig && hasSlots ? (
        <UnifiedSlotRenderer
          slots={loginLayoutConfig.slots}
          parentId={null}
          viewMode="login"
          context="storefront"
          loginData={loginDataObj}
        />
      ) : (
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-center mb-4">Sign In</h2>
            <p className="text-gray-600 text-center">
              Login configuration not available. Please contact support.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
