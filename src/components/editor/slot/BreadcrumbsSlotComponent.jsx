/**
 * Breadcrumbs Slot Component
 * Unified breadcrumbs component for both category and product pages
 */

import React from 'react';
import { createSlotComponent, registerSlotComponent } from './SlotComponentRegistry';
import Breadcrumbs from '@/components/shared/Breadcrumbs.jsx';
import { buildBreadcrumbs } from '@/utils/breadcrumbUtils';

const BreadcrumbsSlotComponent = createSlotComponent({
  name: 'Breadcrumbs',
  render: (props) => {
    const { slot, categoryContext, productContext } = props;

    // Determine context (category or product)
    const context = categoryContext || productContext;

    console.log('🍞 BreadcrumbsSlotComponent - Full Props:', {
      hasCategoryContext: !!categoryContext,
      hasProductContext: !!productContext,
      categoryContextKeys: categoryContext ? Object.keys(categoryContext) : [],
      settingsInContext: categoryContext?.settings,
      themeInSettings: categoryContext?.settings?.theme
    });

    if (!context) return null;

    const { category, product, store, categories = [], settings = {} } = context;

    console.log('🎨 Using context:', {
      whichContext: category ? 'category' : (product ? 'product' : 'unknown'),
      hasSettings: !!settings,
      hasTheme: !!settings?.theme,
      themeColors: {
        itemTextColor: settings?.theme?.breadcrumb_item_text_color,
        itemHoverColor: settings?.theme?.breadcrumb_item_hover_color,
        activeItemColor: settings?.theme?.breadcrumb_active_item_color
      }
    });

    // Build breadcrumb items based on context
    const pageType = category ? 'category' : 'product';
    const contextData = category || product;
    const breadcrumbItems = buildBreadcrumbs(
      pageType,
      contextData,
      store?.slug || store?.code,
      categories,
      settings
    );

    if (!breadcrumbItems || breadcrumbItems.length === 0) return null;

    // Get configuration: priority is store theme settings > slot metadata > defaults
    const storeTheme = settings?.theme || {};
    const slotMetadata = slot?.metadata || {};

    console.log('🔧 Building config from:', {
      storeThemeColors: {
        itemTextColor: storeTheme.breadcrumb_item_text_color,
        itemHoverColor: storeTheme.breadcrumb_item_hover_color,
        activeItemColor: storeTheme.breadcrumb_active_item_color
      },
      slotMetadata: slotMetadata
    });

    const config = {
      showHomeIcon: storeTheme.breadcrumb_show_home_icon ?? slotMetadata.showHomeIcon ?? true,
      itemTextColor: storeTheme.breadcrumb_item_text_color || slotMetadata.itemTextColor || '#6B7280',
      itemHoverColor: storeTheme.breadcrumb_item_hover_color || slotMetadata.itemHoverColor || '#374151',
      activeItemColor: storeTheme.breadcrumb_active_item_color || slotMetadata.activeItemColor || '#111827',
      separatorColor: storeTheme.breadcrumb_separator_color || slotMetadata.separatorColor || '#9CA3AF',
      fontSize: storeTheme.breadcrumb_font_size || slotMetadata.fontSize || '0.875rem',
      mobileFontSize: storeTheme.breadcrumb_mobile_font_size || slotMetadata.mobileFontSize || '0.75rem',
      fontWeight: storeTheme.breadcrumb_font_weight || slotMetadata.fontWeight || '400'
    };

    console.log('✅ Final config:', config);

    return <Breadcrumbs items={breadcrumbItems} config={config} />;
  }
});

// Register the component
registerSlotComponent('Breadcrumbs', BreadcrumbsSlotComponent);

export default BreadcrumbsSlotComponent;
