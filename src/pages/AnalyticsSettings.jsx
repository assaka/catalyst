import React, { useState, useEffect } from 'react';
import { Store } from '@/api/entities';
import { User } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Save, BarChart3, Bot, Shield, Upload } from 'lucide-react';

const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiCall();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(res => setTimeout(res, delay));
        }
    }
};

export default function AnalyticsSettings() {
    const { selectedStore, getSelectedStoreId } = useStoreSelection();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [flashMessage, setFlashMessage] = useState(null);

    useEffect(() => {
        const loadStore = async () => {
            try {
                if (!selectedStore) {
                    setLoading(false);
                    return;
                }
                setStore({
                    ...selectedStore,
                    settings: {
                        ...(selectedStore.settings || {}),
                        analytics_settings: {
                            enable_google_tag_manager: false,
                            gtm_script_type: 'default', // 'default' or 'custom'
                            gtm_id: '',
                            google_ads_id: '',
                            custom_gtm_script: '',
                            ...(selectedStore.settings?.analytics_settings || {})
                        }
                    }
                });
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
    };

    const handleSave = async () => {
        const storeId = getSelectedStoreId();
        if (!storeId || !store) return;
        setSaving(true);
        try {
            await retryApiCall(() => Store.update(storeId, { settings: store.settings }));
            setFlashMessage({ type: 'success', message: 'Analytics settings saved successfully!' });
        } catch (error) {
            console.error("Failed to save settings:", error);
            setFlashMessage({ type: 'error', message: 'Failed to save settings.' });
        } finally {
            setSaving(false);
        }
    };
    
    useEffect(() => {
        if (flashMessage) {
            const timer = setTimeout(() => setFlashMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [flashMessage]);

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
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {flashMessage && (
                    <div 
                        className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white z-50 transition-opacity duration-300 ${flashMessage.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}
                    >
                        {flashMessage.message}
                    </div>
                )}

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Analytics & Tracking</h1>
                    <p className="text-gray-600 mt-1">Configure your store's analytics and tracking integrations.</p>
                </div>

                <div className="space-y-8">
                    <Card className="material-elevation-1 border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Google Integrations</CardTitle>
                            <CardDescription>Connect Google services to your store.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <Label htmlFor="enable_gtm">Enable Google Tag Manager</Label>
                                </div>
                                <Switch id="enable_gtm" checked={!!store.settings.analytics_settings.enable_google_tag_manager} onCheckedChange={(c) => handleAnalyticsChange('enable_google_tag_manager', c)} />
                            </div>

                            {store.settings.analytics_settings.enable_google_tag_manager && (
                                <div className="pl-6 border-l-2 border-blue-200 space-y-4">
                                    <div>
                                        <Label className="text-base font-medium">GTM Implementation Type</Label>
                                        <RadioGroup
                                            value={store.settings.analytics_settings.gtm_script_type || 'default'}
                                            onValueChange={(value) => handleAnalyticsChange('gtm_script_type', value)}
                                            className="mt-2"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="default" id="gtm_default" />
                                                <Label htmlFor="gtm_default" className="cursor-pointer">
                                                    Default Google Tag Manager
                                                </Label>
                                            </div>
                                            <p className="text-sm text-gray-500 ml-6">Standard GTM implementation using Google's servers</p>

                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="custom" id="gtm_custom" />
                                                <Label htmlFor="gtm_custom" className="cursor-pointer">
                                                    Custom GTM Script (Server-Side Tagging)
                                                </Label>
                                            </div>
                                            <p className="text-sm text-gray-500 ml-6">Custom implementation for first-party data collection and server-side tagging</p>
                                        </RadioGroup>
                                    </div>

                                    {store.settings.analytics_settings.gtm_script_type === 'default' ? (
                                        <div>
                                            <Label htmlFor="gtm_id">Google Tag Manager ID</Label>
                                            <Input
                                                id="gtm_id"
                                                value={store.settings.analytics_settings.gtm_id || ''}
                                                onChange={(e) => handleAnalyticsChange('gtm_id', e.target.value)}
                                                placeholder="GTM-XXXXXX"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">Your Google Tag Manager container ID</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <Label htmlFor="custom_gtm_script">Custom GTM Script</Label>
                                            <Textarea
                                                id="custom_gtm_script"
                                                value={store.settings.analytics_settings.custom_gtm_script || ''}
                                                onChange={(e) => handleAnalyticsChange('custom_gtm_script', e.target.value)}
                                                placeholder="<!-- Google Tag Manager -->\n<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\nnew Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\nj=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n'https://your-server.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n})(window,document,'script','dataLayer','GTM-XXXXXX');</script>\n<!-- End Google Tag Manager -->"
                                                rows={8}
                                                className="font-mono text-sm"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">
                                                Complete GTM script for server-side tagging. Replace the GTM endpoint with your server-side tagging URL for first-party data collection.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <Label htmlFor="google_ads_id">Google Ads ID</Label>
                                <Input id="google_ads_id" value={store.settings.analytics_settings.google_ads_id} onChange={(e) => handleAnalyticsChange('google_ads_id', e.target.value)} placeholder="AW-XXXXXXXXX" />
                                <p className="text-sm text-gray-500 mt-1">For conversion tracking and remarketing.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end mt-8">
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </div>
        </div>
    );
}