import React, { useState, useEffect } from 'react';
import { Store } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { clearStorefrontCache } from '@/utils/cacheUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save } from 'lucide-react';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryApiCall = async (apiCall, maxRetries = 5, baseDelay = 3000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await delay(Math.random() * 1000 + 500);
      return await apiCall();
    } catch (error) {
      const isRateLimit = error.response?.status === 429 ||
                         error.message?.includes('Rate limit') ||
                         error.message?.includes('429');

      if (isRateLimit && i < maxRetries - 1) {
        const delayTime = baseDelay * Math.pow(2, i) + Math.random() * 2000;
        console.warn(`StockSettings: Rate limit hit, retrying in ${delayTime.toFixed(0)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await delay(delayTime);
        continue;
      }
      throw error;
    }
  }
};

export default function StockSettings() {
  const { selectedStore, getSelectedStoreId, refreshStores, loading: storeLoading } = useStoreSelection();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);

  useEffect(() => {
    if (selectedStore) {
      loadStore();
    }
  }, [selectedStore]);

  useEffect(() => {
    if (flashMessage) {
      const timer = setTimeout(() => {
        setFlashMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [flashMessage]);

  const loadStore = async () => {
    try {
      setLoading(true);
      
      if (!selectedStore) {
        setSettings(null);
        setLoading(false);
        return;
      }
      
      const storeSettings = selectedStore.settings || {};
      

      setSettings({
        id: selectedStore.id,
        name: selectedStore.name,
        enable_inventory: storeSettings.hasOwnProperty('enable_inventory') ? storeSettings.enable_inventory : true,
        display_out_of_stock: storeSettings.hasOwnProperty('display_out_of_stock') ? storeSettings.display_out_of_stock : true,
        display_out_of_stock_variants: storeSettings.hasOwnProperty('display_out_of_stock_variants') ? storeSettings.display_out_of_stock_variants : true,
        hide_stock_quantity: storeSettings.hasOwnProperty('hide_stock_quantity') ? storeSettings.hide_stock_quantity : false,
        display_low_stock_threshold: storeSettings.hasOwnProperty('display_low_stock_threshold') ? storeSettings.display_low_stock_threshold : 0,
        in_stock_label: storeSettings.stock_settings?.in_stock_label || 'In Stock',
        out_of_stock_label: storeSettings.stock_settings?.out_of_stock_label || 'Out of Stock',
        low_stock_label: storeSettings.stock_settings?.low_stock_label || 'Low stock, {just {quantity} left}',
        show_stock_label: storeSettings.stock_settings?.show_stock_label !== undefined ? storeSettings.stock_settings.show_stock_label : true,
        // Color settings for each stock type
        in_stock_text_color: storeSettings.stock_settings?.in_stock_text_color || '#166534',
        in_stock_bg_color: storeSettings.stock_settings?.in_stock_bg_color || '#dcfce7',
        out_of_stock_text_color: storeSettings.stock_settings?.out_of_stock_text_color || '#991b1b',
        out_of_stock_bg_color: storeSettings.stock_settings?.out_of_stock_bg_color || '#fee2e2',
        low_stock_text_color: storeSettings.stock_settings?.low_stock_text_color || '#92400e',
        low_stock_bg_color: storeSettings.stock_settings?.low_stock_bg_color || '#fef3c7'
      });

    } catch (error) {
      console.error('Failed to load store:', error);
      setFlashMessage({ type: 'error', message: 'Failed to load store settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    const storeId = getSelectedStoreId();
    if (!settings || !storeId) {
      setFlashMessage({ type: 'error', message: 'Store data not loaded. Cannot save.' });
      return;
    }
    
    setSaving(true);
    
    try {
      const payload = {
        settings: {
          enable_inventory: settings.enable_inventory,
          display_out_of_stock: settings.display_out_of_stock,
          display_out_of_stock_variants: settings.display_out_of_stock_variants,
          hide_stock_quantity: settings.hide_stock_quantity,
          display_low_stock_threshold: settings.display_low_stock_threshold,
          stock_settings: {
            in_stock_label: settings.in_stock_label || 'In Stock',
            out_of_stock_label: settings.out_of_stock_label || 'Out of Stock',
            low_stock_label: settings.low_stock_label || 'Low stock, {just {quantity} left}',
            show_stock_label: settings.show_stock_label !== undefined ? settings.show_stock_label : true,
            // Save color settings
            in_stock_text_color: settings.in_stock_text_color || '#166534',
            in_stock_bg_color: settings.in_stock_bg_color || '#dcfce7',
            out_of_stock_text_color: settings.out_of_stock_text_color || '#991b1b',
            out_of_stock_bg_color: settings.out_of_stock_bg_color || '#fee2e2',
            low_stock_text_color: settings.low_stock_text_color || '#92400e',
            low_stock_bg_color: settings.low_stock_bg_color || '#fef3c7'
          }
        }
      };

      const result = await retryApiCall(() => Store.update(storeId, payload));

      // Clear all cache for instant updates
      clearStorefrontCache(storeId, ['stores', 'products']);

      // Also clear the specific store cache keys
      try {
        const cacheKeys = [`first-store`, `store-slug-${store.slug}`];
        if (window.clearCacheKeys) {
          window.clearCacheKeys(cacheKeys);
        }
      } catch (e) {
        console.warn('Failed to clear specific store cache:', e);
      }
      try {
        localStorage.removeItem('storeProviderCache');
        sessionStorage.removeItem('storeProviderCache');
        localStorage.removeItem('productCache');
        sessionStorage.removeItem('productCache');
        localStorage.setItem('forceRefreshStore', 'true');

        // Clear any manual cache clearing flags
        if (typeof window !== 'undefined' && window.clearCache) {
          window.clearCache();
        }
      } catch (e) {
        console.warn('Failed to clear cache:', e);
      }
      
      setFlashMessage({ type: 'success', message: 'Stock settings saved successfully! Reloading page...' });

      // Broadcast to all storefront tabs to clear their cache
      try {
        const channel = new BroadcastChannel('store_settings_update');
        channel.postMessage({ type: 'clear_cache', timestamp: Date.now() });
        channel.close();
      } catch (e) {
        console.warn('BroadcastChannel not supported:', e);
      }

      await delay(1000);

      // Force page reload to ensure all caches are cleared
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      setFlashMessage({ type: 'error', message: `Failed to save settings: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (storeLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!selectedStore || !settings) {
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
          <h1 className="text-3xl font-bold text-gray-900">Stock Settings</h1>
          <p className="text-gray-600 mt-1">Manage global inventory and display settings.</p>
        </div>

        <div className="space-y-6">
          <Card className="material-elevation-1 border-0">
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="enable_inventory" className="font-medium">Enable Inventory Tracking</Label>
                  <p className="text-sm text-gray-500">Track stock levels and manage inventory for products</p>
                </div>
                <Switch 
                  id="enable_inventory" 
                  checked={settings.enable_inventory}
                  onCheckedChange={(checked) => handleSettingsChange('enable_inventory', checked)} 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="material-elevation-1 border-0">
            <CardHeader>
              <CardTitle>Stock Display Settings</CardTitle>
              <CardDescription>Configure how stock information appears to customers.</CardDescription>
            </CardHeader>
            <CardContent className="mt-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start justify-between p-3 border rounded-lg h-full">
                  <div>
                    <Label htmlFor="display_out_of_stock" className="font-medium">Display Out of Stock Products</Label>
                    <p className="text-sm text-gray-500 mt-1">Show products that are out of stock on category and search pages.</p>
                  </div>
                  <Switch
                    id="display_out_of_stock"
                    checked={settings.display_out_of_stock}
                    onCheckedChange={(checked) => handleSettingsChange('display_out_of_stock', checked)}
                  />
                </div>
                <div className="flex items-start justify-between p-3 border rounded-lg h-full">
                  <div>
                    <Label htmlFor="display_out_of_stock_variants" className="font-medium">Display Out-of-Stock Variants</Label>
                    <p className="text-sm text-gray-500 mt-1">Show out-of-stock variant options on configurable products (displayed with strikethrough and diagonal line).</p>
                  </div>
                  <Switch
                    id="display_out_of_stock_variants"
                    checked={settings.display_out_of_stock_variants}
                    onCheckedChange={(checked) => handleSettingsChange('display_out_of_stock_variants', checked)}
                  />
                </div>
                <div className="flex items-start justify-between p-3 border rounded-lg h-full">
                  <div>
                    <Label htmlFor="hide_stock_quantity" className="font-medium">Hide Stock Quantity</Label>
                    <p className="text-sm text-gray-500 mt-1">Hide the exact stock number from customers.</p>
                  </div>
                  <Switch
                    id="hide_stock_quantity"
                    checked={settings.hide_stock_quantity}
                    onCheckedChange={(checked) => handleSettingsChange('hide_stock_quantity', checked)}
                  />
                </div>
                 <div className="flex items-start justify-between p-3 border rounded-lg h-full">
                  <div>
                    <Label htmlFor="show_stock_label" className="font-medium">Show Stock Labels</Label>
                    <p className="text-sm text-gray-500 mt-1">Display stock status labels (e.g., "In Stock") on products.</p>
                  </div>
                  <Switch 
                    id="show_stock_label" 
                    checked={settings.show_stock_label}
                    onCheckedChange={(checked) => handleSettingsChange('show_stock_label', checked)} 
                  />
                </div>
                <div className="p-3 border rounded-lg h-full">
                  <Label htmlFor="display_low_stock_threshold">Low Stock Display Threshold</Label>
                  <Input
                    id="display_low_stock_threshold"
                    type="number"
                    value={settings.display_low_stock_threshold}
                    onChange={(e) => handleSettingsChange('display_low_stock_threshold', parseInt(e.target.value) || 0)}
                    min="0"
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">Show low stock warning when quantity falls below this number (0 to disable).</p>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="in_stock_label">"In Stock" Label</Label>
                    <Input
                      id="in_stock_label"
                      value={settings.in_stock_label}
                      onChange={(e) => handleSettingsChange('in_stock_label', e.target.value)}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Text to display when a product is in stock. Use <code>{'{quantity}'}</code> blocks for flexible formatting.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Examples: <code>In Stock {'{({quantity} available)}'}</code> → "In Stock (5 available)" | <code>Available {'{({quantity} {item})}'}</code> → "Available (1 item)"
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <Label htmlFor="in_stock_text_color" className="text-xs">Text Color</Label>
                        <Input
                          id="in_stock_text_color"
                          type="color"
                          value={settings.in_stock_text_color}
                          onChange={(e) => handleSettingsChange('in_stock_text_color', e.target.value)}
                          className="h-10 cursor-pointer"
                        />
                      </div>
                      <div>
                        <Label htmlFor="in_stock_bg_color" className="text-xs">Background Color</Label>
                        <Input
                          id="in_stock_bg_color"
                          type="color"
                          value={settings.in_stock_bg_color}
                          onChange={(e) => handleSettingsChange('in_stock_bg_color', e.target.value)}
                          className="h-10 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="out_of_stock_label">"Out of Stock" Label</Label>
                    <Input
                      id="out_of_stock_label"
                      value={settings.out_of_stock_label}
                      onChange={(e) => handleSettingsChange('out_of_stock_label', e.target.value)}
                    />
                     <p className="text-sm text-gray-500 mt-1">
                      Text to display when a product is out of stock.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <Label htmlFor="out_of_stock_text_color" className="text-xs">Text Color</Label>
                        <Input
                          id="out_of_stock_text_color"
                          type="color"
                          value={settings.out_of_stock_text_color}
                          onChange={(e) => handleSettingsChange('out_of_stock_text_color', e.target.value)}
                          className="h-10 cursor-pointer"
                        />
                      </div>
                      <div>
                        <Label htmlFor="out_of_stock_bg_color" className="text-xs">Background Color</Label>
                        <Input
                          id="out_of_stock_bg_color"
                          type="color"
                          value={settings.out_of_stock_bg_color}
                          onChange={(e) => handleSettingsChange('out_of_stock_bg_color', e.target.value)}
                          className="h-10 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="low_stock_label">"Low Stock" Label</Label>
                    <Input
                      id="low_stock_label"
                      value={settings.low_stock_label}
                      onChange={(e) => handleSettingsChange('low_stock_label', e.target.value)}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Text for low stock warning. Use <code>{'{quantity}'}</code> blocks for flexible formatting.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Examples: <code>Low stock, {'{just {quantity} left}'}</code> → "Low stock, just 2 left" | <code>Hurry! {'{Only {quantity} {piece} remaining}'}</code> → "Hurry! Only 1 piece remaining"
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <Label htmlFor="low_stock_text_color" className="text-xs">Text Color</Label>
                        <Input
                          id="low_stock_text_color"
                          type="color"
                          value={settings.low_stock_text_color}
                          onChange={(e) => handleSettingsChange('low_stock_text_color', e.target.value)}
                          className="h-10 cursor-pointer"
                        />
                      </div>
                      <div>
                        <Label htmlFor="low_stock_bg_color" className="text-xs">Background Color</Label>
                        <Input
                          id="low_stock_bg_color"
                          type="color"
                          value={settings.low_stock_bg_color}
                          onChange={(e) => handleSettingsChange('low_stock_bg_color', e.target.value)}
                          className="h-10 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
              </div>

              {/* Placeholder Help Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-blue-900 mb-3">Available Placeholders & Formatting</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-blue-800 mb-2">Block Format</h5>
                    <p className="text-blue-700 mb-2">Use <code className="bg-blue-100 px-1 rounded">{'{...}'}</code> blocks to create flexible text that can be hidden when stock quantities are hidden.</p>
                    <div className="space-y-1 text-blue-600">
                      <div><code className="bg-blue-100 px-1 rounded">{'{just {quantity} left}'}</code> → "just 5 left"</div>
                      <div><code className="bg-blue-100 px-1 rounded">{'{({quantity} available)}'}</code> → "(3 available)"</div>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-800 mb-2">Available Placeholders</h5>
                    <div className="space-y-1 text-blue-600">
                      <div><code className="bg-blue-100 px-1 rounded">{'{quantity}'}</code> - Stock number (1, 2, 5, etc.)</div>
                      <div><code className="bg-blue-100 px-1 rounded">{'{item}'}</code> - "item" or "items" (auto-plural)</div>
                      <div><code className="bg-blue-100 px-1 rounded">{'{unit}'}</code> - "unit" or "units" (auto-plural)</div>
                      <div><code className="bg-blue-100 px-1 rounded">{'{piece}'}</code> - "piece" or "pieces" (auto-plural)</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded border-l-4 border-blue-400">
                  <p className="text-blue-800 text-sm">
                    <strong>Smart Privacy:</strong> When "Hide Stock Quantity" is enabled, entire blocks containing <code>{'{quantity}'}</code> are automatically removed, leaving clean text.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-8">
          <Button onClick={handleSave} disabled={saving || !getSelectedStoreId()} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Stock Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}