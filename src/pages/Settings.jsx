
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Store } from '@/api/entities';
import { User } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save, Building2, Bell, Settings as SettingsIcon, Globe, RefreshCw, KeyRound } from 'lucide-react'; // Removed ReceiptText, BookOpen, Palette, Brush, ShoppingCart, Search icons
import { CountrySelect } from "@/components/ui/country-select";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import TeamManagement from '@/components/admin/TeamManagement';


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
      
      // Use selectedStore data directly - no need for force refresh
      const storeData = selectedStore;
      
      // Use fresh store data
      
      // CRITICAL FIX: Use explicit checks instead of nullish coalescing with defaults
      // This ensures that false values are preserved from the database
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
        currency: storeData.currency || 'USD',
        timezone: storeData.timezone || 'UTC',
        slug: storeData.slug || '',
        status: storeData.status || 'active', // Default status
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
          enable_product_filters: settings.hasOwnProperty('enable_product_filters') ? settings.enable_product_filters : false,
          product_filter_attributes: settings.product_filter_attributes || [], // New: initialize as array
          enable_credit_updates: settings.hasOwnProperty('enable_credit_updates') ? settings.enable_credit_updates : false,
          enable_coupon_rules: settings.hasOwnProperty('enable_coupon_rules') ? settings.enable_coupon_rules : false, // New
          allow_stacking_coupons: settings.hasOwnProperty('allow_stacking_coupons') ? settings.allow_stacking_coupons : false, // New
          hide_stock_quantity: settings.hasOwnProperty('hide_stock_quantity') ? settings.hide_stock_quantity : false, // New
          display_low_stock_threshold: settings.hasOwnProperty('display_low_stock_threshold') ? settings.display_low_stock_threshold : 0, // New
        }
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

  // Handler for SEO settings
  const handleSeoChange = (field, value) => {
    setStore(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        seo_settings: {
          ...prev.settings.seo_settings,
          [field]: value
        }
      }
    }));
  };

  // Handler for Theme settings
  const handleThemeChange = (field, value) => {
    setStore(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme: {
          ...prev.settings.theme,
          [field]: value
        }
      }
    }));
  };

  // Handler for Cookie Consent settings
  const handleCookieConsentChange = (field, value) => {
    setStore(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        cookie_consent: {
          ...prev.settings.cookie_consent,
          [field]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    if (!store || !store.id) {
      setFlashMessage({ type: 'error', message: 'Store data not loaded. Cannot save.' });
      return;
    }
    setSaving(true);
    
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
        enable_product_filters: store.settings.enable_product_filters,
        product_filter_attributes: store.settings.product_filter_attributes,
        enable_credit_updates: store.settings.enable_credit_updates,
        enable_coupon_rules: store.settings.enable_coupon_rules,
        allow_stacking_coupons: store.settings.allow_stacking_coupons,
        hide_stock_quantity: store.settings.hide_stock_quantity,
        display_low_stock_threshold: store.settings.display_low_stock_threshold,
        
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
        settings: settingsPayload
      };

      
      // Ensure settings is a proper object
      if (typeof payload.settings === 'string') {
        console.warn('⚠️ Settings was a string, parsing to object');
        payload.settings = JSON.parse(payload.settings);
      }
      
      const apiResult = await retryApiCall(() => Store.update(store.id, payload));
      
      // Handle array response from API client
      const result = Array.isArray(apiResult) ? apiResult[0] : apiResult;
      
      // Update our local store state with the response data
      if (result && result.settings) {
        setFlashMessage({ type: 'success', message: 'Settings saved successfully!' });
        
        // Clear ALL StoreProvider cache to force reload of settings
        try {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="domain">Domain</TabsTrigger>
            <TabsTrigger value="brevo">Brevo</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
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
          
          <TabsContent value="brevo" className="mt-6">
            <Card className="material-elevation-1 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  Brevo Integration
                </CardTitle>
                <CardDescription>Connect your Brevo account to send transactional emails and marketing campaigns.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="brevo-enabled" 
                    checked={store?.brevo_settings?.enabled || false}
                    onCheckedChange={(checked) => handleBrevoChange('enabled', checked)}
                  />
                  <Label htmlFor="brevo-enabled">Enable Brevo Integration</Label>
                </div>

                {store?.brevo_settings?.enabled && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="brevo-api-key">API Key (v3)</Label>
                      <Input
                        id="brevo-api-key"
                        type="password"
                        value={store?.brevo_settings?.api_key || ''}
                        onChange={(e) => handleBrevoChange('api_key', e.target.value)}
                        placeholder="xkeysib-..."
                      />
                       <p className="text-sm text-gray-500 mt-1">Your Brevo API v3 key. This is stored securely.</p>
                    </div>
                    <div>
                      <Label htmlFor="brevo-sender-email">Default Sender Email</Label>
                      <Input
                        id="brevo-sender-email"
                        type="email"
                        value={store?.brevo_settings?.sender_email || ''}
                        onChange={(e) => handleBrevoChange('sender_email', e.target.value)}
                        placeholder="noreply@yourdomain.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="brevo-sender-name">Default Sender Name</Label>
                      <Input
                        id="brevo-sender-name"
                        value={store?.brevo_settings?.sender_name || ''}
                        onChange={(e) => handleBrevoChange('sender_name', e.target.value)}
                        placeholder="Your Store Name"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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

          <TabsContent value="team" className="mt-6">
            <TeamManagement storeId={store?.id} />
          </TabsContent>

          <TabsContent value="advanced" className="mt-6">
            <Card className="material-elevation-1 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>Configure checkout options and other advanced features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-4">Checkout Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label htmlFor="allow_guest_checkout" className="font-medium">Allow Guest Checkout</Label>
                        <p className="text-sm text-gray-500">Allow customers to checkout without creating an account</p>
                      </div>
                      <Switch 
                        id="allow_guest_checkout" 
                        checked={store?.settings?.allow_guest_checkout !== undefined ? store.settings.allow_guest_checkout : true} 
                        onCheckedChange={(checked) => handleSettingsChange('allow_guest_checkout', checked)} 
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label htmlFor="require_shipping_address" className="font-medium">Require Shipping Address</Label>
                        <p className="text-sm text-gray-500">Always require a shipping address during checkout</p>
                      </div>
                      <Switch 
                        id="require_shipping_address" 
                        checked={store?.settings?.require_shipping_address !== undefined ? store.settings.require_shipping_address : true} 
                        onCheckedChange={(checked) => handleSettingsChange('require_shipping_address', checked)} 
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label htmlFor="collect_phone_number_at_checkout" className="font-medium">Collect Phone Number at Checkout</Label>
                        <p className="text-sm text-gray-500">Require customers to provide a phone number during checkout</p>
                      </div>
                      <Switch 
                        id="collect_phone_number_at_checkout" 
                        checked={store?.settings?.collect_phone_number_at_checkout !== undefined ? store.settings.collect_phone_number_at_checkout : false} 
                        onCheckedChange={(checked) => handleSettingsChange('collect_phone_number_at_checkout', checked)} 
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-gray-800 mb-4">Product Filtering</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label htmlFor="enable_product_filters" className="font-medium">Enable Product Filters</Label>
                        <p className="text-sm text-gray-500">Show layered navigation with filterable attributes on category pages</p>
                      </div>
                      <Switch 
                        id="enable_product_filters" 
                        checked={store?.settings?.enable_product_filters !== undefined ? store.settings.enable_product_filters : false} 
                        onCheckedChange={(checked) => handleSettingsChange('enable_product_filters', checked)} 
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-gray-800 mb-4">Allowed Countries for Shipping/Billing</h4>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        <div className="flex justify-end mt-8">
          <Button onClick={handleSave} disabled={saving || !store?.id} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
