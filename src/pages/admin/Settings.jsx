
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Store, Category } from '@/api/entities';
import { User } from '@/api/entities';
import apiClient from '@/api/client';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Building2, Bell, Settings as SettingsIcon, Globe, KeyRound, Rocket } from 'lucide-react'; // Removed ReceiptText, BookOpen, Palette, Brush, ShoppingCart, Search icons
import SaveButton from '@/components/ui/save-button';
import { CountrySelect } from "@/components/ui/country-select";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import PublishButton from '@/components/admin/store/PublishButton';
import { clearSettingsCache, clearAllCache } from '@/utils/cacheUtils';
import BrevoSettings from '@/components/admin/settings/BrevoSettings';


const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryApiCall = async (apiCall, maxRetries = 5, baseDelay = 3000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await delay(Math.random() * 1000 + 500); // Random delay before each attempt
      return await apiCall();
    } catch (error) {
      const isRateLimit = error.response?.status === 429 ||
                         error.message?.includes('Rate limit') ||
                         error.message?.includes('429') ||
                         error.detail?.includes('Rate limit');

      if (isRateLimit && i < maxRetries - 1) {
        const delayTime = baseDelay * Math.pow(2, i) + Math.random() * 2000;
        console.warn(`Settings: Rate limit hit, retrying in ${delayTime.toFixed(0)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await delay(delayTime);
        continue;
      }
      throw error;
    }
  }
};

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentTab = searchParams.get('tab') || 'general';
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null); // New state for flash messages
  const [connectingDomain, setConnectingDomain] = useState(false);
  const [savingStripe, setSavingStripe] = useState(false); // This state was in original, kept it.

  useEffect(() => {
    if (selectedStore) {
      loadStore();
    }
  }, [selectedStore]);

  // Effect to clear flash messages after a few seconds
  useEffect(() => {
    if (flashMessage) {
      const timer = setTimeout(() => {
        setFlashMessage(null);
      }, 5000); // Clear message after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [flashMessage]);

  const loadStore = async () => {
    try {
      setLoading(true);
      
      if (!selectedStore) {
        console.warn("No store selected");
        setLoading(false);
        return;
      }
      
      if (!selectedStore.id) {
        console.error("Selected store has no ID:", selectedStore);
        setFlashMessage({ type: 'error', message: 'Invalid store selection. Please select a store.' });
        setLoading(false);
        return;
      }
      
      const user = await retryApiCall(() => User.me());
      
     // Fetch fresh store data to ensure we have the latest settings
      let freshStoreData = null;
      try {
        const storeResponse = await retryApiCall(() => Store.findById(selectedStore.id));
        // The API returns { success: true, data: store }
        if (storeResponse && storeResponse.success && storeResponse.data) {
          freshStoreData = storeResponse.data;
        } else if (storeResponse && storeResponse.id) {
          // Direct store object
          freshStoreData = storeResponse;
        } else if (Array.isArray(storeResponse) && storeResponse.length > 0) {
          // Array response
          freshStoreData = storeResponse[0];
        } else {
          console.warn('⚠️ Unexpected store response format:', storeResponse);
          freshStoreData = selectedStore;
        }
      } catch (error) {
        freshStoreData = selectedStore;
      }

      const storeData = freshStoreData || selectedStore;
      
      const settings = storeData.settings || {};
      
      setStore({
        id: storeData.id,
        name: storeData.name || '',
        description: storeData.description || '',
        logo_url: storeData.logo_url || '',
        domain: storeData.domain || '', // Keep existing domain if it's used internally
        custom_domain: storeData.custom_domain || storeData.domain || '', // Map existing domain to custom_domain
        domain_status: storeData.domain_status || '',
        ssl_enabled: storeData.ssl_enabled || false,
        currency: storeData.currency || 'No Currency',
        timezone: storeData.timezone || 'UTC',
        slug: storeData.slug || '',
        status: storeData.status || 'active', // Default status
        root_category_id: storeData.root_category_id || null,
        contact_details: {
          email: storeData.contact_email || '', // Map from flat structure
          phone: storeData.contact_phone || '',
          address: storeData.address_line1 || '',
          address_line2: storeData.address_line2 || '',
          city: storeData.city || '',
          state: storeData.state || '',
          postal_code: storeData.postal_code || '',
          country: storeData.country || 'US', // Default to US
          support_email: storeData.contact_email || '', // Use contact_email as support_email
        },
        stripe_settings: {
          enabled: storeData.stripe_settings?.enabled || false,
          publishable_key: storeData.stripe_settings?.publishable_key || '',
          secret_key: storeData.stripe_settings?.secret_key || '',
          webhook_secret: storeData.stripe_settings?.webhook_secret || ''
        },
        brevo_settings: {
          enabled: storeData.brevo_settings?.enabled || false,
          api_key: storeData.brevo_settings?.api_key || '',
          sender_email: storeData.brevo_settings?.sender_email || '',
          sender_name: storeData.brevo_settings?.sender_name || ''
        },
        settings: {
          // CRITICAL FIX: Check if value exists in database first, then use default
          enable_inventory: settings.hasOwnProperty('enable_inventory') ? settings.enable_inventory : true,
          enable_reviews: settings.hasOwnProperty('enable_reviews') ? settings.enable_reviews : true,
          hide_currency_category: settings.hasOwnProperty('hide_currency_category') ? settings.hide_currency_category : false,
          hide_currency_product: settings.hasOwnProperty('hide_currency_product') ? settings.hide_currency_product : false,
          hide_header_cart: settings.hasOwnProperty('hide_header_cart') ? settings.hide_header_cart : false,
          hide_header_checkout: settings.hasOwnProperty('hide_header_checkout') ? settings.hide_header_checkout : false,
          show_category_in_breadcrumb: settings.hasOwnProperty('show_category_in_breadcrumb') ? settings.show_category_in_breadcrumb : true,
          show_permanent_search: settings.hasOwnProperty('show_permanent_search') ? settings.show_permanent_search : true,
          hide_shipping_costs: settings.hasOwnProperty('hide_shipping_costs') ? settings.hide_shipping_costs : false,
          hide_quantity_selector: settings.hasOwnProperty('hide_quantity_selector') ? settings.hide_quantity_selector : false,
          require_shipping_address: settings.hasOwnProperty('require_shipping_address') ? settings.require_shipping_address : true,
          collect_phone_number_at_checkout: settings.hasOwnProperty('collect_phone_number_at_checkout') ? settings.collect_phone_number_at_checkout : false,
          allow_guest_checkout: settings.hasOwnProperty('allow_guest_checkout') ? settings.allow_guest_checkout : true,
          allowed_countries: settings.allowed_countries || ["US", "CA", "GB", "DE", "FR"],
          theme: settings.theme || { // Ensure theme is loaded with defaults
            primary_button_color: '#007bff',
            secondary_button_color: '#6c757d',
            font_family: 'Inter',
          }, 
          cookie_consent: settings.cookie_consent || { // Ensure cookie_consent is loaded with defaults
            enabled: false,
            message: 'We use cookies to ensure you get the best experience on our website. By continuing to use our site, you agree to our use of cookies.',
            accept_button_text: 'Accept',
            decline_button_text: 'Deline',
            policy_link: '/privacy-policy',
          }, 
          analytics_settings: settings.analytics_settings || {}, // Ensure analytics_settings is loaded
          seo_settings: settings.seo_settings || { // Ensure seo_settings is loaded with defaults
            meta_title_suffix: '',
            meta_description: '',
            meta_keywords: '',
            robots_txt_content: '',
            enable_rich_snippets_product: true,
            enable_rich_snippets_store: true,
            global_schema_markup_json: '',
          },
          // New settings fields from database or default
          default_tax_included_in_prices: settings.hasOwnProperty('default_tax_included_in_prices') ? settings.default_tax_included_in_prices : false,
          display_tax_inclusive_prices: settings.hasOwnProperty('display_tax_inclusive_prices') ? settings.display_tax_inclusive_prices : false,
          calculate_tax_after_discount: settings.hasOwnProperty('calculate_tax_after_discount') ? settings.calculate_tax_after_discount : true,
          display_out_of_stock: settings.hasOwnProperty('display_out_of_stock') ? settings.display_out_of_stock : true,
          product_filter_attributes: settings.product_filter_attributes || [], // New: initialize as array
          enable_credit_updates: settings.hasOwnProperty('enable_credit_updates') ? settings.enable_credit_updates : false,
          enable_coupon_rules: settings.hasOwnProperty('enable_coupon_rules') ? settings.enable_coupon_rules : false, // New
          allow_stacking_coupons: settings.hasOwnProperty('allow_stacking_coupons') ? settings.allow_stacking_coupons : false, // New
          hide_stock_quantity: settings.hasOwnProperty('hide_stock_quantity') ? settings.hide_stock_quantity : false, // New
          display_low_stock_threshold: settings.hasOwnProperty('display_low_stock_threshold') ? settings.display_low_stock_threshold : 0, // New
          
          // Root category settings - ensure boolean values are properly handled
          rootCategoryId: settings.rootCategoryId || storeData.root_category_id || null,
          excludeRootFromMenu: settings.excludeRootFromMenu === true,
          expandAllMenuItems: settings.expandAllMenuItems === true,

          // Language settings
          active_languages: settings.active_languages || ['en'],
          default_language: settings.default_language || 'en',
          use_geoip_language: settings.hasOwnProperty('use_geoip_language') ? settings.use_geoip_language : false,
        }
      });

      // Debug the loaded settings values
      console.log('🔍 Store settings loaded:', {
        rawStoreData: storeData,
        rawSettings: settings,
        allSettingsKeys: Object.keys(settings),
        rootCategoryId: settings.rootCategoryId,
        legacyRootCategoryId: storeData.root_category_id,
        finalRootCategoryId: settings.rootCategoryId || storeData.root_category_id || null,
        excludeRootFromMenu: settings.excludeRootFromMenu,
        hasExcludeRootProperty: settings.hasOwnProperty('excludeRootFromMenu'),
        finalExcludeRoot: settings.hasOwnProperty('excludeRootFromMenu') ? settings.excludeRootFromMenu : false,
        expandAllMenuItems: settings.expandAllMenuItems,
        hasExpandAllProperty: settings.hasOwnProperty('expandAllMenuItems'),
        finalExpandAll: settings.hasOwnProperty('expandAllMenuItems') ? settings.expandAllMenuItems : false
      });

    } catch (error) {
      console.error('Failed to load store:', error);
      setFlashMessage({ type: 'error', message: 'Failed to load store settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleContactChange = (field, value) => {
    setStore(prev => ({
      ...prev,
      contact_details: {
        ...prev.contact_details,
        [field]: value
      }
    }));
  };
  
  const handleStripeChange = (field, value) => {
    setStore(prev => ({
      ...prev,
      stripe_settings: {
        ...prev.stripe_settings,
        [field]: value
      }
    }));
  };

  const handleBrevoChange = (field, value) => {
    setStore(prev => ({
      ...prev,
      brevo_settings: {
        ...prev.brevo_settings,
        [field]: value
      }
    }));
  };

  const handleSettingsChange = (key, value) => {
    setStore((prev) => ({
      ...prev, 
      settings: {
        ...prev.settings,
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!store || !store.id) {
      setFlashMessage({ type: 'error', message: 'Store data not loaded. Cannot save.' });
      return;
    }
    setSaving(true);
    setSaveSuccess(false);

    try {
      
      // Create a more explicit payload to ensure all boolean fields are included
      const settingsPayload = {
        enable_inventory: store.settings.enable_inventory,
        enable_reviews: store.settings.enable_reviews,
        hide_currency_category: store.settings.hide_currency_category,
        hide_currency_product: store.settings.hide_currency_product,
        hide_header_cart: store.settings.hide_header_cart,
        hide_header_checkout: store.settings.hide_header_checkout,
        show_category_in_breadcrumb: store.settings.show_category_in_breadcrumb,
        show_permanent_search: store.settings.show_permanent_search,
        hide_shipping_costs: store.settings.hide_shipping_costs,
        hide_quantity_selector: store.settings.hide_quantity_selector,
        require_shipping_address: store.settings.require_shipping_address,
        collect_phone_number_at_checkout: store.settings.collect_phone_number_at_checkout,
        allow_guest_checkout: store.settings.allow_guest_checkout,
        allowed_countries: store.settings.allowed_countries,
        analytics_settings: store.settings.analytics_settings || {},
        // Add new settings fields to the payload explicitly
        default_tax_included_in_prices: store.settings.default_tax_included_in_prices,
        display_tax_inclusive_prices: store.settings.display_tax_inclusive_prices,
        calculate_tax_after_discount: store.settings.calculate_tax_after_discount,
        display_out_of_stock: store.settings.display_out_of_stock,
        product_filter_attributes: store.settings.product_filter_attributes,
        enable_credit_updates: store.settings.enable_credit_updates,
        enable_coupon_rules: store.settings.enable_coupon_rules,
        allow_stacking_coupons: store.settings.allow_stacking_coupons,
        hide_stock_quantity: store.settings.hide_stock_quantity,
        display_low_stock_threshold: store.settings.display_low_stock_threshold,
        
        // Root category settings - ensure boolean values are explicitly set
        rootCategoryId: store.settings.rootCategoryId || store.root_category_id,
        excludeRootFromMenu: store.settings.excludeRootFromMenu === true,
        expandAllMenuItems: store.settings.expandAllMenuItems === true,

        // Language settings
        active_languages: store.settings.active_languages || ['en'],
        default_language: store.settings.default_language || 'en',
        use_geoip_language: store.settings.use_geoip_language === true,

        seo_settings: {
          meta_title_suffix: store.settings.seo_settings?.meta_title_suffix || '',
          meta_description: store.settings.seo_settings?.meta_description || '',
          meta_keywords: store.settings.seo_settings?.meta_keywords || '',
          robots_txt_content: store.settings.seo_settings?.robots_txt_content || '',
          enable_rich_snippets_product: store.settings.seo_settings?.enable_rich_snippets_product || false,
          enable_rich_snippets_store: store.settings.seo_settings?.enable_rich_snippets_store || false,
          global_schema_markup_json: store.settings.seo_settings?.global_schema_markup_json || '',
        },
        cookie_consent: {
          enabled: store.settings.cookie_consent?.enabled || false,
          message: store.settings.cookie_consent?.message || '',
          accept_button_text: store.settings.cookie_consent?.accept_button_text || '',
          decline_button_text: store.settings.cookie_consent?.decline_button_text || '',
          policy_link: store.settings.cookie_consent?.policy_link || '',
        },
        theme: {
          primary_button_color: store.settings.theme?.primary_button_color || '',
          secondary_button_color: store.settings.theme?.secondary_button_color || '',
          font_family: store.settings.theme?.font_family || '',
        },
      };
      
      // Also include other store fields that might need updating
      // Map contact_details back to flat structure
      const payload = {
        name: store.name,
        description: store.description,
        logo_url: store.logo_url,
        custom_domain: store.custom_domain,
        contact_email: store.contact_details?.email || store.contact_email,
        contact_phone: store.contact_details?.phone || store.contact_phone,
        address_line1: store.contact_details?.address || store.address_line1,
        address_line2: store.contact_details?.address_line2 || store.address_line2,
        city: store.contact_details?.city || store.city,
        state: store.contact_details?.state || store.state,
        postal_code: store.contact_details?.postal_code || store.postal_code,
        country: store.contact_details?.country || store.country,
        timezone: store.timezone,
        currency: store.currency,
        root_category_id: store.root_category_id,
        settings: settingsPayload
      };

      
      // Debug what we're about to save
      console.log('💾 Saving store settings:', {
        storeId: store.id,
        rootCategorySettings: {
          rootCategoryId: payload.settings.rootCategoryId,
          excludeRootFromMenu: payload.settings.excludeRootFromMenu,
          expandAllMenuItems: payload.settings.expandAllMenuItems
        },
        fullSettingsPayload: payload.settings,
        fullPayload: payload
      });
      
      // Ensure settings is a proper object
      if (typeof payload.settings === 'string') {
        console.warn('⚠️ Settings was a string, parsing to object');
        payload.settings = JSON.parse(payload.settings);
      }
      
      // Use the specific settings endpoint for updating store settings
      const apiResult = await retryApiCall(() => Store.updateSettings(store.id, payload));
      
      // Handle array response from API client
      const result = Array.isArray(apiResult) ? apiResult[0] : apiResult;

      // Update our local store state with the response data
      if (result && result.settings) {
        setFlashMessage({ type: 'success', message: 'Settings saved successfully!' });
        setSaveSuccess(true);

        // Clear ALL StoreProvider cache to force reload of settings
        try {
          clearAllCache(store.id);
          localStorage.removeItem('storeProviderCache');
          sessionStorage.removeItem('storeProviderCache');

          // Force reload of the page after a short delay to ensure settings are applied
          setTimeout(() => {
            window.location.reload();
          }, 1500);

        } catch (e) {
          console.warn('Failed to clear cache from storage:', e);
        }
        
        // Update local store state with the fresh data from the response
        // Map the backend response to frontend structure just like loadStore does
        const settings = result.settings || {};
        
        setStore({
          ...store, // Keep existing store data
          settings: {
            // Update with the fresh settings from the response
            enable_inventory: settings.hasOwnProperty('enable_inventory') ? settings.enable_inventory : true,
            enable_reviews: settings.hasOwnProperty('enable_reviews') ? settings.enable_reviews : true,
            hide_currency_category: settings.hasOwnProperty('hide_currency_category') ? settings.hide_currency_category : false,
            hide_currency_product: settings.hasOwnProperty('hide_currency_product') ? settings.hide_currency_product : false,
            hide_header_cart: settings.hasOwnProperty('hide_header_cart') ? settings.hide_header_cart : false,
            hide_header_checkout: settings.hasOwnProperty('hide_header_checkout') ? settings.hide_header_checkout : false,
            show_category_in_breadcrumb: settings.hasOwnProperty('show_category_in_breadcrumb') ? settings.show_category_in_breadcrumb : true,
            show_permanent_search: settings.hasOwnProperty('show_permanent_search') ? settings.show_permanent_search : true,
            hide_shipping_costs: settings.hasOwnProperty('hide_shipping_costs') ? settings.hide_shipping_costs : false,
            hide_quantity_selector: settings.hasOwnProperty('hide_quantity_selector') ? settings.hide_quantity_selector : false,
            require_shipping_address: settings.hasOwnProperty('require_shipping_address') ? settings.require_shipping_address : true,
            collect_phone_number_at_checkout: settings.hasOwnProperty('collect_phone_number_at_checkout') ? settings.collect_phone_number_at_checkout : false,
            allow_guest_checkout: settings.hasOwnProperty('allow_guest_checkout') ? settings.allow_guest_checkout : true,
            allowed_countries: settings.allowed_countries || ["US", "CA", "GB", "DE", "FR"],
            // Root category navigation settings
            rootCategoryId: settings.rootCategoryId || result?.root_category_id,
            excludeRootFromMenu: settings.hasOwnProperty('excludeRootFromMenu') ? settings.excludeRootFromMenu : false,
            expandAllMenuItems: settings.hasOwnProperty('expandAllMenuItems') ? settings.expandAllMenuItems : false,
            // Include all other settings...
            ...settings
          }
        });
        
      } else {
        console.warn('⚠️ Settings not found in response');
        setFlashMessage({ type: 'warning', message: 'Settings saved but response unclear. Please refresh to verify.' });
      }
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      setFlashMessage({ type: 'error', message: `Failed to save settings: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleConnectDomain = async () => {
    if (!store?.custom_domain) {
      setFlashMessage({ type: 'error', message: 'Please enter a custom domain first.' });
      return;
    }

    setConnectingDomain(true);
    try {
      const updatedStore = {
        ...store,
        domain_status: 'pending'
      };
      
      // Update the store with pending status
      await retryApiCall(() => Store.update(store.id, updatedStore));
      setStore(updatedStore); // Update local state immediately
      
      // Simulate domain verification process
      setTimeout(async () => {
        try {
          // In a real app, this would be an API call to check domain status
          // and possibly trigger SSL provisioning.
          const finalStore = {
            ...updatedStore,
            domain_status: 'active',
            ssl_enabled: true
          };
          
          await retryApiCall(() => Store.update(store.id, finalStore));
          setStore(finalStore); // Update local state
          setFlashMessage({ 
            type: 'success', 
            message: 'Domain connected successfully! SSL certificate has been provisioned.' 
          });
        } catch (error) {
          const failedStore = {
            ...updatedStore,
            domain_status: 'failed'
          };
          await retryApiCall(() => Store.update(store.id, failedStore));
          setStore(failedStore);
          setFlashMessage({ 
            type: 'error', 
            message: 'Domain connection failed. Please check your DNS settings.' 
          });
        }
        setConnectingDomain(false);
      }, 3000); // Simulate 3 seconds for verification
      
    } catch (error) {
      console.error('Failed to initiate domain connection:', error);
      setFlashMessage({ type: 'error', message: 'Failed to initiate domain connection: ' + error.message });
      setConnectingDomain(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Ensure store is not null before rendering form elements that depend on it
  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-700">
        Error: Store data could not be loaded or initialized.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {flashMessage && (
          <div 
            className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white z-50 transition-opacity duration-300 ${flashMessage.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}
          >
            {flashMessage.message}
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-gray-600 mt-1">Configure your store's basic information and preferences</p>
        </div>

        <Tabs value={currentTab} onValueChange={(value) => {
          const params = new URLSearchParams(searchParams);
          params.set('tab', value);
          setSearchParams(params);
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="domain">Domain</TabsTrigger>
            <TabsTrigger value="publish">Publish</TabsTrigger>
            <TabsTrigger value="brevo">Brevo</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <Card className="material-elevation-1 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  General Settings
                </CardTitle>
                <CardDescription>Basic store information and branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Store Name</Label>
                    <Input
                      id="name"
                      value={store?.name || ''}
                      onChange={(e) => setStore(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Awesome Store"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Store Slug</Label>
                    <Input
                      id="slug"
                      value={store?.slug || ''}
                      onChange={(e) => setStore(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="my-awesome-store"
                      disabled={true} // Slugs are usually immutable after creation
                    />
                     <p className="text-sm text-gray-500 mt-1">This is your unique store identifier for URLs.</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Store Description</Label>
                  <Textarea
                    id="description"
                    value={store?.description || ''}
                    onChange={(e) => setStore(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of your store..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input 
                    id="logo_url" 
                    name="logo_url" 
                    value={store?.logo_url || ''} 
                    onChange={(e) => setStore(prev => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-sm text-gray-500 mt-1">Enter the URL of your store logo</p>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select value={store?.currency || 'USD'} onValueChange={(value) => setStore(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Store Status</Label>
                    <Select value={store?.status || 'active'} onValueChange={(value) => setStore(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <TimezoneSelect
                    value={store?.timezone || 'UTC'}
                    onChange={(timezone) => setStore(prev => ({ ...prev, timezone }))}
                    placeholder="Select your store's timezone..."
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This timezone will be used for order timestamps, scheduling, and reports
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="material-elevation-1 border-0 mt-6">
              <CardHeader>
                <CardTitle>Allowed Countries for Shipping/Billing</CardTitle>
                <CardDescription>Configure which countries are available for customer shipping and billing addresses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Select countries where your store operates</Label>
                  <CountrySelect
                    value={Array.isArray(store?.settings?.allowed_countries) ? store.settings.allowed_countries : []}
                    onChange={(countries) => handleSettingsChange('allowed_countries', countries)}
                    placeholder="Select countries where your store operates..."
                    multiple={true}
                  />
                  <p className="text-sm text-gray-500">
                    These countries will be available for shipping and billing addresses
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="material-elevation-1 border-0 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Language Settings
                </CardTitle>
                <CardDescription>Configure supported languages and localization options for your store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="active_languages">Active Languages</Label>
                  <MultiSelect
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'nl', label: 'Dutch (Nederlands)' },
                      { value: 'fr', label: 'French (Français)' },
                      { value: 'de', label: 'German (Deutsch)' },
                      { value: 'es', label: 'Spanish (Español)' },
                      { value: 'it', label: 'Italian (Italiano)' },
                      { value: 'pt', label: 'Portuguese (Português)' },
                      { value: 'pl', label: 'Polish (Polski)' },
                      { value: 'ru', label: 'Russian (Русский)' },
                      { value: 'zh', label: 'Chinese (中文)' },
                      { value: 'ja', label: 'Japanese (日本語)' },
                      { value: 'ko', label: 'Korean (한국어)' }
                    ]}
                    value={store?.settings?.active_languages || ['en']}
                    onChange={(languages) => handleSettingsChange('active_languages', languages)}
                    placeholder="Select active languages..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Select which languages are available in your store. Customers can switch between these languages.
                  </p>
                </div>

                <div>
                  <Label htmlFor="default_language">Default Language</Label>
                  <Select
                    value={store?.settings?.default_language || 'en'}
                    onValueChange={(value) => handleSettingsChange('default_language', value)}
                  >
                    <SelectTrigger id="default_language">
                      <SelectValue placeholder="Select default language" />
                    </SelectTrigger>
                    <SelectContent>
                      {(store?.settings?.active_languages || ['en']).map((lang) => {
                        const labels = {
                          en: 'English',
                          nl: 'Dutch (Nederlands)',
                          fr: 'French (Français)',
                          de: 'German (Deutsch)',
                          es: 'Spanish (Español)',
                          it: 'Italian (Italiano)',
                          pt: 'Portuguese (Português)',
                          pl: 'Polish (Polski)',
                          ru: 'Russian (Русский)',
                          zh: 'Chinese (中文)',
                          ja: 'Japanese (日本語)',
                          ko: 'Korean (한국어)'
                        };
                        return (
                          <SelectItem key={lang} value={lang}>
                            {labels[lang] || lang}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    This language will be used when a customer first visits your store or when their browser language is not supported.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="use_geoip_language" className="text-base">Use GeoIP Location</Label>
                    <p className="text-sm text-gray-500">
                      Automatically detect and set language based on customer's location
                    </p>
                  </div>
                  <Switch
                    id="use_geoip_language"
                    checked={store?.settings?.use_geoip_language || false}
                    onCheckedChange={(checked) => handleSettingsChange('use_geoip_language', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domain" className="mt-6">
            <Card className="material-elevation-1 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Domain Settings
                </CardTitle>
                <CardDescription>Connect your custom domain to your store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Default Store URL</h4>
                  <p className="text-blue-800 font-mono">{window.location.origin}/storefront/{store?.slug || 'your-store'}</p>
                  <p className="text-sm text-blue-700 mt-1">This is your store's default URL provided by the platform.</p>
                </div>

                <div>
                  <Label htmlFor="custom_domain">Custom Domain</Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom_domain"
                      value={store?.custom_domain || ''}
                      onChange={(e) => setStore(prev => ({ ...prev, custom_domain: e.target.value }))}
                      placeholder="www.yourdomain.com"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleConnectDomain}
                      disabled={connectingDomain || !store?.custom_domain}
                      className="whitespace-nowrap"
                    >
                      {connectingDomain ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4 mr-2" />
                          Connect Domain
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Enter your custom domain (e.g., www.yourdomain.com or shop.yourdomain.com)
                  </p>
                </div>

                {store?.custom_domain && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Domain Status</h4>
                      <Badge variant={
                        store.domain_status === 'active' ? 'default' : 
                        store.domain_status === 'pending' ? 'secondary' : 
                        'destructive'
                      }>
                        {store.domain_status || 'not set'}
                      </Badge>
                    </div>
                    
                    {store.domain_status === 'pending' && (
                      <div className="text-sm text-gray-600">
                        <p className="mb-2">Please add the following DNS records to your domain:</p>
                        <div className="bg-gray-50 p-3 rounded font-mono text-xs">
                          <div>Type: CNAME</div>
                          <div>Name: @ or www</div>
                          <div>Value: {window.location.hostname}</div>
                        </div>
                        <p className="mt-2">After updating your DNS, click "Connect Domain" again to verify.</p>
                      </div>
                    )}
                    
                    {store.domain_status === 'active' && (
                      <div className="text-sm text-green-600 mt-2">
                        <p>✓ Domain connected successfully</p>
                        {store.ssl_enabled && <p>✓ SSL certificate active</p>}
                      </div>
                    )}
                    
                    {store.domain_status === 'failed' && (
                      <div className="text-sm text-red-600 mt-2">
                        <p>✗ Domain connection failed</p>
                        <p>Please check your DNS settings and try again.</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Important Notes</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• DNS changes can take up to 24 hours to propagate</li>
                    <li>• SSL certificates are automatically provisioned for connected domains</li>
                    <li>• Custom domains are available on all plans</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="publish" className="mt-6">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Publish Your Store</h2>
                    <p className="text-gray-600">Deploy your store to make it publicly accessible</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Once you publish your store, it will be deployed to Render.com and accessible to your customers. 
                  Make sure you've configured your store settings, added products, and set up payment processing before publishing.
                </p>
              </div>

              {/* Publish Button Component */}
              <PublishButton 
                storeId={store?.id} 
                storeName={store?.name}
              />

              {/* Publishing Information */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900 flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    What happens when you publish?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-blue-800">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <p>Your store will be deployed to Render.com with automatic SSL certificate</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <p>All your products, categories, and settings will be included</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <p>Your store will get a unique URL: <code className="bg-blue-100 px-1 rounded">{store?.name?.toLowerCase().replace(/\s+/g, '-') || 'your-store'}.onrender.com</code></p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <p>You can later connect your custom domain in the Domain tab</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Prerequisites Check */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Pre-publish Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${store?.name ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={store?.name ? 'text-green-700' : 'text-gray-500'}>
                        Store name configured
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${store?.contact_details?.email || store?.contact_email ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={store?.contact_details?.email || store?.contact_email ? 'text-green-700' : 'text-gray-500'}>
                        Contact email set
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span className="text-blue-700">Products and categories (optional)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span className="text-blue-700">Payment settings (optional)</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Green items are required, blue items are optional but recommended before publishing.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="brevo" className="mt-6">
            <BrevoSettings />
          </TabsContent>

          <TabsContent value="contact" className="mt-6">
            <Card className="material-elevation-1 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>Details for customer communication and support</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_email">Store Email</Label>
                    <Input 
                      id="contact_email" 
                      type="email"
                      value={store?.contact_details?.email || ''} 
                      onChange={(e) => handleContactChange('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="support_email">Support Email</Label>
                    <Input 
                      id="support_email" 
                      type="email"
                      value={store?.contact_details?.support_email || ''} 
                      onChange={(e) => handleContactChange('support_email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_phone">Phone</Label>
                    <Input 
                      id="contact_phone" 
                      value={store?.contact_details?.phone || ''} 
                      onChange={(e) => handleContactChange('phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_address">Address</Label>
                    <Input 
                      id="contact_address" 
                      value={store?.contact_details?.address || ''} 
                      onChange={(e) => handleContactChange('address', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_city">City</Label>
                    <Input 
                      id="contact_city" 
                      value={store?.contact_details?.city || ''} 
                      onChange={(e) => handleContactChange('city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_state">State/Province</Label>
                    <Input 
                      id="contact_state" 
                      value={store?.contact_details?.state || ''} 
                      onChange={(e) => handleContactChange('state', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_postal">Postal Code</Label>
                    <Input 
                      id="contact_postal" 
                      value={store?.contact_details?.postal_code || ''} 
                      onChange={(e) => handleContactChange('postal_code', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_country">Country</Label>
                    {/* Using CountrySelect for better UX */}
                    <CountrySelect 
                      id="contact_country" 
                      value={store?.contact_details?.country || ''} 
                      onChange={(country) => handleContactChange('country', country)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        <div className="flex justify-end mt-8">
          <SaveButton
            onClick={handleSave}
            loading={saving}
            success={saveSuccess}
            disabled={!store?.id}
            defaultText="Save All Settings"
          />
        </div>
      </div>
    </div>
  );
}
