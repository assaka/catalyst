/**
 * Category Slot Components
 * Register category-specific slot components with the unified registry
 */

import React from 'react';
import { createSlotComponent, registerSlotComponent } from './SlotComponentRegistry';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import { useStore } from '@/contexts/StoreProvider';
import { UnifiedSlotRenderer } from './UnifiedSlotRenderer';

// Breadcrumb Navigation Component
const BreadcrumbRenderer = createSlotComponent({
  name: 'BreadcrumbRenderer',
  render: ({ slot, className, styles }) => (
    <div className={className || slot.className} style={styles || slot.styles}>
      <nav className="flex items-center space-x-2 text-sm text-gray-600">
        <span>Home</span>
        <span>/</span>
        <span>Category</span>
        <span>/</span>
        <span className="font-medium text-gray-900">Current Page</span>
      </nav>
    </div>
  )
});

// Active Filters Component
const ActiveFilters = createSlotComponent({
  name: 'ActiveFilters',
  render: ({ slot, className, styles }) => (
    <div className={className || slot.className} style={styles || slot.styles}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Active Filters:</span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
          Brand: Apple ×
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
          Price: $100-$500 ×
        </span>
      </div>
    </div>
  )
});

// Layered Navigation Component
const LayeredNavigation = createSlotComponent({
  name: 'LayeredNavigation',
  render: ({ slot, className, styles }) => (
    <div className={className || slot.className} style={styles || slot.styles}>
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Filter By</h3>
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Price</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm">Under $25</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm">$25 - $50</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
});

// Sort Selector Component
const SortSelector = createSlotComponent({
  name: 'SortSelector',
  render: ({ slot, className, styles }) => (
    <div className={className || slot.className} style={styles || slot.styles}>
      <select className="border border-gray-300 rounded px-3 py-1 text-sm bg-white">
        <option>Sort by: Featured</option>
        <option>Price: Low to High</option>
        <option>Price: High to Low</option>
        <option>Name: A to Z</option>
      </select>
    </div>
  )
});

// Pagination Component
const PaginationComponent = createSlotComponent({
  name: 'PaginationComponent',
  render: ({ slot, className, styles }) => (
    <div className={className || slot.className} style={styles || slot.styles}>
      <div className="flex items-center justify-center space-x-2">
        <button className="px-3 py-1 border rounded">Previous</button>
        <span className="px-3 py-1">1 of 10</span>
        <button className="px-3 py-1 border rounded">Next</button>
      </div>
    </div>
  )
});

// CMS Block Renderer (already exists, just register it)
const CmsBlockComponent = createSlotComponent({
  name: 'CmsBlockRenderer',
  render: ({ slot, className, styles }) => {
    const position = slot.metadata?.cmsPosition || slot.id || 'default';
    return (
      <div className={className || slot.className} style={styles || slot.styles}>
        <CmsBlockRenderer position={position} />
      </div>
    );
  }
});

// Helper function to generate grid classes from store settings
const getGridClasses = (storeSettings) => {
  const gridConfig = storeSettings?.product_grid;

  if (!gridConfig) {
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
  }

  const breakpoints = gridConfig.breakpoints || {};
  const customBreakpoints = gridConfig.customBreakpoints || [];
  let classes = [];

  // Standard breakpoints
  Object.entries(breakpoints).forEach(([breakpoint, columns]) => {
    if (columns > 0) {
      if (breakpoint === 'default') {
        if (columns === 1) classes.push('grid-cols-1');
        else if (columns === 2) classes.push('grid-cols-2');
      } else {
        if (columns === 1) classes.push(`${breakpoint}:grid-cols-1`);
        else if (columns === 2) classes.push(`${breakpoint}:grid-cols-2`);
        else if (columns === 3) classes.push(`${breakpoint}:grid-cols-3`);
        else if (columns === 4) classes.push(`${breakpoint}:grid-cols-4`);
        else if (columns === 5) classes.push(`${breakpoint}:grid-cols-5`);
        else if (columns === 6) classes.push(`${breakpoint}:grid-cols-6`);
      }
    }
  });

  // Custom breakpoints
  customBreakpoints.forEach(({ name, columns }) => {
    if (name && columns > 0) {
      if (columns === 1) classes.push(`${name}:grid-cols-1`);
      else if (columns === 2) classes.push(`${name}:grid-cols-2`);
      else if (columns === 3) classes.push(`${name}:grid-cols-3`);
      else if (columns === 4) classes.push(`${name}:grid-cols-4`);
      else if (columns === 5) classes.push(`${name}:grid-cols-5`);
      else if (columns === 6) classes.push(`${name}:grid-cols-6`);
    }
  });

  return classes.length > 0 ? classes.join(' ') : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
};

// Product Items Grid - Renders with dynamic grid from admin settings
const ProductItemsGrid = createSlotComponent({
  name: 'ProductItemsGrid',
  render: ({ slot, className, styles, context }) => {
    const { settings: storeSettings } = useStore();
    const gridClasses = getGridClasses(storeSettings);

    return (
      <div
        className={`grid ${gridClasses} gap-4 ${className || slot.className || ''}`}
        style={styles || slot.styles}
      >
        {/* Render child slots (product cards) */}
        <UnifiedSlotRenderer
          slots={context?.slots || {}}
          parentId={slot.id}
          viewMode={context?.viewMode || 'grid'}
          context="editor"
        />
      </div>
    );
  }
});

// Register all components
registerSlotComponent('BreadcrumbRenderer', BreadcrumbRenderer);
registerSlotComponent('ActiveFilters', ActiveFilters);
registerSlotComponent('LayeredNavigation', LayeredNavigation);
registerSlotComponent('SortSelector', SortSelector);
registerSlotComponent('PaginationComponent', PaginationComponent);
registerSlotComponent('CmsBlockRenderer', CmsBlockComponent);
registerSlotComponent('ProductItemsGrid', ProductItemsGrid);

export {
  BreadcrumbRenderer,
  ActiveFilters,
  LayeredNavigation,
  SortSelector,
  PaginationComponent,
  CmsBlockComponent,
  ProductItemsGrid
};