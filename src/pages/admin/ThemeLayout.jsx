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
import { Save, Palette, Eye, Navigation, ShoppingBag, Filter, Home, CreditCard, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Default section layouts - now organized by step within each mode
const defaultSectionLayout = {
    '1step': {
        step1: {
            column1: ['Account', 'Shipping Address', 'Shipping Method', 'Billing Address'],
            column2: ['Delivery Options', 'Payment Method'],
            column3: ['Coupon', 'Order Summary']
        }
    },
    '2step': {
        step1: {
            column1: ['Account', 'Shipping Address', 'Billing Address'],
            column2: ['Shipping Method', 'Delivery Options']
        },
        step2: {
            column1: ['Payment Method'],
            column2: ['Coupon', 'Order Summary']
        }
    },
    '3step': {
        step1: {
            column1: ['Account', 'Shipping Address'],
            column2: ['Billing Address']
        },
        step2: {
            column1: ['Shipping Method', 'Delivery Options'],
            column2: []
        },
        step3: {
            column1: ['Payment Method'],
            column2: ['Coupon', 'Order Summary']
        }
    }
};

// Sortable Item Component for drag and drop
function SortableSection({ id, section }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 p-3 bg-white border rounded-lg hover:bg-gray-50"
        >
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            <span className="flex-1">{section}</span>
        </div>
    );
}

// Droppable Column Component - allows dropping items from other columns
function DroppableColumn({ id, children, className }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`${className} ${isOver ? 'ring-2 ring-blue-400' : ''}`}
        >
            {children}
        </div>
    );
}

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

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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
                // Header defaults
                show_language_selector: fullStore?.settings?.show_language_selector ?? false,
                // Product gallery defaults
                product_gallery_layout: fullStore?.settings?.product_gallery_layout || 'horizontal',
                vertical_gallery_position: fullStore?.settings?.vertical_gallery_position || 'left',
                mobile_gallery_layout: fullStore?.settings?.mobile_gallery_layout || 'below',
                // Checkout Page defaults
                checkout_steps_count: fullStore?.settings?.checkout_steps_count ?? 3,
                // Step names for 2-step checkout
                checkout_2step_step1_name: fullStore?.settings?.checkout_2step_step1_name || 'Information',
                checkout_2step_step2_name: fullStore?.settings?.checkout_2step_step2_name || 'Payment',
                // Step names for 3-step checkout
                checkout_3step_step1_name: fullStore?.settings?.checkout_3step_step1_name || 'Information',
                checkout_3step_step2_name: fullStore?.settings?.checkout_3step_step2_name || 'Shipping',
                checkout_3step_step3_name: fullStore?.settings?.checkout_3step_step3_name || 'Payment',
                checkout_step_indicator_active_color: fullStore?.settings?.checkout_step_indicator_active_color || '#007bff',
                checkout_step_indicator_inactive_color: fullStore?.settings?.checkout_step_indicator_inactive_color || '#D1D5DB',
                checkout_step_indicator_completed_color: fullStore?.settings?.checkout_step_indicator_completed_color || '#10B981',
                checkout_step_indicator_style: fullStore?.settings?.checkout_step_indicator_style || 'circles',
                checkout_section_title_color: fullStore?.settings?.checkout_section_title_color || '#111827',
                checkout_section_title_size: fullStore?.settings?.checkout_section_title_size || '1.25rem',
                checkout_section_bg_color: fullStore?.settings?.checkout_section_bg_color || '#FFFFFF',
                checkout_section_border_color: fullStore?.settings?.checkout_section_border_color || '#E5E7EB',
                // Checkout Layout Configuration
                checkout_1step_columns: fullStore?.settings?.checkout_1step_columns ?? 3,
                checkout_2step_columns: fullStore?.settings?.checkout_2step_columns ?? 2,
                checkout_3step_columns: fullStore?.settings?.checkout_3step_columns ?? 2,
                checkout_1step_layout: fullStore?.settings?.checkout_1step_layout || defaultSectionLayout['1step'],
                checkout_2step_layout: fullStore?.settings?.checkout_2step_layout || defaultSectionLayout['2step'],
                checkout_3step_layout: fullStore?.settings?.checkout_3step_layout || defaultSectionLayout['3step'],
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
                    // Breadcrumb defaults
                    breadcrumb_show_home_icon: true,
                    breadcrumb_item_text_color: '#6B7280', // gray-500
                    breadcrumb_item_hover_color: '#374151', // gray-700
                    breadcrumb_active_item_color: '#111827', // gray-900
                    breadcrumb_separator_color: '#9CA3AF', // gray-400
                    breadcrumb_font_size: '0.875rem', // text-sm
                    breadcrumb_mobile_font_size: '0.75rem', // text-xs
                    breadcrumb_font_weight: '400', // font-normal
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

    // Unified drag handler - supports cross-column and cross-step dragging
    const handleUnifiedDragEnd = (event, stepType) => {
        const { active, over } = event;

        if (!over) return;

        // Parse the droppable IDs: format is "stepKey-columnKey" (e.g., "step1-column1")
        const activeId = active.id; // Section name (e.g., "Account")
        const overId = over.id; // Either section name or droppable zone ID

        // Get the current layout
        const fullLayout = store.settings?.[`checkout_${stepType}_layout`] || defaultSectionLayout[stepType];
        const updatedLayout = JSON.parse(JSON.stringify(fullLayout)); // Deep clone

        // Find where the active item currently is
        let sourceStepKey = null;
        let sourceColumnKey = null;
        let sourceIndex = -1;

        // Search through all steps and columns to find the active item
        Object.keys(updatedLayout).forEach(stepKey => {
            Object.keys(updatedLayout[stepKey]).forEach(columnKey => {
                const index = updatedLayout[stepKey][columnKey].indexOf(activeId);
                if (index !== -1) {
                    sourceStepKey = stepKey;
                    sourceColumnKey = columnKey;
                    sourceIndex = index;
                }
            });
        });

        if (!sourceStepKey || !sourceColumnKey) return;

        // Determine target location
        let targetStepKey = sourceStepKey;
        let targetColumnKey = sourceColumnKey;
        let targetIndex = sourceIndex;

        // Check if over is a droppable zone (format: "step1-column1")
        if (overId.includes('-')) {
            const [stepPart, columnPart] = overId.split('-');
            targetStepKey = stepPart;
            targetColumnKey = columnPart;
            targetIndex = updatedLayout[targetStepKey][targetColumnKey].length; // Add to end
        } else {
            // Over is another section - find where it is
            Object.keys(updatedLayout).forEach(stepKey => {
                Object.keys(updatedLayout[stepKey]).forEach(columnKey => {
                    const index = updatedLayout[stepKey][columnKey].indexOf(overId);
                    if (index !== -1) {
                        targetStepKey = stepKey;
                        targetColumnKey = columnKey;
                        targetIndex = index;
                    }
                });
            });
        }

        // Remove from source
        updatedLayout[sourceStepKey][sourceColumnKey].splice(sourceIndex, 1);

        // Insert at target
        updatedLayout[targetStepKey][targetColumnKey].splice(targetIndex, 0, activeId);

        // Update the settings
        handleSettingsChange(`checkout_${stepType}_layout`, updatedLayout);
    };

    // Handler for column count change - merges sections when reducing columns
    const handleColumnCountChange = (stepType, newColumnCount) => {
        const oldColumnCount = store.settings?.[`checkout_${stepType}_columns`] || (stepType === '1step' ? 3 : 2);

        // Update column count
        handleSettingsChange(`checkout_${stepType}_columns`, newColumnCount);

        // If reducing columns, merge sections from removed columns
        if (newColumnCount < oldColumnCount) {
            const fullLayout = store.settings?.[`checkout_${stepType}_layout`] || defaultSectionLayout[stepType];
            const updatedLayout = { ...fullLayout };

            // Get all step keys in the layout
            const stepKeys = Object.keys(updatedLayout);

            stepKeys.forEach(stepKey => {
                const stepLayout = { ...updatedLayout[stepKey] };
                const sectionsToMerge = [];

                // Collect sections from columns that will be removed
                for (let i = newColumnCount + 1; i <= 3; i++) {
                    const columnKey = `column${i}`;
                    if (stepLayout[columnKey] && stepLayout[columnKey].length > 0) {
                        sectionsToMerge.push(...stepLayout[columnKey]);
                        stepLayout[columnKey] = []; // Clear the removed column
                    }
                }

                // Add collected sections to the last visible column
                if (sectionsToMerge.length > 0) {
                    const lastColumnKey = `column${newColumnCount}`;
                    stepLayout[lastColumnKey] = [
                        ...(stepLayout[lastColumnKey] || []),
                        ...sectionsToMerge
                    ];
                }

                updatedLayout[stepKey] = stepLayout;
            });

            // Update the layout with merged sections
            handleSettingsChange(`checkout_${stepType}_layout`, updatedLayout);
        }
    };

    const handleSave = async () => {
        if (!store) return;
        setSaving(true);

        try {
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
                                    <Label htmlFor="show_language_selector">Show Language Selector</Label>
                                    <p className="text-sm text-gray-500">Display language selector in header navigation.</p>
                                </div>
                                <Switch id="show_language_selector" checked={!!store.settings.show_language_selector} onCheckedChange={(c) => handleSettingsChange('show_language_selector', c)} />
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
                            <CardTitle className="flex items-center gap-2"><Home className="w-5 h-5" /> Breadcrumbs</CardTitle>
                            <CardDescription>Customize breadcrumb navigation appearance on category and product pages.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <Label htmlFor="breadcrumb_show_home_icon">Show Home Icon</Label>
                                    <p className="text-sm text-gray-500">Display home icon in breadcrumbs.</p>
                                </div>
                                <Switch
                                    id="breadcrumb_show_home_icon"
                                    checked={!!store.settings.theme?.breadcrumb_show_home_icon}
                                    onCheckedChange={(c) => handleThemeChange('breadcrumb_show_home_icon', c)}
                                />
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <Label className="text-base font-medium">Colors</Label>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="breadcrumb_item_text_color">Link Color</Label>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                id="breadcrumb_item_text_color"
                                                type="color"
                                                value={store.settings.theme?.breadcrumb_item_text_color || '#6B7280'}
                                                onChange={(e) => handleThemeChange('breadcrumb_item_text_color', e.target.value)}
                                                className="w-20 h-10 p-1 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={store.settings.theme?.breadcrumb_item_text_color || '#6B7280'}
                                                onChange={(e) => handleThemeChange('breadcrumb_item_text_color', e.target.value)}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="breadcrumb_item_hover_color">Hover Color</Label>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                id="breadcrumb_item_hover_color"
                                                type="color"
                                                value={store.settings.theme?.breadcrumb_item_hover_color || '#374151'}
                                                onChange={(e) => handleThemeChange('breadcrumb_item_hover_color', e.target.value)}
                                                className="w-20 h-10 p-1 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={store.settings.theme?.breadcrumb_item_hover_color || '#374151'}
                                                onChange={(e) => handleThemeChange('breadcrumb_item_hover_color', e.target.value)}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="breadcrumb_active_item_color">Current Page Color</Label>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                id="breadcrumb_active_item_color"
                                                type="color"
                                                value={store.settings.theme?.breadcrumb_active_item_color || '#111827'}
                                                onChange={(e) => handleThemeChange('breadcrumb_active_item_color', e.target.value)}
                                                className="w-20 h-10 p-1 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={store.settings.theme?.breadcrumb_active_item_color || '#111827'}
                                                onChange={(e) => handleThemeChange('breadcrumb_active_item_color', e.target.value)}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="breadcrumb_separator_color">Separator Color</Label>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                id="breadcrumb_separator_color"
                                                type="color"
                                                value={store.settings.theme?.breadcrumb_separator_color || '#9CA3AF'}
                                                onChange={(e) => handleThemeChange('breadcrumb_separator_color', e.target.value)}
                                                className="w-20 h-10 p-1 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={store.settings.theme?.breadcrumb_separator_color || '#9CA3AF'}
                                                onChange={(e) => handleThemeChange('breadcrumb_separator_color', e.target.value)}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <Label className="text-base font-medium">Typography</Label>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="breadcrumb_font_size">Font Size (Desktop)</Label>
                                        <Select
                                            value={store.settings.theme?.breadcrumb_font_size || '0.875rem'}
                                            onValueChange={(value) => handleThemeChange('breadcrumb_font_size', value)}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0.75rem">Extra Small (12px)</SelectItem>
                                                <SelectItem value="0.875rem">Small (14px)</SelectItem>
                                                <SelectItem value="1rem">Medium (16px)</SelectItem>
                                                <SelectItem value="1.125rem">Large (18px)</SelectItem>
                                                <SelectItem value="1.25rem">Extra Large (20px)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="breadcrumb_mobile_font_size">Font Size (Mobile)</Label>
                                        <Select
                                            value={store.settings.theme?.breadcrumb_mobile_font_size || '0.75rem'}
                                            onValueChange={(value) => handleThemeChange('breadcrumb_mobile_font_size', value)}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0.625rem">Extra Small (10px)</SelectItem>
                                                <SelectItem value="0.75rem">Small (12px)</SelectItem>
                                                <SelectItem value="0.875rem">Medium (14px)</SelectItem>
                                                <SelectItem value="1rem">Large (16px)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="breadcrumb_font_weight">Font Weight</Label>
                                        <Select
                                            value={store.settings.theme?.breadcrumb_font_weight || '400'}
                                            onValueChange={(value) => handleThemeChange('breadcrumb_font_weight', value)}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="300">Light (300)</SelectItem>
                                                <SelectItem value="400">Normal (400)</SelectItem>
                                                <SelectItem value="500">Medium (500)</SelectItem>
                                                <SelectItem value="600">Semi Bold (600)</SelectItem>
                                                <SelectItem value="700">Bold (700)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
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

                    <Card className="material-elevation-1 border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Checkout Page</CardTitle>
                            <CardDescription>Customize the appearance and flow of your checkout page.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Step Count Configuration */}
                            <div className="p-4 border rounded-lg space-y-4">
                                <div>
                                    <Label htmlFor="checkout_steps_count" className="text-base font-medium">Checkout Steps</Label>
                                    <p className="text-sm text-gray-500">Choose how many steps to display in the checkout process.</p>
                                </div>
                                <Select
                                    value={String(store.settings?.checkout_steps_count || 3)}
                                    onValueChange={(value) => handleSettingsChange('checkout_steps_count', parseInt(value))}
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 Step (Single Page)</SelectItem>
                                        <SelectItem value="2">2 Steps</SelectItem>
                                        <SelectItem value="3">3 Steps</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Step Names Configuration */}
                                {store.settings?.checkout_steps_count > 1 && (
                                    <div className="mt-4 space-y-3">
                                        <Label className="text-sm font-medium">Step Names</Label>
                                        <p className="text-xs text-gray-500">Customize the names displayed for each step in the checkout process.</p>

                                        {store.settings?.checkout_steps_count === 2 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <Label htmlFor="checkout_2step_step1_name" className="text-xs">Step 1 Name</Label>
                                                    <Input
                                                        id="checkout_2step_step1_name"
                                                        value={store.settings?.checkout_2step_step1_name || 'Information'}
                                                        onChange={(e) => handleSettingsChange('checkout_2step_step1_name', e.target.value)}
                                                        placeholder="Information"
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="checkout_2step_step2_name" className="text-xs">Step 2 Name</Label>
                                                    <Input
                                                        id="checkout_2step_step2_name"
                                                        value={store.settings?.checkout_2step_step2_name || 'Payment'}
                                                        onChange={(e) => handleSettingsChange('checkout_2step_step2_name', e.target.value)}
                                                        placeholder="Payment"
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {store.settings?.checkout_steps_count === 3 && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div>
                                                    <Label htmlFor="checkout_3step_step1_name" className="text-xs">Step 1 Name</Label>
                                                    <Input
                                                        id="checkout_3step_step1_name"
                                                        value={store.settings?.checkout_3step_step1_name || 'Information'}
                                                        onChange={(e) => handleSettingsChange('checkout_3step_step1_name', e.target.value)}
                                                        placeholder="Information"
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="checkout_3step_step2_name" className="text-xs">Step 2 Name</Label>
                                                    <Input
                                                        id="checkout_3step_step2_name"
                                                        value={store.settings?.checkout_3step_step2_name || 'Shipping'}
                                                        onChange={(e) => handleSettingsChange('checkout_3step_step2_name', e.target.value)}
                                                        placeholder="Shipping"
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="checkout_3step_step3_name" className="text-xs">Step 3 Name</Label>
                                                    <Input
                                                        id="checkout_3step_step3_name"
                                                        value={store.settings?.checkout_3step_step3_name || 'Payment'}
                                                        onChange={(e) => handleSettingsChange('checkout_3step_step3_name', e.target.value)}
                                                        placeholder="Payment"
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Step Indicator Styling */}
                            <div className="space-y-4">
                                <Label className="text-base font-medium">Step Indicator Styling</Label>

                                <div>
                                    <Label htmlFor="checkout_step_indicator_style">Indicator Style</Label>
                                    <Select
                                        value={store.settings?.checkout_step_indicator_style || 'circles'}
                                        onValueChange={(value) => handleSettingsChange('checkout_step_indicator_style', value)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="circles">Circles</SelectItem>
                                            <SelectItem value="bars">Progress Bars</SelectItem>
                                            <SelectItem value="numbers">Numbered Steps</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="checkout_step_indicator_active_color">Active Step Color</Label>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                id="checkout_step_indicator_active_color"
                                                type="color"
                                                value={store.settings?.checkout_step_indicator_active_color || '#007bff'}
                                                onChange={(e) => handleSettingsChange('checkout_step_indicator_active_color', e.target.value)}
                                                className="w-20 h-10 p-1 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={store.settings?.checkout_step_indicator_active_color || '#007bff'}
                                                onChange={(e) => handleSettingsChange('checkout_step_indicator_active_color', e.target.value)}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="checkout_step_indicator_inactive_color">Inactive Step Color</Label>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                id="checkout_step_indicator_inactive_color"
                                                type="color"
                                                value={store.settings?.checkout_step_indicator_inactive_color || '#D1D5DB'}
                                                onChange={(e) => handleSettingsChange('checkout_step_indicator_inactive_color', e.target.value)}
                                                className="w-20 h-10 p-1 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={store.settings?.checkout_step_indicator_inactive_color || '#D1D5DB'}
                                                onChange={(e) => handleSettingsChange('checkout_step_indicator_inactive_color', e.target.value)}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="checkout_step_indicator_completed_color">Completed Step Color</Label>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                id="checkout_step_indicator_completed_color"
                                                type="color"
                                                value={store.settings?.checkout_step_indicator_completed_color || '#10B981'}
                                                onChange={(e) => handleSettingsChange('checkout_step_indicator_completed_color', e.target.value)}
                                                className="w-20 h-10 p-1 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={store.settings?.checkout_step_indicator_completed_color || '#10B981'}
                                                onChange={(e) => handleSettingsChange('checkout_step_indicator_completed_color', e.target.value)}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Section Styling */}
                            <div className="space-y-4">
                                <Label className="text-base font-medium">Section Styling</Label>
                                <p className="text-sm text-gray-500">Customize the appearance of checkout sections (Shipping Address, Payment Method, etc.).</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="checkout_section_title_color">Section Title Color</Label>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                id="checkout_section_title_color"
                                                type="color"
                                                value={store.settings?.checkout_section_title_color || '#111827'}
                                                onChange={(e) => handleSettingsChange('checkout_section_title_color', e.target.value)}
                                                className="w-20 h-10 p-1 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={store.settings?.checkout_section_title_color || '#111827'}
                                                onChange={(e) => handleSettingsChange('checkout_section_title_color', e.target.value)}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="checkout_section_title_size">Section Title Size</Label>
                                        <Select
                                            value={store.settings?.checkout_section_title_size || '1.25rem'}
                                            onValueChange={(value) => handleSettingsChange('checkout_section_title_size', value)}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0.875rem">Small (14px)</SelectItem>
                                                <SelectItem value="1rem">Medium (16px)</SelectItem>
                                                <SelectItem value="1.125rem">Large (18px)</SelectItem>
                                                <SelectItem value="1.25rem">X-Large (20px)</SelectItem>
                                                <SelectItem value="1.5rem">2X-Large (24px)</SelectItem>
                                                <SelectItem value="1.875rem">3X-Large (30px)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="checkout_section_bg_color">Section Background Color</Label>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                id="checkout_section_bg_color"
                                                type="color"
                                                value={store.settings?.checkout_section_bg_color || '#FFFFFF'}
                                                onChange={(e) => handleSettingsChange('checkout_section_bg_color', e.target.value)}
                                                className="w-20 h-10 p-1 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={store.settings?.checkout_section_bg_color || '#FFFFFF'}
                                                onChange={(e) => handleSettingsChange('checkout_section_bg_color', e.target.value)}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="checkout_section_border_color">Section Border Color</Label>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                id="checkout_section_border_color"
                                                type="color"
                                                value={store.settings?.checkout_section_border_color || '#E5E7EB'}
                                                onChange={(e) => handleSettingsChange('checkout_section_border_color', e.target.value)}
                                                className="w-20 h-10 p-1 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={store.settings?.checkout_section_border_color || '#E5E7EB'}
                                                onChange={(e) => handleSettingsChange('checkout_section_border_color', e.target.value)}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="material-elevation-1 border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Checkout Layout Configuration</CardTitle>
                            <CardDescription>Define the column layout and section order for each checkout step configuration.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>How it works:</strong> Based on your selected step count above ({store.settings?.checkout_steps_count || 3} step{(store.settings?.checkout_steps_count || 3) > 1 ? 's' : ''}), configure the layout below.
                                    Available sections: Account, Shipping Address, Shipping Method, Billing Address, Delivery Options, Payment Method, Coupon, Order Summary.
                                </p>
                            </div>

                            {/* 1-Step Layout */}
                            {store.settings?.checkout_steps_count === 1 && (
                            <div className="p-4 border rounded-lg space-y-4">
                                <div>
                                    <Label className="text-base font-medium">1-Step Checkout Layout</Label>
                                    <p className="text-sm text-gray-500">All sections on one page</p>
                                </div>

                                <div>
                                    <Label htmlFor="checkout_1step_columns">Number of Columns</Label>
                                    <Select
                                        value={String(store.settings?.checkout_1step_columns || 3)}
                                        onValueChange={(value) => handleColumnCountChange('1step', parseInt(value))}
                                    >
                                        <SelectTrigger className="w-48 mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 Column</SelectItem>
                                            <SelectItem value="2">2 Columns</SelectItem>
                                            <SelectItem value="3">3 Columns</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Drag and Drop Section Ordering - Unified DndContext */}
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={(event) => handleUnifiedDragEnd(event, '1step')}
                                >
                                    <div className={`grid gap-4 mt-4 ${store.settings?.checkout_1step_columns === 1 ? 'grid-cols-1' : store.settings?.checkout_1step_columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                        {['column1', 'column2', 'column3'].slice(0, store.settings?.checkout_1step_columns || 3).map((columnKey, idx) => {
                                            const fullLayout = store.settings?.checkout_1step_layout || defaultSectionLayout['1step'];
                                            const stepLayout = fullLayout.step1 || {};
                                            const columnSections = stepLayout[columnKey] || [];
                                            const allSections = [...(stepLayout.column1 || []), ...(stepLayout.column2 || []), ...(stepLayout.column3 || [])];

                                            return (
                                                <div key={columnKey} className="space-y-2">
                                                    <Label className="text-sm font-semibold">Column {idx + 1}</Label>
                                                    <SortableContext
                                                        items={allSections}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <DroppableColumn
                                                            id={`step1-${columnKey}`}
                                                            className="space-y-2 min-h-[100px] p-2 bg-gray-50 rounded border-2 border-dashed"
                                                        >
                                                            {columnSections.map((section) => (
                                                                <SortableSection key={section} id={section} section={section} />
                                                            ))}
                                                            {columnSections.length === 0 && (
                                                                <p className="text-sm text-gray-400 text-center py-4">Drop sections here</p>
                                                            )}
                                                        </DroppableColumn>
                                                    </SortableContext>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </DndContext>
                            </div>
                            )}

                            {store.settings?.checkout_steps_count === 2 && <Separator />}

                            {/* 2-Step Layout */}
                            {store.settings?.checkout_steps_count === 2 && (
                            <div className="p-4 border rounded-lg space-y-6">
                                <div>
                                    <Label className="text-base font-medium">2-Step Checkout Layout</Label>
                                    <p className="text-sm text-gray-500">{store.settings?.checkout_2step_step1_name || 'Information'} → {store.settings?.checkout_2step_step2_name || 'Payment'}</p>
                                </div>

                                <div>
                                    <Label htmlFor="checkout_2step_columns">Number of Columns</Label>
                                    <Select
                                        value={String(store.settings?.checkout_2step_columns || 2)}
                                        onValueChange={(value) => handleColumnCountChange('2step', parseInt(value))}
                                    >
                                        <SelectTrigger className="w-48 mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 Column</SelectItem>
                                            <SelectItem value="2">2 Columns</SelectItem>
                                            <SelectItem value="3">3 Columns</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Step 1 Layout */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-blue-700">Step 1: {store.settings?.checkout_2step_step1_name || 'Information'}</Label>
                                    <div className={`grid gap-4 ${store.settings?.checkout_2step_columns === 1 ? 'grid-cols-1' : store.settings?.checkout_2step_columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                        {['column1', 'column2', 'column3'].slice(0, store.settings?.checkout_2step_columns || 2).map((columnKey, idx) => {
                                            const fullLayout = store.settings?.checkout_2step_layout || defaultSectionLayout['2step'];
                                            const stepLayout = fullLayout.step1 || {};
                                            const columnSections = stepLayout[columnKey] || [];

                                            return (
                                                <div key={columnKey} className="space-y-2">
                                                    <Label className="text-xs text-gray-600">Column {idx + 1}</Label>
                                                    <DndContext
                                                        sensors={sensors}
                                                        collisionDetection={closestCenter}
                                                        onDragEnd={(event) => handleDragEnd(event, '2step', 'step1', columnKey)}
                                                    >
                                                        <SortableContext
                                                            items={columnSections}
                                                            strategy={verticalListSortingStrategy}
                                                        >
                                                            <div className="space-y-2 min-h-[100px] p-2 bg-blue-50 rounded border-2 border-dashed border-blue-200">
                                                                {columnSections.map((section) => (
                                                                    <SortableSection key={section} id={section} section={section} />
                                                                ))}
                                                            </div>
                                                        </SortableContext>
                                                    </DndContext>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Step 2 Layout */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-green-700">Step 2: {store.settings?.checkout_2step_step2_name || 'Payment'}</Label>
                                    <div className={`grid gap-4 ${store.settings?.checkout_2step_columns === 1 ? 'grid-cols-1' : store.settings?.checkout_2step_columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                        {['column1', 'column2', 'column3'].slice(0, store.settings?.checkout_2step_columns || 2).map((columnKey, idx) => {
                                            const fullLayout = store.settings?.checkout_2step_layout || defaultSectionLayout['2step'];
                                            const stepLayout = fullLayout.step2 || {};
                                            const columnSections = stepLayout[columnKey] || [];

                                            return (
                                                <div key={columnKey} className="space-y-2">
                                                    <Label className="text-xs text-gray-600">Column {idx + 1}</Label>
                                                    <DndContext
                                                        sensors={sensors}
                                                        collisionDetection={closestCenter}
                                                        onDragEnd={(event) => handleDragEnd(event, '2step', 'step2', columnKey)}
                                                    >
                                                        <SortableContext
                                                            items={columnSections}
                                                            strategy={verticalListSortingStrategy}
                                                        >
                                                            <div className="space-y-2 min-h-[100px] p-2 bg-green-50 rounded border-2 border-dashed border-green-200">
                                                                {columnSections.map((section) => (
                                                                    <SortableSection key={section} id={section} section={section} />
                                                                ))}
                                                            </div>
                                                        </SortableContext>
                                                    </DndContext>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            )}

                            {store.settings?.checkout_steps_count === 3 && <Separator />}

                            {/* 3-Step Layout */}
                            {store.settings?.checkout_steps_count === 3 && (
                            <div className="p-4 border rounded-lg space-y-6">
                                <div>
                                    <Label className="text-base font-medium">3-Step Checkout Layout</Label>
                                    <p className="text-sm text-gray-500">{store.settings?.checkout_3step_step1_name || 'Information'} → {store.settings?.checkout_3step_step2_name || 'Shipping'} → {store.settings?.checkout_3step_step3_name || 'Payment'}</p>
                                </div>

                                <div>
                                    <Label htmlFor="checkout_3step_columns">Number of Columns</Label>
                                    <Select
                                        value={String(store.settings?.checkout_3step_columns || 2)}
                                        onValueChange={(value) => handleColumnCountChange('3step', parseInt(value))}
                                    >
                                        <SelectTrigger className="w-48 mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 Column</SelectItem>
                                            <SelectItem value="2">2 Columns</SelectItem>
                                            <SelectItem value="3">3 Columns</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Step 1 Layout */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-blue-700">Step 1: {store.settings?.checkout_3step_step1_name || 'Information'}</Label>
                                    <div className={`grid gap-4 ${store.settings?.checkout_3step_columns === 1 ? 'grid-cols-1' : store.settings?.checkout_3step_columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                        {['column1', 'column2', 'column3'].slice(0, store.settings?.checkout_3step_columns || 2).map((columnKey, idx) => {
                                            const fullLayout = store.settings?.checkout_3step_layout || defaultSectionLayout['3step'];
                                            const stepLayout = fullLayout.step1 || {};
                                            const columnSections = stepLayout[columnKey] || [];

                                            return (
                                                <div key={columnKey} className="space-y-2">
                                                    <Label className="text-xs text-gray-600">Column {idx + 1}</Label>
                                                    <DndContext
                                                        sensors={sensors}
                                                        collisionDetection={closestCenter}
                                                        onDragEnd={(event) => handleDragEnd(event, '3step', 'step1', columnKey)}
                                                    >
                                                        <SortableContext
                                                            items={columnSections}
                                                            strategy={verticalListSortingStrategy}
                                                        >
                                                            <div className="space-y-2 min-h-[100px] p-2 bg-blue-50 rounded border-2 border-dashed border-blue-200">
                                                                {columnSections.map((section) => (
                                                                    <SortableSection key={section} id={section} section={section} />
                                                                ))}
                                                            </div>
                                                        </SortableContext>
                                                    </DndContext>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Step 2 Layout */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-purple-700">Step 2: {store.settings?.checkout_3step_step2_name || 'Shipping'}</Label>
                                    <div className={`grid gap-4 ${store.settings?.checkout_3step_columns === 1 ? 'grid-cols-1' : store.settings?.checkout_3step_columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                        {['column1', 'column2', 'column3'].slice(0, store.settings?.checkout_3step_columns || 2).map((columnKey, idx) => {
                                            const fullLayout = store.settings?.checkout_3step_layout || defaultSectionLayout['3step'];
                                            const stepLayout = fullLayout.step2 || {};
                                            const columnSections = stepLayout[columnKey] || [];

                                            return (
                                                <div key={columnKey} className="space-y-2">
                                                    <Label className="text-xs text-gray-600">Column {idx + 1}</Label>
                                                    <DndContext
                                                        sensors={sensors}
                                                        collisionDetection={closestCenter}
                                                        onDragEnd={(event) => handleDragEnd(event, '3step', 'step2', columnKey)}
                                                    >
                                                        <SortableContext
                                                            items={columnSections}
                                                            strategy={verticalListSortingStrategy}
                                                        >
                                                            <div className="space-y-2 min-h-[100px] p-2 bg-purple-50 rounded border-2 border-dashed border-purple-200">
                                                                {columnSections.map((section) => (
                                                                    <SortableSection key={section} id={section} section={section} />
                                                                ))}
                                                            </div>
                                                        </SortableContext>
                                                    </DndContext>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Step 3 Layout */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-green-700">Step 3: {store.settings?.checkout_3step_step3_name || 'Payment'}</Label>
                                    <div className={`grid gap-4 ${store.settings?.checkout_3step_columns === 1 ? 'grid-cols-1' : store.settings?.checkout_3step_columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                        {['column1', 'column2', 'column3'].slice(0, store.settings?.checkout_3step_columns || 2).map((columnKey, idx) => {
                                            const fullLayout = store.settings?.checkout_3step_layout || defaultSectionLayout['3step'];
                                            const stepLayout = fullLayout.step3 || {};
                                            const columnSections = stepLayout[columnKey] || [];

                                            return (
                                                <div key={columnKey} className="space-y-2">
                                                    <Label className="text-xs text-gray-600">Column {idx + 1}</Label>
                                                    <DndContext
                                                        sensors={sensors}
                                                        collisionDetection={closestCenter}
                                                        onDragEnd={(event) => handleDragEnd(event, '3step', 'step3', columnKey)}
                                                    >
                                                        <SortableContext
                                                            items={columnSections}
                                                            strategy={verticalListSortingStrategy}
                                                        >
                                                            <div className="space-y-2 min-h-[100px] p-2 bg-green-50 rounded border-2 border-dashed border-green-200">
                                                                {columnSections.map((section) => (
                                                                    <SortableSection key={section} id={section} section={section} />
                                                                ))}
                                                            </div>
                                                        </SortableContext>
                                                    </DndContext>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            )}
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