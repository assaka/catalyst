import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CustomerAuth } from "@/api/storefront-entities";
import { createPublicUrl } from "@/utils/urlUtils";
import { useStore } from "@/components/storefront/StoreProvider";
import slotConfigurationService from '@/services/slotConfigurationService';
import { UnifiedSlotRenderer } from '@/components/editor/slot/UnifiedSlotRenderer';
import '@/components/editor/slot/AccountLoginSlotComponents'; // Register account/login components
import { loginConfig } from '@/components/editor/slot/configs/login-config';
import { LoginProvider } from '@/contexts/LoginContext';
import { t } from '@/utils/translationHelper';

export default function Login() {
  console.log('🚀 LOGIN COMPONENT RENDERING - START');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { storeCode } = useParams();
  const navigate = useNavigate();
  const { store, settings } = useStore();

  console.log('🚀 LOGIN: After useStore() - store:', !!store, 'settings:', !!settings);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });

  // Slot configuration state
  const [loginLayoutConfig, setLoginLayoutConfig] = useState(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Force re-render when translations load
  const [translationsLoaded, setTranslationsLoaded] = useState(false);

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
      // Ensure store is loaded before attempting login
      if (!store?.id) {
        setError(t('store_info_not_available_refresh', settings));
        return;
      }

      // Use CustomerAuth from storefront-entities for store-specific token storage
      const response = await CustomerAuth.login(
        formData.email,
        formData.password,
        formData.rememberMe,
        store.id
      );

      let actualResponse = response;
      if (Array.isArray(response)) {
        actualResponse = response[0];
      }

      const isSuccess = actualResponse?.success ||
                       actualResponse?.status === 'success' ||
                       actualResponse?.token ||
                       (actualResponse && Object.keys(actualResponse).length > 0);

      if (isSuccess) {
        // Token is already saved by CustomerAuth.login() with store-specific key
        // Just remove the logged out flag
        localStorage.removeItem('user_logged_out');

        const accountUrl = await getCustomerAccountUrl();
        navigate(accountUrl);
        return;
      } else {
        setError(t('login_failed_invalid_response', settings));
      }
    } catch (error) {
      setError(error.message || t('login_failed', settings));
    } finally {
      setLoading(false);
    }
  };

  // Track when translations load
  useEffect(() => {
    // Check if ui_translations is populated
    if (settings?.ui_translations && Object.keys(settings.ui_translations).length > 0) {
      const currentLang = localStorage.getItem('catalyst_language') || 'en';
      const hasTranslationsForCurrentLang = settings.ui_translations[currentLang];

      if (hasTranslationsForCurrentLang && Object.keys(hasTranslationsForCurrentLang).length > 20) {
        console.log('✅ LOGIN: Translations loaded!', {
          languages: Object.keys(settings.ui_translations),
          currentLang,
          keysInCurrentLang: Object.keys(hasTranslationsForCurrentLang).length
        });
        setTranslationsLoaded(true);
      }
    }
  }, [settings]);

  // Show loading state until config AND translations are loaded
  if (!configLoaded || !translationsLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">
          {!translationsLoaded ? 'Loading translations...' : t('loading', settings)}
        </div>
      </div>
    );
  }

  const hasConfig = loginLayoutConfig && loginLayoutConfig.slots;
  const hasSlots = hasConfig && Object.keys(loginLayoutConfig.slots).length > 0;

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
    createPublicUrl,
    settings,
    store
  };

  // Debug: Log settings to see what's being passed
  console.log('🔍 LOGIN: settings being passed to UnifiedSlotRenderer:', {
    hasSettings: !!settings,
    hasUiTranslations: !!settings?.ui_translations,
    uiTranslationsKeys: Object.keys(settings?.ui_translations || {}),
    currentLang: localStorage.getItem('catalyst_language') || 'en',
    translationsForCurrentLang: settings?.ui_translations?.[localStorage.getItem('catalyst_language') || 'en'] ? Object.keys(settings.ui_translations[localStorage.getItem('catalyst_language') || 'en']).length : 0,
    settingsKeys: Object.keys(settings || {}).slice(0, 20),
    translationsLoaded
  });

  // CRITICAL DEBUG - Log right before rendering
  console.log('⚠️ ABOUT TO RENDER UnifiedSlotRenderer with loginData:', {
    hasLoginDataObj: !!loginDataObj,
    hasSettingsInLoginDataObj: !!loginDataObj.settings,
    hasUiTranslations: !!loginDataObj.settings?.ui_translations,
    uiTranslationsKeys: Object.keys(loginDataObj.settings?.ui_translations || {}),
    loginDataObjKeys: Object.keys(loginDataObj)
  });

  return (
    <LoginProvider loginData={loginDataObj}>
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
            <h2 className="text-2xl font-bold text-center mb-4">{t('sign_in', settings)}</h2>
            <p className="text-gray-600 text-center">
              {t('login_config_not_available', settings)}
            </p>
          </div>
        </div>
      )}
      </div>
    </LoginProvider>
  );
}
