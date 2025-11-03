import React, { useState, useEffect } from 'react';
import { Store } from '@/api/entities';
import { User } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import { clearStorefrontCache } from '@/utils/cacheUtils';
import FlashMessage from '@/components/storefront/FlashMessage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Bot,
  Shield,
  Upload,
  Download,
  Settings,
  Eye,
  TrendingUp,
  Code,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Activity,
  RotateCcw
} from 'lucide-react';
import SaveButton from '@/components/ui/save-button';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';


export default function AnalyticsSettings() {
    const { selectedStore, getSelectedStoreId } = useStoreSelection();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [flashMessage, setFlashMessage] = useState(null);
    
    // New state for advanced analytics features
    const [dataLayerEvents, setDataLayerEvents] = useState([]);
    const [gtmSettings, setGtmSettings] = useState({
        container_id: '',
        enabled: false,
        auto_track_page_views: true,
        auto_track_ecommerce: true,
        custom_events: []
    });
    
    // Auto-refresh state for live events
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(5); // seconds
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [previousEventCount, setPreviousEventCount] = useState(0);
    const [newEventsCount, setNewEventsCount] = useState(0);
    const [importData, setImportData] = useState('');
    const [exportFormat, setExportFormat] = useState('json');

    useEffect(() => {
        const loadStore = async () => {
            try {
                if (!selectedStore) {
                    setLoading(false);
                    return;
                }
                
                // Fetch complete store data with settings from API
                const fullStoreData = await Store.findById(selectedStore.id);
                
                // Handle the case where findById returns an array
                const storeData = Array.isArray(fullStoreData) ? fullStoreData[0] : fullStoreData;
                
                setStore({
                    ...selectedStore,
                    ...storeData, // Include all data from API
                    settings: {
                        ...(storeData?.settings || {}),
                        analytics_settings: {
                            enable_google_tag_manager: false,
                            gtm_script_type: 'default', // 'default' or 'custom'
                            gtm_id: '',
                            google_ads_id: '',
                            custom_gtm_script: '',
                            ...(storeData?.settings?.analytics_settings || {})
                        }
                    }
                });
                
                // Load advanced GTM settings
                const analytics = storeData?.settings?.analytics || {};
                setGtmSettings({
                    container_id: analytics.gtm_container_id || storeData?.settings?.analytics_settings?.gtm_id || '',
                    enabled: analytics.gtm_enabled || storeData?.settings?.analytics_settings?.enable_google_tag_manager || false,
                    auto_track_page_views: analytics.auto_track_page_views !== false,
                    auto_track_ecommerce: analytics.auto_track_ecommerce !== false,
                    custom_events: analytics.custom_events || []
                });
                
                // Load dataLayer events
                loadDataLayerEvents();
                
            } catch (error) {
                console.error("Failed to load store:", error);
                setFlashMessage({ type: 'error', message: 'Could not load store settings.' });
            } finally {
                setLoading(false);
            }
        };
        if (selectedStore) {
            loadStore();
        }
    }, [selectedStore]);

    // Auto-refresh effect for live events
    useEffect(() => {
        let intervalId;
        
        if (autoRefresh && selectedStore) {
            intervalId = setInterval(() => {
                loadDataLayerEvents();
                setLastRefresh(new Date());
            }, refreshInterval * 1000);
        }
        
        return () => {
            if (intervalId) {
                console.log('🛑 Clearing auto-refresh interval');
                clearInterval(intervalId);
            }
        };
    }, [autoRefresh, refreshInterval, selectedStore]);

    const handleAnalyticsChange = (key, value) => {
        setStore(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                analytics_settings: {
                    ...prev.settings.analytics_settings,
                    [key]: value
                }
            }
        }));

        // Also sync with gtmSettings state for save handler
        if (key === 'enable_google_tag_manager') {
            setGtmSettings(prev => ({ ...prev, enabled: value }));
        } else if (key === 'gtm_id') {
            setGtmSettings(prev => ({ ...prev, container_id: value }));
        }
    };

    const handleSave = async () => {
        const storeId = getSelectedStoreId();
        if (!storeId || !store) return;
        setSaving(true);
        setSaveSuccess(false);
        try {
            // Merge both old and new analytics settings
            const updatedSettings = {
                ...store.settings,
                analytics: {
                    gtm_container_id: gtmSettings.container_id,
                    gtm_enabled: gtmSettings.enabled,
                    auto_track_page_views: gtmSettings.auto_track_page_views,
                    auto_track_ecommerce: gtmSettings.auto_track_ecommerce,
                    custom_events: gtmSettings.custom_events
                },
                analytics_settings: {
                    ...store.settings.analytics_settings,
                    gtm_id: gtmSettings.container_id,
                    enable_google_tag_manager: gtmSettings.enabled
                }
            };

            await Store.update(storeId, { settings: updatedSettings });

            // Update local state to avoid reload
            setStore(prev => ({
                ...prev,
                settings: updatedSettings
            }));

            // Reload GTM if enabled
            if (gtmSettings.enabled && gtmSettings.container_id) {
                loadGTMScript();
            }

            // Clear all cache for instant updates
            try {
                localStorage.removeItem('storeProviderCache');
                sessionStorage.removeItem('storeProviderCache');
            } catch (e) {
                console.warn('Failed to clear cache:', e);
            }

            setFlashMessage({ type: 'success', message: 'Analytics settings saved successfully!' });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error("Failed to save settings:", error);
            setFlashMessage({ type: 'error', message: 'Failed to save settings.' });
        } finally {
            setSaving(false);
        }
    };
    
    // Advanced analytics functions
    const loadDataLayerEvents = async () => {
        // Get recent dataLayer events from window.dataLayer
        const browserEvents = [];
        if (typeof window !== 'undefined' && window.dataLayer) {
            const recentEvents = window.dataLayer.slice(-50); // Last 50 events
            browserEvents.push(...recentEvents.map(event => ({
                ...event,
                source: 'browser',
                timestamp: event.timestamp || event['gtm.start'] || new Date().toISOString()
            })));
            // Debug browser event timestamps
            if (recentEvents.length > 0) {
                const sampledEvents = recentEvents.slice(-3).map(e => ({
                    event: e.event || 'unknown',
                    timestamp: e.timestamp,
                    gtmStart: e['gtm.start'],
                    formatted: (() => {
                        const ts = e.timestamp || e['gtm.start'];
                        if (!ts) return 'No timestamp';
                        try {
                            const date = new Date(ts);
                            return isNaN(date.getTime()) ? 'Invalid timestamp' : date.toLocaleString();
                        } catch (error) {
                            return 'Invalid timestamp';
                        }
                    })()
                }));
            }
        } else {
            console.warn('📊 No window.dataLayer found');
        }
        
        // Get customer activities from database
        try {
            if (selectedStore?.id) {
                const apiUrl = `/api/customer-activity?store_id=${selectedStore.id}&limit=50`;
                
                const response = await fetch(apiUrl);
                
                if (response.ok) {
                    const responseData = await response.json();
                    
                    // Handle the API response structure
                    const databaseEvents = responseData.success && responseData.data?.activities 
                        ? responseData.data.activities 
                        : (Array.isArray(responseData) ? responseData : []);

                    const formattedDbEvents = databaseEvents.map(activity => ({
                        event: activity.activity_type,
                        source: 'database',
                        timestamp: activity.created_at || activity.createdAt || activity.updatedAt || new Date().toISOString(),
                        store_id: activity.store_id,
                        session_id: activity.session_id,
                        user_id: activity.user_id,
                        page_url: activity.page_url,
                        product_id: activity.product_id,
                        search_query: activity.search_query,
                        user_agent: activity.user_agent,
                        ip_address: activity.ip_address,
                        metadata: activity.metadata,
                        // Include the full activity record for debugging
                        _raw: activity
                    }));
                    browserEvents.push(...formattedDbEvents);

                } else {
                    const errorText = await response.text();
                    console.warn('Failed to fetch customer activities:', response.status, response.statusText, errorText);
                }
            } else {
                console.warn('🚫 No selected store ID available');
            }
        } catch (error) {
            console.warn('Could not load customer activities:', error);
        }
        
        // Sort all events by timestamp (safely handle invalid dates)
        browserEvents.sort((a, b) => {
            const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
            const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
            
            // Handle invalid dates by treating them as very old
            const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
            const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
            
            return timeB - timeA; // Sort newest first
        });
        
        // Track new events if auto-refresh is enabled
        if (autoRefresh && previousEventCount > 0) {
            const newCount = browserEvents.length - previousEventCount;
            if (newCount > 0) {
                setNewEventsCount(prev => prev + newCount);
                
                // Clear the new events counter after 3 seconds
                setTimeout(() => {
                    setNewEventsCount(0);
                }, 3000);
            }
        }
        
        setPreviousEventCount(browserEvents.length);
        setDataLayerEvents(browserEvents);
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
                setFlashMessage({ type: 'success', message: `Successfully imported ${data.length} dataLayer events` });
            } else if (data.tags || data.triggers || data.variables) {
                // GTM container export format
                setFlashMessage({ type: 'success', message: 'GTM container format detected. Use this data to import into Google Tag Manager directly.' });
            }
            
            setImportData('');
        } catch (error) {
            setFlashMessage({ type: 'error', message: 'Invalid JSON format. Please check your import data.' });
        }
    };

    const exportDataLayer = () => {
        const exportData = {
            store_id: selectedStore?.id,
            store_name: selectedStore?.name,
            export_date: new Date().toISOString(),
            gtm_settings: gtmSettings,
            legacy_settings: store?.settings?.analytics_settings,
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
            setFlashMessage({ type: 'success', message: 'Test event pushed to dataLayer successfully!' });
        }
    };
    

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    if (!store) {
        return <div className="p-8">Could not load store configuration.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Analytics & Data Layer</h1>
                <p className="text-gray-600 mt-1">Manage Google Tag Manager integration, track customer behavior, and export analytics data.</p>
            </div>

            <Tabs defaultValue="basic" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        GTM
                    </TabsTrigger>
                    <TabsTrigger value="datalayer" className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Live Events
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

                {/* GTM Tab with Two Cards */}
                <TabsContent value="basic" className="space-y-6">
                    {/* Google Tag Manager Card */}
                    <Card className="material-elevation-1 border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Code className="w-5 h-5" /> 
                                Google Tag Manager
                            </CardTitle>
                            <CardDescription>
                                Configure your Google Tag Manager container and tracking options.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* GTM Enable Toggle */}
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                                <div>
                                    <Label htmlFor="enable_gtm" className="text-base font-medium">Enable Google Tag Manager</Label>
                                    <p className="text-sm text-gray-500 mt-1">Track analytics and marketing tags through GTM</p>
                                </div>
                                <Switch 
                                    id="enable_gtm" 
                                    checked={!!store.settings.analytics_settings.enable_google_tag_manager} 
                                    onCheckedChange={(c) => handleAnalyticsChange('enable_google_tag_manager', c)} 
                                />
                            </div>

                            {store.settings.analytics_settings.enable_google_tag_manager && (
                                <div className="space-y-6">
                                    {/* Implementation Type */}
                                    <div>
                                        <Label className="text-base font-medium">Implementation Type</Label>
                                        <RadioGroup
                                            value={store.settings.analytics_settings.gtm_script_type || 'default'}
                                            onValueChange={(value) => handleAnalyticsChange('gtm_script_type', value)}
                                            className="mt-3"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="default" id="gtm_default" />
                                                <Label htmlFor="gtm_default" className="cursor-pointer font-medium">
                                                    Default Google Tag Manager
                                                </Label>
                                            </div>
                                            <p className="text-sm text-gray-500 ml-6">Standard GTM implementation using Google's servers</p>

                                            <div className="flex items-center space-x-2 mt-3">
                                                <RadioGroupItem value="custom" id="gtm_custom" />
                                                <Label htmlFor="gtm_custom" className="cursor-pointer font-medium">
                                                    Custom GTM Script (Server-Side Tagging)
                                                </Label>
                                            </div>
                                            <p className="text-sm text-gray-500 ml-6">Custom implementation for first-party data collection</p>
                                        </RadioGroup>
                                    </div>

                                    {/* GTM Configuration */}
                                    {store.settings.analytics_settings.gtm_script_type === 'default' ? (
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="gtm_id" className="text-base font-medium">Container ID</Label>
                                                <Input
                                                    id="gtm_id"
                                                    value={store.settings.analytics_settings.gtm_id || ''}
                                                    onChange={(e) => handleAnalyticsChange('gtm_id', e.target.value)}
                                                    placeholder="GTM-XXXXXX"
                                                    className="mt-2"
                                                />
                                                <p className="text-sm text-gray-500 mt-2">Enter your Google Tag Manager container ID</p>
                                            </div>

                                            <div className="p-4 bg-blue-50 rounded-lg">
                                                <p className="font-medium text-blue-900 mb-2">📍 How GTM is implemented:</p>
                                                <ul className="space-y-1 text-blue-800 text-sm">
                                                    <li>• <strong>Head section:</strong> JavaScript code automatically added to <code className="px-1 py-0.5 bg-blue-100 rounded">&lt;head&gt;</code></li>
                                                    <li>• <strong>Body section:</strong> <code className="px-1 py-0.5 bg-blue-100 rounded">&lt;noscript&gt;</code> fallback added after <code className="px-1 py-0.5 bg-blue-100 rounded">&lt;body&gt;</code></li>
                                                    <li>• <strong>Automatic:</strong> No manual code placement required</li>
                                                </ul>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="gtm_id_custom" className="text-base font-medium">Container ID</Label>
                                                <Input
                                                    id="gtm_id_custom"
                                                    value={store.settings.analytics_settings.gtm_id || ''}
                                                    onChange={(e) => handleAnalyticsChange('gtm_id', e.target.value)}
                                                    placeholder="GTM-XXXXXX"
                                                    className="mt-2"
                                                />
                                                <p className="text-sm text-gray-500 mt-2">Required for noscript tag generation</p>
                                            </div>
                                            
                                            <div>
                                                <Label htmlFor="custom_gtm_script" className="text-base font-medium">Custom GTM Script</Label>
                                                <Textarea
                                                    id="custom_gtm_script"
                                                    value={store.settings.analytics_settings.custom_gtm_script || ''}
                                                    onChange={(e) => handleAnalyticsChange('custom_gtm_script', e.target.value)}
                                                    placeholder="<!-- Google Tag Manager -->\n<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\nnew Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\nj=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n'https://your-server.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n})(window,document,'script','dataLayer','GTM-XXXXXX');</script>\n<!-- End Google Tag Manager -->"
                                                    rows={8}
                                                    className="font-mono text-sm mt-2"
                                                />
                                                <p className="text-sm text-gray-500 mt-2">
                                                    Complete GTM script for server-side tagging. Replace the endpoint with your server-side tagging URL.
                                                </p>
                                            </div>

                                            <div className="p-4 bg-green-50 rounded-lg">
                                                <p className="font-medium text-green-900 mb-2">✅ Custom GTM Implementation:</p>
                                                <ul className="space-y-1 text-green-800 text-sm">
                                                    <li>• <strong>Head script:</strong> Your custom script placed in <code className="px-1 py-0.5 bg-green-100 rounded">&lt;head&gt;</code></li>
                                                    <li>• <strong>Noscript tags:</strong> Auto-generated when Container ID is provided</li>
                                                    <li>• <strong>Automatic:</strong> Both head and body implementations handled automatically</li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tracking Options */}
                                    <div className="border-t pt-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Tracking Options</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <Label htmlFor="auto-page-views" className="font-medium">Auto-track Page Views</Label>
                                                    <p className="text-sm text-gray-500">Automatically track all page visits</p>
                                                </div>
                                                <Switch
                                                    id="auto-page-views"
                                                    checked={gtmSettings.auto_track_page_views}
                                                    onCheckedChange={(auto_track_page_views) => setGtmSettings(prev => ({ ...prev, auto_track_page_views }))}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <Label htmlFor="auto-ecommerce" className="font-medium">Auto-track E-commerce Events</Label>
                                                    <p className="text-sm text-gray-500">Track cart and purchase events</p>
                                                </div>
                                                <Switch
                                                    id="auto-ecommerce"
                                                    checked={gtmSettings.auto_track_ecommerce}
                                                    onCheckedChange={(auto_track_ecommerce) => setGtmSettings(prev => ({ ...prev, auto_track_ecommerce }))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Test Button */}
                                    <div className="flex justify-end pt-4 border-t">
                                        <Button variant="outline" onClick={testDataLayerPush} className="flex items-center gap-2">
                                            <Activity className="w-4 h-4" />
                                            Test Datalayer
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Google Ads Card */}
                    <Card className="material-elevation-1 border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" /> 
                                Google Ads
                            </CardTitle>
                            <CardDescription>
                                Set up Google Ads conversion tracking and remarketing.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="google_ads_id" className="text-base font-medium">Google Ads ID</Label>
                                <Input 
                                    id="google_ads_id" 
                                    value={store.settings.analytics_settings.google_ads_id || ''} 
                                    onChange={(e) => handleAnalyticsChange('google_ads_id', e.target.value)} 
                                    placeholder="AW-XXXXXXXXX"
                                    className="mt-2"
                                />
                                <p className="text-sm text-gray-500 mt-2">Enter your Google Ads conversion ID for tracking and remarketing</p>
                            </div>
                            
                            {store.settings.analytics_settings.google_ads_id && (
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <p className="font-medium text-green-900 mb-2">✅ Google Ads Implementation:</p>
                                    <ul className="space-y-1 text-green-800 text-sm">
                                        <li>• <strong>gtag.js library:</strong> Automatically loaded in <code className="px-1 py-0.5 bg-green-100 rounded">&lt;head&gt;</code></li>
                                        <li>• <strong>Configuration script:</strong> Auto-configured with your Ads ID</li>
                                        <li>• <strong>GTM compatible:</strong> Works alongside Google Tag Manager</li>
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* DataLayer Monitor */}
                <TabsContent value="datalayer" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span>All Analytics Events ({dataLayerEvents.length})</span>
                                    {newEventsCount > 0 && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 animate-pulse">
                                            +{newEventsCount} new
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={autoRefresh}
                                            onCheckedChange={setAutoRefresh}
                                            id="auto-refresh"
                                        />
                                        <Label htmlFor="auto-refresh" className="text-sm whitespace-nowrap">
                                            Auto-refresh
                                        </Label>
                                    </div>
                                    {autoRefresh && (
                                        <select
                                            value={refreshInterval}
                                            onChange={(e) => setRefreshInterval(Number(e.target.value))}
                                            className="text-xs border rounded px-2 py-1"
                                        >
                                            <option value={2}>2s</option>
                                            <option value={5}>5s</option>
                                            <option value={10}>10s</option>
                                            <option value={30}>30s</option>
                                        </select>
                                    )}
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={loadDataLayerEvents}
                                        disabled={autoRefresh}
                                    >
                                        {autoRefresh ? 'Auto-refreshing...' : 'Refresh'}
                                    </Button>
                                </div>
                            </CardTitle>
                            {autoRefresh && (
                                <CardDescription className="text-xs text-green-600 flex items-center gap-1">
                                    <RotateCcw className="w-3 h-3 animate-spin" />
                                    Live updates enabled • Last refresh: {lastRefresh.toLocaleTimeString()}
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {dataLayerEvents.length > 0 ? (
                                    dataLayerEvents.map((event, index) => (
                                        <div key={index} className="p-3 border rounded-lg bg-gray-50">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">{event.event || 'Unknown Event'}</Badge>
                                                    <Badge 
                                                        variant={event.source === 'browser' ? 'default' : 'secondary'}
                                                        className={event.source === 'browser' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                                                    >
                                                        {event.source === 'browser' ? '🌐 Browser' : '💾 Database'}
                                                    </Badge>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {(() => {
                                                        if (!event.timestamp) return 'No timestamp';
                                                        try {
                                                            const date = new Date(event.timestamp);
                                                            if (isNaN(date.getTime())) return 'Invalid timestamp';
                                                            return date.toLocaleString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                second: '2-digit'
                                                            });
                                                        } catch (e) {
                                                            return 'Invalid timestamp';
                                                        }
                                                    })()}
                                                </span>
                                            </div>
                                            <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                                                {JSON.stringify(event, null, 2)}
                                            </pre>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No events recorded yet</p>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Visit your storefront to generate tracking events
                                        </p>
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

            <div className="flex justify-end mt-8">
                <SaveButton
                    onClick={handleSave}
                    loading={saving}
                    success={saveSuccess}
                    defaultText="Save All Settings"
                />
            </div>
        </div>
    );
}