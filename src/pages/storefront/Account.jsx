import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPublicUrl } from "@/utils/urlUtils";
import { useStore } from "@/components/storefront/StoreProvider";
import { CustomerAuth } from "@/api/storefront-entities";
import slotConfigurationService from '@/services/slotConfigurationService';
import { UnifiedSlotRenderer } from '@/components/editor/slot/UnifiedSlotRenderer';
import '@/components/editor/slot/AccountLoginSlotComponents'; // Register account/login components
import { accountConfig } from '@/components/editor/slot/configs/account-config';
import { useTranslation } from '@/contexts/TranslationContext';

export default function Account() {
  const navigate = useNavigate();
  const { store, settings } = useStore();
  const { t } = useTranslation();

  // Slot configuration state
  const [accountLayoutConfig, setAccountLayoutConfig] = useState(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      // Use CustomerAuth.isAuthenticated() to check token
      if (!CustomerAuth.isAuthenticated()) {
        setIsLoggedIn(false);
        setUser(null);
        return;
      }

      // Verify this is a valid customer session
      // Backend will validate if token's store_id matches the accessed store
      try {
        const userData = await CustomerAuth.me();
        if (!userData || !userData.id || userData.role !== 'customer') {
          setIsLoggedIn(false);
          setUser(null);
          return;
        }

        setIsLoggedIn(true);
        setUser(userData);
      } catch (error) {
        // If backend returns 403, customer is accessing wrong store
        console.error('Authentication check failed:', error);
        setIsLoggedIn(false);
        setUser(null);
      }
    };

    checkAuth();
  }, [store?.slug]);

  // Load account layout configuration
  useEffect(() => {
    const loadAccountLayoutConfig = async () => {
      if (!store?.id) {
        return;
      }

      try {
        const response = await slotConfigurationService.getPublishedConfiguration(store.id, 'account');

        // Check for valid published config
        if (response.success && response.data &&
            response.data.configuration &&
            response.data.configuration.slots &&
            Object.keys(response.data.configuration.slots).length > 0) {

          const publishedConfig = response.data;
          setAccountLayoutConfig(publishedConfig.configuration);
          setConfigLoaded(true);

        } else {
          // Fallback to account-config.js
          const fallbackConfig = {
            slots: { ...accountConfig.slots },
            metadata: {
              ...accountConfig.metadata,
              fallbackUsed: true,
              fallbackReason: 'No valid published configuration'
            }
          };

          setAccountLayoutConfig(fallbackConfig);
          setConfigLoaded(true);
        }
      } catch (error) {
        console.error('❌ ACCOUNT: Error loading published slot configuration:', error);

        // Fallback to account-config.js
        const fallbackConfig = {
          slots: { ...accountConfig.slots },
          metadata: {
            ...accountConfig.metadata,
            fallbackUsed: true,
            fallbackReason: `Error loading configuration: ${error.message}`
          }
        };

        setAccountLayoutConfig(fallbackConfig);
        setConfigLoaded(true);
      }
    };

    loadAccountLayoutConfig();
  }, [store]);

  const handleLogout = async () => {
    try {
      await CustomerAuth.logout();
      // CustomerAuth.logout() already removes customer tokens, but we ensure they're removed
      localStorage.removeItem('customer_auth_token');
      localStorage.removeItem('customer_auth_store_code');
      localStorage.removeItem('customer_user_data');
      localStorage.setItem('user_logged_out', 'true');

      // Ensure we have a valid store slug before redirecting
      if (store?.slug) {
        // Use just /public/{storeCode} without /storefront to match route structure
        const storefrontUrl = `/public/${store.slug}`;
        navigate(storefrontUrl);
      } else {
        // Fallback: reload the page if no store slug is available
        window.location.reload();
      }
    } catch (error) {
      console.error('Logout error:', error);
      // On error, reload the page to ensure clean state
      window.location.reload();
    }
  };

  const goToDashboard = () => {
    navigate(createPublicUrl(store?.slug || 'default', 'CUSTOMER_DASHBOARD'));
  };

  const goToOrders = () => {
    navigate(createPublicUrl(store?.slug || 'default', 'CUSTOMER_DASHBOARD') + '?tab=orders');
  };

  const goToAddresses = () => {
    navigate(createPublicUrl(store?.slug || 'default', 'CUSTOMER_DASHBOARD') + '?tab=addresses');
  };

  const goToWishlist = () => {
    navigate(createPublicUrl(store?.slug || 'default', 'CUSTOMER_DASHBOARD') + '?tab=wishlist');
  };

  // Show loading state until config is loaded
  if (!configLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('common.loading', 'Loading...')}</div>
      </div>
    );
  }

  const hasConfig = accountLayoutConfig && accountLayoutConfig.slots;
  const hasSlots = hasConfig && Object.keys(accountLayoutConfig.slots).length > 0;

  // Determine view mode based on authentication status
  const viewMode = isLoggedIn ? 'overview' : 'intro';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {hasConfig && hasSlots ? (
          <UnifiedSlotRenderer
            slots={accountLayoutConfig.slots}
            parentId={null}
            viewMode={viewMode}
            context="storefront"
            accountData={{
              user,
              isLoggedIn,
              orders,
              addresses,
              wishlistItems,
              handleLogout,
              goToDashboard,
              goToOrders,
              goToAddresses,
              goToWishlist,
              navigate,
              store,
              createPublicUrl,
              settings
            }}
          />
        ) : (
          <div className="max-w-md w-full mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-center mb-4">{t('navigation.account', 'My Account')}</h2>
              <p className="text-gray-600 text-center">
                {t('message.error', 'Account configuration not available. Please contact support.')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
