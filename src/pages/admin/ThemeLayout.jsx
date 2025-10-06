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
import { Save, Palette, Eye, Navigation, ShoppingBag, Filter } from 'lucide-react';

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

    // Update UI when store settings change
    useEffect(() => {
        // Trigger re-render when product_grid settings change
    }, [store?.settings?.product_grid]);

    const loadStore = async () => {
        try {
            const storeId = getSelectedStoreId();
            
            // Use selectedStore.id as fallback if getSelectedStoreId() fails
            const actualStoreId = (storeId && storeId !== 'undefined') ? storeId : selectedStore?.id;
            
            if (!actualStoreId || actualStoreId === 'undefined') {
                setLoading(false);
                return;
            }
            
            // The selectedStore from context doesn't have settings, so we need to fetch the full store data
            const fullStoreResponse = await Store.findById(actualStoreId);
            
            // Store.findById returns an array, so we need to get the first item
            const fullStoreResponse_normalized = Array.isArray(fullStoreResponse) ? fullStoreResponse[0] : fullStoreResponse;

            // Handle nested data structure - settings are in data.settings, not settings
            const fullStore = fullStoreResponse_normalized?.data || fullStoreResponse_normalized;

            // Handle database response structure

            // Ensure settings object and its nested properties exist with defaults
            const settings = {
                ...(fullStore?.settings || {}),
                // Category page defaults
                enable_product_filters: true,
                collapse_filters: false,
                max_visible_attributes: 5,
                show_stock_label: fullStore?.settings?.show_stock_label ?? false,
                enable_view_mode_toggle: fullStore?.settings?.enable_view_mode_toggle ?? true,
                default_view_mode: fullStore?.settings?.default_view_mode || 'grid',
                // Product gallery defaults
                product_gallery_layout: fullStore?.settings?.product_gallery_layout || 'horizontal',
                vertical_gallery_position: fullStore?.settings?.vertical_gallery_position || 'left',
                mobile_gallery_layout: fullStore?.settings?.mobile_gallery_layout || 'below',
                // Product grid - merge breakpoints properly
                product_grid: {
                    breakpoints: {
                        default: fullStore?.settings?.product_grid?.breakpoints?.default ?? 1,
                        sm: fullStore?.settings?.product_grid?.breakpoints?.sm ?? 2,
                        md: fullStore?.settings?.product_grid?.breakpoints?.md ?? 0,
                        lg: fullStore?.settings?.product_grid?.breakpoints?.lg ?? 2,
                        xl: fullStore?.settings?.product_grid?.breakpoints?.xl ?? 0,
                        '2xl': fullStore?.settings?.product_grid?.breakpoints?.['2xl'] ?? 0
                    },
                    customBreakpoints: fullStore?.settings?.product_grid?.customBreakpoints || [],
                    rows: fullStore?.settings?.product_grid?.rows ?? 4
                },
                theme: {
                    // Default values
                    primary_button_color: '#007bff',
                    secondary_button_color: '#6c757d',
                    add_to_cart_button_color: '#28a745',
                    view_cart_button_color: '#17a2b8',
                    checkout_button_color: '#007bff',
                    place_order_button_color: '#28a745',
                    font_family: 'Inter',
                    // Product Tabs Styling defaults
                    product_tabs_title_color: '#DC2626', // red-600
                    product_tabs_title_size: '1.875rem', // text-3xl
                    product_tabs_content_bg: '#EFF6FF', // blue-50
                    product_tabs_attribute_label_color: '#16A34A', // green-600
                    // Override with existing settings if they exist
                    ...((fullStore?.settings || {}).theme || {})
                },
            };
            
            // Use the full store data instead of selectedStore, but ensure we have the ID
            const finalStore = {
                ...fullStore,
                id: fullStore?.id || actualStoreId, // Ensure we have the store ID
                settings
            };

            setStore(finalStore);
        } catch (error) {
            console.error("Failed to load store:", error);
            setFlashMessage({ type: 'error', message: 'Could not load store settings.' });
        } finally {
            setLoading(false);
        }
    };

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

    const handleStandardBreakpointChange = (breakpoint, columns) => {
        setStore(prev => {
            const newStore = {
                ...prev,
                settings: {
                    ...prev.settings,
                    product_grid: {
                        ...prev.settings.product_grid,
                        breakpoints: {
                            ...prev.settings.product_grid?.breakpoints,
                            [breakpoint]: columns
                        },
                        customBreakpoints: prev.settings.product_grid?.customBreakpoints || [],
                        rows: prev.settings.product_grid?.rows ?? 4
                    }
                }
            };

            return newStore;
        });
    };

    const handleRowsChange = (rows) => {
        setStore(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                product_grid: {
                    ...prev.settings.product_grid,
                    breakpoints: prev.settings.product_grid?.breakpoints || {},
                    customBreakpoints: prev.settings.product_grid?.customBreakpoints || [],
                    rows: rows
                }
            }
        }));
    };

    const handleAddCustomBreakpoint = () => {
        setStore(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                product_grid: {
                    ...prev.settings.product_grid,
                    breakpoints: prev.settings.product_grid?.breakpoints || {},
                    customBreakpoints: [
                        ...(prev.settings.product_grid?.customBreakpoints || []),
                        { name: '', columns: 2 }
                    ],
                    rows: prev.settings.product_grid?.rows ?? 4
                }
            }
        }));
    };

    const handleCustomBreakpointChange = (index, field, value) => {
        setStore(prev => {
            const updatedCustomBreakpoints = [...(prev.settings.product_grid?.customBreakpoints || [])];
            updatedCustomBreakpoints[index] = {
                ...updatedCustomBreakpoints[index],
                [field]: value
            };

            return {
                ...prev,
                settings: {
                    ...prev.settings,
                    product_grid: {
                        ...prev.settings.product_grid,
                        breakpoints: prev.settings.product_grid?.breakpoints || {},
                        customBreakpoints: updatedCustomBreakpoints,
                        rows: prev.settings.product_grid?.rows ?? 4
                    }
                }
            };
        });
    };

    const handleRemoveCustomBreakpoint = (index) => {
        setStore(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                product_grid: {
                    ...prev.settings.product_grid,
                    breakpoints: prev.settings.product_grid?.breakpoints || {},
                    customBreakpoints: (prev.settings.product_grid?.customBreakpoints || []).filter((_, i) => i !== index),
                    rows: prev.settings.product_grid?.rows ?? 4
                }
            }
        }));
    };

    const generateGridClassesPreview = (gridConfig) => {
        if (!gridConfig) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';

        let classes = [];
        const breakpoints = gridConfig.breakpoints || {};
        const customBreakpoints = gridConfig.customBreakpoints || [];

        // Standard breakpoints
        Object.entries(breakpoints).forEach(([breakpoint, columns]) => {
            if (columns > 0) {
                if (breakpoint === 'default') {
                    classes.push(`grid-cols-${columns}`);
                } else {
                    classes.push(`${breakpoint}:grid-cols-${columns}`);
                }
            }
        });

        // Custom breakpoints
        customBreakpoints.forEach(({ name, columns }) => {
            if (name && columns > 0) {
                classes.push(`${name}:grid-cols-${columns}`);
            }
        });

        return classes.length > 0 ? classes.join(' ') : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
    };

    const calculateProductsPerPage = (gridConfig) => {
        if (!gridConfig) return {
            max: 12,
            description: 'Default: 12 products per page',
            breakdowns: []
        };

        const breakpoints = gridConfig.breakpoints || {};
        const rows = gridConfig.rows || 4;

        if (rows === 0) {
            return {
                max: 'infinite',
                description: 'Infinite scroll enabled',
                breakdowns: []
            };
        }

        // Calculate products per page for each breakpoint
        const breakdownList = [];
        let maxColumns = 1;

        // Standard breakpoint order (from smallest to largest)
        const breakpointOrder = [
            { key: 'default', label: 'Mobile' },
            { key: 'sm', label: 'Small (640px+)' },
            { key: 'md', label: 'Medium (768px+)' },
            { key: 'lg', label: 'Large (1024px+)' },
            { key: 'xl', label: 'XL (1280px+)' },
            { key: '2xl', label: '2XL (1536px+)' }
        ];

        breakpointOrder.forEach(({ key, label }) => {
            const columns = breakpoints[key] || 0;
            if (columns > 0) {
                const productsForBreakpoint = columns * rows;
                breakdownList.push({
                    breakpoint: key,
                    label,
                    columns,
                    rows,
                    total: productsForBreakpoint
                });

                if (columns > maxColumns) {
                    maxColumns = columns;
                }
            }
        });

        const maxProductsPerPage = maxColumns * rows;

        return {
            max: maxProductsPerPage,
            description: `Maximum: ${maxColumns} columns × ${rows} rows = ${maxProductsPerPage} products per page`,
            breakdowns: breakdownList
        };
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
            console.log('💾 ThemeLayout - Saving settings:', {
                theme: store.settings.theme,
                product_tabs_title_color: store.settings.theme?.product_tabs_title_color
            });

            // Use the same approach as Tax.jsx and ShippingMethods.jsx
            const result = await retryApiCall(async () => {
                const { Store } = await import('@/api/entities');
                const apiResult = await Store.update(store.id, { settings: store.settings });
                console.log('💾 ThemeLayout - Save result:', apiResult);
                return apiResult;
            });

            // ALWAYS clear specific cache keys when admin saves settings
            const clearSpecificCacheKeys = () => {
                const keysToAlwaysClear = [
                    'storeProviderCache',
                    'store_settings_cache',
                    'store_theme_cache',
                    'gallery_settings_cache',
                    `store_${store.id}_settings`,
                    `store_${store.id}_cache`,
                    'product_layout_config',
                    'category_layout_config',
                    // 🔧 GALLERY SYNC FIX: Clear additional template processing caches
                    'variableProcessor_cache',
                    'template_processing_cache',
                    'slot_configuration_cache'
                ];

                keysToAlwaysClear.forEach(key => {
                    localStorage.removeItem(key);
                    sessionStorage.removeItem(key);
                });

                // Force store refresh
                localStorage.setItem('forceRefreshStore', 'true');
                localStorage.setItem('settings_updated_at', Date.now().toString());
            };

            try {
                clearSpecificCacheKeys();

                // Broadcast cache clear to all tabs
                try {
                    const channel = new BroadcastChannel('store_settings_update');
                    channel.postMessage({
                        type: 'clear_cache',
                        reason: 'admin_settings_save',
                        timestamp: Date.now(),
                        keysCleared: ['storeProviderCache', 'store_settings_cache', 'gallery_settings_cache']
                    });
                    channel.close();
                } catch (broadcastError) {
                    console.warn('BroadcastChannel not supported:', broadcastError);
                }

            } catch (e) {
                console.error('Cache clearing failed:', e);
            }
            
            setFlashMessage({ type: 'success', message: 'Settings saved successfully! Visit a category page to see changes.' });
            
        } catch (error) {
            setFlashMessage({ type: 'error', message: `Failed to save settings: ${error.response?.data?.message || error.message}` });
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
            <div className="max-w-7xl mx-auto">
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
                                    <Label htmlFor="hide_header_cart">Hide header in Cart</Label>
                                </div>
                                <Switch id="hide_header_cart" checked={!!store.settings.hide_header_cart} onCheckedChange={(c) => handleSettingsChange('hide_header_cart', c)} />
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <Label htmlFor="hide_header_checkout">Hide header in Checkout</Label>
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
                            <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5" /> Category Page</CardTitle>
                            <CardDescription>Settings for category and filtering pages.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <Label htmlFor="enable_product_filters">Enable Product Filters</Label>
                                    <p className="text-sm text-gray-500">Show filter sidebar on category pages.</p>
                                </div>
                                <Switch
                                    id="enable_product_filters"
                                    checked={!!store.settings.enable_product_filters}
                                    onCheckedChange={(c) => handleSettingsChange('enable_product_filters', c)}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <Label htmlFor="collapse_filters">Collapse Filters</Label>
                                    <p className="text-sm text-gray-500">Start with filter sections collapsed by default.</p>
                                </div>
                                <Switch
                                    id="collapse_filters"
                                    checked={!!store.settings.collapse_filters}
                                    onCheckedChange={(c) => handleSettingsChange('collapse_filters', c)}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <Label htmlFor="max_visible_attributes">Max Visible Attributes</Label>
                                    <p className="text-sm text-gray-500">Show this many filter options before "Show More" button.</p>
                                </div>
                                <div className="w-20">
                                    <Input
                                        id="max_visible_attributes"
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={store.settings.max_visible_attributes || 5}
                                        onChange={(e) => handleSettingsChange('max_visible_attributes', parseInt(e.target.value) || 5)}
                                        className="text-center"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <Label htmlFor="show_stock_label">Show Stock Label</Label>
                                    <p className="text-sm text-gray-500">Display stock status (In Stock/Out of Stock) above the Add to Cart button.</p>
                                </div>
                                <Switch
                                    id="show_stock_label"
                                    checked={!!store.settings.show_stock_label}
                                    onCheckedChange={(c) => handleSettingsChange('show_stock_label', c)}
                                />
                            </div>

                            <Separator />

                            <div className="p-3 border rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="enable_view_mode_toggle">Enable Grid/List View Toggle</Label>
                                        <p className="text-sm text-gray-500">Show toggle button to switch between grid and list view on category pages.</p>
                                    </div>
                                    <Switch
                                        id="enable_view_mode_toggle"
                                        checked={!!store.settings.enable_view_mode_toggle}
                                        onCheckedChange={(c) => handleSettingsChange('enable_view_mode_toggle', c)}
                                    />
                                </div>

                                {store.settings.enable_view_mode_toggle && (
                                    <div className="pt-3 border-t">
                                        <div>
                                            <Label htmlFor="default_view_mode">Default View Mode</Label>
                                            <p className="text-sm text-gray-500">Choose which view mode to show by default.</p>
                                        </div>
                                        <Select
                                            value={store.settings.default_view_mode || 'grid'}
                                            onValueChange={(value) => handleSettingsChange('default_view_mode', value)}
                                        >
                                            <SelectTrigger className="mt-2">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="grid">Grid View</SelectItem>
                                                <SelectItem value="list">List View</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="p-4 border rounded-lg space-y-6">
                                <div>
                                    <Label className="text-base font-medium">Product Grid Layout</Label>
                                    <p className="text-sm text-gray-500">Configure how many products display per row at different screen sizes</p>
                                </div>

                                {/* Standard Tailwind Breakpoints */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="grid_default">Default (Mobile)</Label>
                                            <Select value={String(store.settings.product_grid?.breakpoints?.default || 1)} onValueChange={(value) => handleStandardBreakpointChange('default', parseInt(value))}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">1 column</SelectItem>
                                                    <SelectItem value="2">2 columns</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="grid_sm">Small (sm)</Label>
                                            <Select value={String(store.settings.product_grid?.breakpoints?.sm || 2)} onValueChange={(value) => handleStandardBreakpointChange('sm', parseInt(value))}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">- (disabled)</SelectItem>
                                                    <SelectItem value="1">1 column</SelectItem>
                                                    <SelectItem value="2">2 columns</SelectItem>
                                                    <SelectItem value="3">3 columns</SelectItem>
                                                    <SelectItem value="4">4 columns</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="grid_md">Medium (md)</Label>
                                            <Select value={String(store.settings.product_grid?.breakpoints?.md || 0)} onValueChange={(value) => handleStandardBreakpointChange('md', parseInt(value))}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">- (disabled)</SelectItem>
                                                    <SelectItem value="1">1 column</SelectItem>
                                                    <SelectItem value="2">2 columns</SelectItem>
                                                    <SelectItem value="3">3 columns</SelectItem>
                                                    <SelectItem value="4">4 columns</SelectItem>
                                                    <SelectItem value="5">5 columns</SelectItem>
                                                    <SelectItem value="6">6 columns</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="grid_lg">Large (lg)</Label>
                                            <Select
                                                value={String(store.settings.product_grid?.breakpoints?.lg || 2)}
                                                onValueChange={(value) => handleStandardBreakpointChange('lg', parseInt(value))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">- (disabled)</SelectItem>
                                                    <SelectItem value="1">1 column</SelectItem>
                                                    <SelectItem value="2">2 columns</SelectItem>
                                                    <SelectItem value="3">3 columns</SelectItem>
                                                    <SelectItem value="4">4 columns</SelectItem>
                                                    <SelectItem value="5">5 columns</SelectItem>
                                                    <SelectItem value="6">6 columns</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="grid_xl">Extra Large (xl)</Label>
                                            <Select value={String(store.settings.product_grid?.breakpoints?.xl || 0)} onValueChange={(value) => handleStandardBreakpointChange('xl', parseInt(value))}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">- (disabled)</SelectItem>
                                                    <SelectItem value="1">1 column</SelectItem>
                                                    <SelectItem value="2">2 columns</SelectItem>
                                                    <SelectItem value="3">3 columns</SelectItem>
                                                    <SelectItem value="4">4 columns</SelectItem>
                                                    <SelectItem value="5">5 columns</SelectItem>
                                                    <SelectItem value="6">6 columns</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="grid_2xl">2X Large (2xl)</Label>
                                            <Select value={String(store.settings.product_grid?.breakpoints?.['2xl'] || 0)} onValueChange={(value) => handleStandardBreakpointChange('2xl', parseInt(value))}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">- (disabled)</SelectItem>
                                                    <SelectItem value="1">1 column</SelectItem>
                                                    <SelectItem value="2">2 columns</SelectItem>
                                                    <SelectItem value="3">3 columns</SelectItem>
                                                    <SelectItem value="4">4 columns</SelectItem>
                                                    <SelectItem value="5">5 columns</SelectItem>
                                                    <SelectItem value="6">6 columns</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Rows Configuration */}
                                <div className="border-t pt-4">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <Label htmlFor="grid_rows">Number of Rows</Label>
                                            <p className="text-sm text-gray-500">How many rows of products to show per page (0 = infinite scroll)</p>
                                        </div>
                                        <div className="w-32">
                                            <Select
                                                value={String(store.settings.product_grid?.rows || 4)}
                                                onValueChange={(value) => handleRowsChange(parseInt(value))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">Infinite scroll</SelectItem>
                                                    <SelectItem value="1">1 row</SelectItem>
                                                    <SelectItem value="2">2 rows</SelectItem>
                                                    <SelectItem value="3">3 rows</SelectItem>
                                                    <SelectItem value="4">4 rows</SelectItem>
                                                    <SelectItem value="5">5 rows</SelectItem>
                                                    <SelectItem value="6">6 rows</SelectItem>
                                                    <SelectItem value="8">8 rows</SelectItem>
                                                    <SelectItem value="10">10 rows</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Breakpoints */}
                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <Label className="text-base font-medium">Custom Breakpoints</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={handleAddCustomBreakpoint}>
                                            + Add Custom Breakpoint
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {(store.settings.product_grid?.customBreakpoints || []).map((breakpoint, index) => (
                                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                                                <div className="flex-1">
                                                    <Label htmlFor={`custom_name_${index}`}>Name:</Label>
                                                    <Input
                                                        id={`custom_name_${index}`}
                                                        value={breakpoint.name || ''}
                                                        onChange={(e) => handleCustomBreakpointChange(index, 'name', e.target.value)}
                                                        placeholder="e.g. tablet-lg"
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <Label htmlFor={`custom_columns_${index}`}>Columns:</Label>
                                                    <Select value={String(breakpoint.columns || 1)} onValueChange={(value) => handleCustomBreakpointChange(index, 'columns', parseInt(value))}>
                                                        <SelectTrigger className="mt-1">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="1">1 column</SelectItem>
                                                            <SelectItem value="2">2 columns</SelectItem>
                                                            <SelectItem value="3">3 columns</SelectItem>
                                                            <SelectItem value="4">4 columns</SelectItem>
                                                            <SelectItem value="5">5 columns</SelectItem>
                                                            <SelectItem value="6">6 columns</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveCustomBreakpoint(index)}>
                                                    Remove ×
                                                </Button>
                                            </div>
                                        ))}

                                        {(!store.settings.product_grid?.customBreakpoints || store.settings.product_grid.customBreakpoints.length === 0) && (
                                            <p className="text-sm text-gray-500 text-center py-4">No custom breakpoints defined. Click "Add Custom Breakpoint" to create one.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Live Preview */}
                                <div className="bg-gray-50 p-3 rounded space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium">Generated Classes Preview:</Label>
                                        <div className="mt-2 text-xs text-gray-700 font-mono break-all">
                                            {generateGridClassesPreview(store.settings.product_grid)}
                                        </div>
                                    </div>

                                    {(() => {
                                        const calculation = calculateProductsPerPage(store.settings.product_grid);
                                        return (
                                            <div>
                                                <Label className="text-sm font-medium">Products Per Page by Breakpoint:</Label>
                                                <div className="mt-2 text-sm text-gray-700">
                                                    {calculation.description}
                                                </div>
                                                {calculation.breakdowns.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {calculation.breakdowns.map((breakdown) => (
                                                            <div key={breakdown.breakpoint} className="text-xs text-gray-600">
                                                                <span className="font-medium">{breakdown.label}:</span> {breakdown.columns} cols × {breakdown.rows} rows = <span className="font-medium text-blue-600">{breakdown.total} products</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
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

                            <div className="p-3 border rounded-lg">
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="product_gallery_layout">Product Gallery Layout</Label>
                                        <p className="text-sm text-gray-500">Choose how the product images are arranged on the product page.</p>
                                    </div>
                                    <Select
                                        value={store.settings.product_gallery_layout || 'horizontal'}
                                        onValueChange={(value) => handleSettingsChange('product_gallery_layout', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="horizontal">Horizontal (Main image with thumbnails below)</SelectItem>
                                            <SelectItem value="vertical">Vertical (Main image with thumbnails on side)</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {store.settings.product_gallery_layout === 'vertical' && (
                                        <div className="mt-4 pt-4 border-t">
                                            <div>
                                                <Label htmlFor="vertical_gallery_position">Thumbnail Position (Vertical Layout)</Label>
                                                <p className="text-sm text-gray-500">Choose whether thumbnails appear on the left or right side.</p>
                                            </div>
                                            <Select
                                                value={store.settings.vertical_gallery_position || 'left'}
                                                onValueChange={(value) => handleSettingsChange('vertical_gallery_position', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="left">Left (Thumbnails on left side)</SelectItem>
                                                    <SelectItem value="right">Right (Thumbnails on right side)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="mt-4 pt-4 border-t">
                                        <div>
                                            <Label htmlFor="mobile_gallery_layout">Mobile Layout</Label>
                                            <p className="text-sm text-gray-500">How thumbnails are positioned on mobile devices (screens smaller than 640px).</p>
                                        </div>
                                        <Select
                                            value={store.settings.mobile_gallery_layout || 'below'}
                                            onValueChange={(value) => handleSettingsChange('mobile_gallery_layout', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="above">Above (Thumbnails above main image)</SelectItem>
                                                <SelectItem value="below">Below (Thumbnails below main image)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 border rounded-lg">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium mb-2">Product Tabs Styling</h4>
                                        <p className="text-sm text-gray-500">Customize the appearance of product tabs on product detail pages.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="product_tabs_title_color">Tab Title Color</Label>
                                            <Input
                                                id="product_tabs_title_color"
                                                type="color"
                                                value={store.settings.theme.product_tabs_title_color}
                                                onChange={(e) => handleThemeChange('product_tabs_title_color', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="product_tabs_title_size">Tab Title Size</Label>
                                            <Select
                                                value={store.settings.theme.product_tabs_title_size}
                                                onValueChange={(value) => handleThemeChange('product_tabs_title_size', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0.875rem">Small (14px)</SelectItem>
                                                    <SelectItem value="1rem">Medium (16px)</SelectItem>
                                                    <SelectItem value="1.125rem">Large (18px)</SelectItem>
                                                    <SelectItem value="1.25rem">X-Large (20px)</SelectItem>
                                                    <SelectItem value="1.5rem">2X-Large (24px)</SelectItem>
                                                    <SelectItem value="1.875rem">3X-Large (30px)</SelectItem>
                                                    <SelectItem value="2.25rem">4X-Large (36px)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="product_tabs_content_bg">Tab Content Background</Label>
                                            <Input
                                                id="product_tabs_content_bg"
                                                type="color"
                                                value={store.settings.theme.product_tabs_content_bg}
                                                onChange={(e) => handleThemeChange('product_tabs_content_bg', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="product_tabs_attribute_label_color">Attribute Label Color</Label>
                                            <Input
                                                id="product_tabs_attribute_label_color"
                                                type="color"
                                                value={store.settings.theme.product_tabs_attribute_label_color}
                                                onChange={(e) => handleThemeChange('product_tabs_attribute_label_color', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
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