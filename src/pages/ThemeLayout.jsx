import React, { useState, useEffect } from 'react';
import { Store } from '@/api/entities';
import { User } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save, Palette, Eye, Navigation, ShoppingBag } from 'lucide-react';

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

export default function ThemeLayout() {
    const { selectedStore, getSelectedStoreId } = useStoreSelection();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [flashMessage, setFlashMessage] = useState(null);

    useEffect(() => {
        if (selectedStore) {
            loadStore();
        }
    }, [selectedStore]);

    const loadStore = async () => {
        try {
            const storeId = getSelectedStoreId();
            if (!storeId) {
                console.warn("No store selected");
                setLoading(false);
                return;
            }

            setStore(selectedStore);
                const stores = await retryApiCall(() => Store.findAll());
                if (stores && stores.length > 0) {
                    const currentStore = stores[0];
                    // Ensure settings object and its nested properties exist with defaults
                    const settings = {
                        ...(currentStore.settings || {}),
                        theme: {
                            primary_button_color: '#007bff',
                            secondary_button_color: '#6c757d',
                            add_to_cart_button_color: '#28a745',
                            view_cart_button_color: '#17a2b8',
                            checkout_button_color: '#007bff',
                            place_order_button_color: '#28a745',
                            font_family: 'Inter',
                            ...((currentStore.settings || {}).theme || {})
                        },
                    };
                    setStore({ ...currentStore, settings });
                }
            } catch (error) {
                console.error("Failed to load store:", error);
                setFlashMessage({ type: 'error', message: 'Could not load store settings.' });
            } finally {
                setLoading(false);
            }
        };
        loadStore();
    }, []);

    useEffect(() => {
        if (flashMessage) {
            const timer = setTimeout(() => setFlashMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [flashMessage]);

    const handleSettingsChange = (key, value) => {
        setStore(prev => ({
            ...prev,
            settings: { ...prev.settings, [key]: value }
        }));
    };

    const handleThemeChange = (key, value) => {
        setStore(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                theme: { ...prev.settings.theme, [key]: value }
            }
        }));
    };

    const handleSave = async () => {
        if (!store) return;
        setSaving(true);
        try {
            await retryApiCall(() => Store.update(store.id, { settings: store.settings }));
            setFlashMessage({ type: 'success', message: 'Settings saved successfully!' });
        } catch (error) {
            console.error("Failed to save settings:", error);
            setFlashMessage({ type: 'error', message: 'Failed to save settings.' });
        } finally {
            setSaving(false);
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
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Theme & Layout</h1>
                    <p className="text-gray-600 mt-1">Customize the look, feel, and layout of your storefront.</p>
                </div>
                
                {flashMessage && (
                    <div className={`mb-4 p-4 rounded-lg text-white ${flashMessage.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
                        {flashMessage.message}
                    </div>
                )}

                <div className="space-y-8">
                    <Card className="material-elevation-1 border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" /> Theme Settings</CardTitle>
                            <CardDescription>Control the colors and fonts of your store.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="font_family">Font Family</Label>
                                    <Select value={store.settings.theme.font_family} onValueChange={(value) => handleThemeChange('font_family', value)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Inter">Inter (Sans-serif)</SelectItem>
                                            <SelectItem value="Roboto">Roboto (Sans-serif)</SelectItem>
                                            <SelectItem value="Open Sans">Open Sans (Sans-serif)</SelectItem>
                                            <SelectItem value="Lato">Lato (Sans-serif)</SelectItem>
                                            <SelectItem value="Merriweather">Merriweather (Serif)</SelectItem>
                                            <SelectItem value="Playfair Display">Playfair Display (Serif)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Separator />
                            <h4 className="font-medium">Button Colors</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <Label htmlFor="primary_button_color">Primary Buttons</Label>
                                    <Input id="primary_button_color" type="color" value={store.settings.theme.primary_button_color} onChange={(e) => handleThemeChange('primary_button_color', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="secondary_button_color">Secondary Buttons</Label>
                                    <Input id="secondary_button_color" type="color" value={store.settings.theme.secondary_button_color} onChange={(e) => handleThemeChange('secondary_button_color', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="add_to_cart_button_color">'Add to Cart' Button</Label>
                                    <Input id="add_to_cart_button_color" type="color" value={store.settings.theme.add_to_cart_button_color} onChange={(e) => handleThemeChange('add_to_cart_button_color', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="view_cart_button_color">'View Cart' Button</Label>
                                    <Input id="view_cart_button_color" type="color" value={store.settings.theme.view_cart_button_color} onChange={(e) => handleThemeChange('view_cart_button_color', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="checkout_button_color">'Checkout' Button</Label>
                                    <Input id="checkout_button_color" type="color" value={store.settings.theme.checkout_button_color} onChange={(e) => handleThemeChange('checkout_button_color', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="place_order_button_color">'Place Order' Button</Label>
                                    <Input id="place_order_button_color" type="color" value={store.settings.theme.place_order_button_color} onChange={(e) => handleThemeChange('place_order_button_color', e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="material-elevation-1 border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" /> Currency & Display</CardTitle>
                            <CardDescription>Control how currency and other elements are displayed.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <Label htmlFor="hide_currency_category">Hide Currency on Category Pages</Label>
                                    <p className="text-sm text-gray-500">Don't show currency symbol on category pages.</p>
                                </div>
                                <Switch id="hide_currency_category" checked={!!store.settings.hide_currency_category} onCheckedChange={(c) => handleSettingsChange('hide_currency_category', c)} />
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <Label htmlFor="hide_currency_product">Hide Currency on Product Pages</Label>
                                    <p className="text-sm text-gray-500">Don't show currency symbol on product pages.</p>
                                </div>
                                <Switch id="hide_currency_product" checked={!!store.settings.hide_currency_product} onCheckedChange={(c) => handleSettingsChange('hide_currency_product', c)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="material-elevation-1 border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Navigation className="w-5 h-5" /> Header & Navigation</CardTitle>
                            <CardDescription>Customize the store's header and breadcrumbs.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <Label htmlFor="hide_header_cart">Hide Cart in Header</Label>
                                </div>
                                <Switch id="hide_header_cart" checked={!!store.settings.hide_header_cart} onCheckedChange={(c) => handleSettingsChange('hide_header_cart', c)} />
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <Label htmlFor="hide_header_checkout">Hide Checkout in Header</Label>
                                </div>
                                <Switch id="hide_header_checkout" checked={!!store.settings.hide_header_checkout} onCheckedChange={(c) => handleSettingsChange('hide_header_checkout', c)} />
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <Label htmlFor="show_permanent_search">Show Permanent Search Bar</Label>
                                </div>
                                <Switch id="show_permanent_search" checked={!!store.settings.show_permanent_search} onCheckedChange={(c) => handleSettingsChange('show_permanent_search', c)} />
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <Label htmlFor="show_category_in_breadcrumb">Show Category in Breadcrumbs</Label>
                                </div>
                                <Switch id="show_category_in_breadcrumb" checked={!!store.settings.show_category_in_breadcrumb} onCheckedChange={(c) => handleSettingsChange('show_category_in_breadcrumb', c)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="material-elevation-1 border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> Product Page</CardTitle>
                            <CardDescription>Settings for the product detail page.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <Label htmlFor="hide_quantity_selector">Hide Quantity Selector</Label>
                                    <p className="text-sm text-gray-500">Don't show the quantity input on product pages.</p>
                                </div>
                                <Switch id="hide_quantity_selector" checked={!!store.settings.hide_quantity_selector} onCheckedChange={(c) => handleSettingsChange('hide_quantity_selector', c)} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end mt-8">
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save All Settings'}
                    </Button>
                </div>
            </div>
        </div>
    );
}