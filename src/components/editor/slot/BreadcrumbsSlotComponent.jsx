/**
 * Breadcrumbs Slot Component
 * Unified breadcrumbs component for both category and product pages
 */

import React from 'react';
import { createSlotComponent, registerSlotComponent } from './SlotComponentRegistry';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { buildBreadcrumbs } from '@/utils/breadcrumbUtils';

const BreadcrumbsSlotComponent = createSlotComponent({
  name: 'Breadcrumbs',
  render: (props) => {
    const { slot, categoryContext, productContext } = props;

    // Determine context (category or product)
    const context = categoryContext || productContext;
    if (!context) return null;

    const { category, product, store, categories = [], settings = {} } = context;

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

    // Get configuration from slot metadata
    const config = slot?.metadata || {};

    return <Breadcrumbs items={breadcrumbItems} config={config} />;
  }
});

// Register the component
registerSlotComponent('Breadcrumbs', BreadcrumbsSlotComponent);

export default BreadcrumbsSlotComponent;
