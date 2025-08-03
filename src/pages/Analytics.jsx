import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  BarChart, 
  Download, 
  Upload, 
  Settings, 
  Eye,
  TrendingUp,
  Code,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Activity
} from 'lucide-react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import { Store } from '@/api/entities';

export default function Analytics() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [loading, setLoading] = useState(false);
  const [dataLayerEvents, setDataLayerEvents] = useState([]);
  const [gtmSettings, setGtmSettings] = useState({
    container_id: '',
    enabled: false,
    auto_track_page_views: true,
    auto_track_ecommerce: true,
    custom_events: []
  });
  const [importData, setImportData] = useState('');
  const [exportFormat, setExportFormat] = useState('json');

  useEffect(() => {
    if (selectedStore) {
      loadStoreSettings();
      loadDataLayerEvents();
    }
  }, [selectedStore]);

  const loadStoreSettings = async () => {
    try {
      if (!selectedStore?.id) return;
      
      const storeData = await Store.findById(selectedStore.id);
      const analytics = storeData?.settings?.analytics || {};
      
      setGtmSettings({
        container_id: analytics.gtm_container_id || '',
        enabled: analytics.gtm_enabled || false,
        auto_track_page_views: analytics.auto_track_page_views !== false,
        auto_track_ecommerce: analytics.auto_track_ecommerce !== false,
        custom_events: analytics.custom_events || []
      });
    } catch (error) {
      console.error('Error loading store settings:', error);
    }
  };

  const loadDataLayerEvents = () => {
    // Get recent dataLayer events from window.dataLayer
    if (typeof window !== 'undefined' && window.dataLayer) {
      const recentEvents = window.dataLayer.slice(-50); // Last 50 events
      setDataLayerEvents(recentEvents);
    }
  };

  const saveGTMSettings = async () => {
    try {
      setLoading(true);
      
      if (!selectedStore?.id) return;
      
      const updatedSettings = {
        ...selectedStore.settings,
        analytics: {
          gtm_container_id: gtmSettings.container_id,
          gtm_enabled: gtmSettings.enabled,
          auto_track_page_views: gtmSettings.auto_track_page_views,
          auto_track_ecommerce: gtmSettings.auto_track_ecommerce,
          custom_events: gtmSettings.custom_events
        }
      };

      await Store.update(selectedStore.id, { settings: updatedSettings });
      
      // Reload GTM if enabled
      if (gtmSettings.enabled && gtmSettings.container_id) {
        loadGTMScript();
      }
      
      alert('Google Tag Manager settings saved successfully!');
    } catch (error) {
      console.error('Error saving GTM settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const loadGTMScript = () => {
    if (!gtmSettings.container_id) return;
    
    // Remove existing GTM script if any
    const existingScript = document.querySelector('script[src*="googletagmanager.com/gtm.js"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new GTM script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmSettings.container_id}`;
    document.head.appendChild(script);

    // Initialize dataLayer if not exists
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });
  };

  const importDataLayer = () => {
    try {
      const data = JSON.parse(importData);
      
      if (Array.isArray(data)) {
        // Import as dataLayer events
        data.forEach(event => {
          if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push(event);
          }
        });
        setDataLayerEvents(prev => [...prev, ...data]);
        alert(`Successfully imported ${data.length} dataLayer events`);
      } else if (data.tags || data.triggers || data.variables) {
        // GTM container export format
        alert('GTM container format detected. Use this data to import into Google Tag Manager directly.');
      }
      
      setImportData('');
    } catch (error) {
      alert('Invalid JSON format. Please check your import data.');
    }
  };

  const exportDataLayer = () => {
    const exportData = {
      store_id: selectedStore?.id,
      store_name: selectedStore?.name,
      export_date: new Date().toISOString(),
      gtm_settings: gtmSettings,
      dataLayer_events: dataLayerEvents,
      suggested_gtm_tags: [
        {
          name: 'Page View - Enhanced',
          type: 'gtag',
          trigger: 'Page View',
          config: {
            page_title: '{{Page Title}}',
            page_location: '{{Page URL}}',
            store_name: selectedStore?.name
          }
        },
        {
          name: 'Add to Cart',
          type: 'gtag',
          trigger: 'Custom Event - cart_add',
          config: {
            event_category: 'ecommerce',
            event_label: '{{Product Name}}'
          }
        },
        {
          name: 'Purchase',
          type: 'gtag',
          trigger: 'Custom Event - purchase',
          config: {
            event_category: 'ecommerce',
            transaction_id: '{{Order ID}}',
            value: '{{Order Total}}'
          }
        }
      ]
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalyst-analytics-export-${selectedStore?.name || 'store'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addCustomEvent = () => {
    const eventName = prompt('Enter custom event name:');
    if (eventName) {
      setGtmSettings(prev => ({
        ...prev,
        custom_events: [...prev.custom_events, {
          name: eventName,
          description: '',
          parameters: {}
        }]
      }));
    }
  };

  const removeCustomEvent = (index) => {
    setGtmSettings(prev => ({
      ...prev,
      custom_events: prev.custom_events.filter((_, i) => i !== index)
    }));
  };

  const testDataLayerPush = () => {
    const testEvent = {
      event: 'test_event',
      timestamp: new Date().toISOString(),
      test_data: 'This is a test event from Catalyst Analytics',
      store_id: selectedStore?.id
    };

    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push(testEvent);
      setDataLayerEvents(prev => [...prev, testEvent]);
      alert('Test event pushed to dataLayer successfully!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Data Layer</h1>
          <p className="text-gray-600 mt-1">Manage Google Tag Manager integration and track customer behavior</p>
        </div>
      </div>

      <Tabs defaultValue="gtm" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gtm" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            GTM Setup
          </TabsTrigger>
          <TabsTrigger value="datalayer" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            DataLayer
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </TabsTrigger>
        </TabsList>

        {/* GTM Configuration */}
        <TabsContent value="gtm" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Google Tag Manager Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="gtm-enabled"
                  checked={gtmSettings.enabled}
                  onCheckedChange={(enabled) => setGtmSettings(prev => ({ ...prev, enabled }))}
                />
                <Label htmlFor="gtm-enabled">Enable Google Tag Manager</Label>
              </div>

              <div>
                <Label htmlFor="container-id">GTM Container ID</Label>
                <Input
                  id="container-id"
                  placeholder="GTM-XXXXXXX"
                  value={gtmSettings.container_id}
                  onChange={(e) => setGtmSettings(prev => ({ ...prev, container_id: e.target.value }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Find your Container ID in Google Tag Manager dashboard
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-page-views"
                    checked={gtmSettings.auto_track_page_views}
                    onCheckedChange={(auto_track_page_views) => setGtmSettings(prev => ({ ...prev, auto_track_page_views }))}
                  />
                  <Label htmlFor="auto-page-views">Auto-track Page Views</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-ecommerce"
                    checked={gtmSettings.auto_track_ecommerce}
                    onCheckedChange={(auto_track_ecommerce) => setGtmSettings(prev => ({ ...prev, auto_track_ecommerce }))}
                  />
                  <Label htmlFor="auto-ecommerce">Auto-track E-commerce Events</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={testDataLayerPush}>
                  Test DataLayer
                </Button>
                <Button onClick={saveGTMSettings} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Custom Events */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gtmSettings.custom_events.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{event.name}</p>
                      <p className="text-sm text-gray-600">{event.description || 'No description'}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => removeCustomEvent(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
                
                <Button variant="outline" onClick={addCustomEvent} className="w-full">
                  Add Custom Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DataLayer Monitor */}
        <TabsContent value="datalayer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>DataLayer Events ({dataLayerEvents.length})</span>
                <Button variant="outline" size="sm" onClick={loadDataLayerEvents}>
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dataLayerEvents.length > 0 ? (
                  dataLayerEvents.slice().reverse().map((event, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{event.event || 'Unknown Event'}</Badge>
                        <span className="text-xs text-gray-500">{event.timestamp || 'No timestamp'}</span>
                      </div>
                      <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                        {JSON.stringify(event, null, 2)}
                      </pre>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No dataLayer events recorded yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import DataLayer Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="import-data">JSON Data</Label>
                <Textarea
                  id="import-data"
                  placeholder="Paste your JSON data here..."
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={10}
                />
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You can import dataLayer events as JSON array or GTM container export data.
                </AlertDescription>
              </Alert>

              <Button onClick={importDataLayer} disabled={!importData.trim()}>
                Import Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Analytics Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Export your current dataLayer events, GTM settings, and suggested tag configurations for use in Google Tag Manager.
              </p>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  The export includes ready-to-use GTM tag configurations for common e-commerce events.
                </AlertDescription>
              </Alert>

              <Button onClick={exportDataLayer} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Analytics Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}