import React, { useState, useEffect } from 'react';
import { Store } from '@/api/entities';
import { User } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
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
  const { selectedStore, getSelectedStoreId, refreshStores } = useStoreSelection();
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
        hide_stock_quantity: storeSettings.hasOwnProperty('hide_stock_quantity') ? storeSettings.hide_stock_quantity : false,
        display_low_stock_threshold: storeSettings.hasOwnProperty('display_low_stock_threshold') ? storeSettings.display_low_stock_threshold : 0,
        in_stock_label: storeSettings.stock_settings?.in_stock_label || 'In Stock',
        out_of_stock_label: storeSettings.stock_settings?.out_of_stock_label || 'Out of Stock',
        low_stock_label: storeSettings.stock_settings?.low_stock_label || 'Low stock, just {quantity} left',
        show_stock_label: storeSettings.stock_settings?.show_stock_label !== undefined ? storeSettings.stock_settings.show_stock_label : true
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
          hide_stock_quantity: settings.hide_stock_quantity,
          display_low_stock_threshold: settings.display_low_stock_threshold,
          stock_settings: {
            in_stock_label: settings.in_stock_label || 'In Stock',
            out_of_stock_label: settings.out_of_stock_label || 'Out of Stock',
            low_stock_label: settings.low_stock_label || 'Low stock, just {quantity} left',
            show_stock_label: settings.show_stock_label !== undefined ? settings.show_stock_label : true
          }
        }
      };

      const result = await retryApiCall(() => Store.update(storeId, payload));
      
      // Clear any potential cache
      try {
        localStorage.removeItem('storeProviderCache');
        sessionStorage.removeItem('storeProviderCache');
      } catch (e) {
        console.warn('Failed to clear cache:', e);
      }
      
      setFlashMessage({ type: 'success', message: 'Stock settings saved successfully!' });
      
      await delay(2000); // Increased delay to ensure backend processing
      
      // Refresh the store context to get updated settings
      await refreshStores();
      await loadStore();
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      setFlashMessage({ type: 'error', message: `Failed to save settings: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) {
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
                      Text to display when a product is in stock. Use <code>{'{quantity}'}</code> to show the stock amount.
                    </p>
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
                  </div>
                  <div>
                    <Label htmlFor="low_stock_label">"Low Stock" Label</Label>
                    <Input
                      id="low_stock_label"
                      value={settings.low_stock_label}
                      onChange={(e) => handleSettingsChange('low_stock_label', e.target.value)}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Text for low stock warning. Use <code>{'{quantity}'}</code> to show the remaining stock.
                    </p>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-8">
          <Button onClick={handleSave} disabled={saving || !settings?.id} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Stock Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}