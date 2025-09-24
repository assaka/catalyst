import React, { useState, useMemo, useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { SlotManager } from '@/utils/slotUtils';
import { filterSlotsByViewMode, sortSlotsByGridCoordinates } from '@/hooks/useSlotConfiguration';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import ProductItemCard from '@/components/storefront/ProductItemCard';
import LayeredNavigation from '@/components/storefront/LayeredNavigation';
import BreadcrumbRenderer from '@/components/storefront/BreadcrumbRenderer';

/**
 * CategorySlotRenderer - Renders slots with full category functionality
 * Follows the same structure as CartSlotRenderer for consistency
 */
export function CategorySlotRenderer({
  slots,
  parentId = null,
  viewMode = 'grid',
  categoryContext = {}
}) {
  // Helper function to generate dynamic grid classes
  const getDynamicGridClasses = (slot) => {
    if (viewMode === 'list') {
      return 'space-y-4';
    }

    // Use store settings for grid configuration
    const gridConfig = settings?.product_grid;

    if (gridConfig) {
      let classes = ['grid', 'gap-4'];

      // Mobile classes
      if (gridConfig.mobile === 1) classes.push('grid-cols-1');
      else if (gridConfig.mobile === 2) classes.push('grid-cols-2');
      else classes.push('grid-cols-1');

      // Tablet classes
      if (gridConfig.tablet === 1) classes.push('sm:grid-cols-1');
      else if (gridConfig.tablet === 2) classes.push('sm:grid-cols-2');
      else if (gridConfig.tablet === 3) classes.push('sm:grid-cols-3');
      else if (gridConfig.tablet === 4) classes.push('sm:grid-cols-4');
      else classes.push('sm:grid-cols-2');

      // Desktop classes
      if (gridConfig.desktop === 1) classes.push('lg:grid-cols-1');
      else if (gridConfig.desktop === 2) classes.push('lg:grid-cols-2');
      else if (gridConfig.desktop === 3) classes.push('lg:grid-cols-3');
      else if (gridConfig.desktop === 4) classes.push('lg:grid-cols-4');
      else if (gridConfig.desktop === 5) classes.push('lg:grid-cols-5');
      else if (gridConfig.desktop === 6) classes.push('lg:grid-cols-6');
      else classes.push('lg:grid-cols-2');

      return classes.join(' ');
    }

    // Default fallback
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4';
  };

  const {
    category,
    products = [],
    allProducts = [],
    filters = {},
    filterableAttributes = [],
    sortOption,
    searchQuery,
    currentPage,
    totalPages,
    subcategories = [],
    breadcrumbs = [],
    selectedFilters = {},
    priceRange = {},
    currencySymbol = '$',
    settings = {},
    store,
    categories = [],
    taxes,
    selectedCountry,
    productLabels = [],
    handleFilterChange,
    handleSortChange,
    handleSearchChange,
    handlePageChange,
    clearFilters,
    formatDisplayPrice,
    getProductImageUrl,
    navigate,
    onProductClick
  } = categoryContext;

  // Check if filters should be enabled
  const filtersEnabled = settings?.enable_product_filters !== false && filterableAttributes?.length > 0;

  // Get child slots for current parent
  let childSlots = SlotManager.getChildSlots(slots, parentId);

  // Filter by viewMode if applicable
  const filteredSlots = filterSlotsByViewMode(childSlots, viewMode);

  // Sort slots using grid coordinates for precise positioning
  const sortedSlots = sortSlotsByGridCoordinates(filteredSlots);

  // Only log final render order for products_container
  if (parentId === 'products_container') {
    console.log('🎬 Rendering order:', sortedSlots.map(s => `${s.id}(row${s.position?.row})`).join(' -> '));
  }

  // Helper function to get child slots of a parent
  const renderChildSlots = (allSlots, parentId) => {
    if (!allSlots) return [];

    const childSlots = Object.values(allSlots).filter(slot =>
      slot.parentId === parentId
    );

    // Sort by position for proper rendering order
    return childSlots.sort((a, b) => {
      const posA = a.position || { col: 1, row: 1 };
      const posB = b.position || { col: 1, row: 1 };

      if (posA.row !== posB.row) {
        return posA.row - posB.row;
      }
      return posA.col - posB.col;
    });
  };

  const renderSlotContent = (slot) => {
    // Extract slot configuration with defaults
    const {
      id,
      type,
      content,
      className = '',
      styles = {},
      parentClassName = '',
      metadata = {}
    } = slot || {};


    // Helper function to wrap content with parent class if needed
    const wrapWithParentClass = (children) => {
      if (parentClassName) {
        return <div className={parentClassName}>{children}</div>;
      }
      return children;
    };

    // Handle category image
    if (id === 'category_image') {
      const imageUrl = category?.image || category?.image_url;

      if (!imageUrl && !content) return null;

      return wrapWithParentClass(
        <div className={className || "relative w-full h-64 mb-6 rounded-lg overflow-hidden"} style={styles}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={category?.name || 'Category'}
              className="w-full h-full object-cover"
            />
          ) : content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : null}
        </div>
      );
    }

    // Handle category header content - with dynamic content from categoryContext
    if (id === 'category_header' || id === 'header' || id === 'category_title') {
      // Use content from slot if provided, otherwise use category name
      const headerContent = category?.name || content || 'Products';

      return wrapWithParentClass(
        <h1 className={className} style={styles}>
          {headerContent}
        </h1>
      );
    }

    if (id === 'category_description' || id === 'header_description') {
      // Use content from slot if provided, otherwise use category description
      const descContent = content || category?.description || '';

      if (!descContent) return null;

      return wrapWithParentClass(
        <p className={className} style={styles}>
          {descContent}
        </p>
      );
    }

    if (id === 'breadcrumbs' || id === 'breadcrumb_container') {
      // Use content from slot if provided, otherwise use Breadcrumb component
      if (content && content.trim()) {
        return wrapWithParentClass(
          <div
            className={className}
            style={styles}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
      }

      // Use unified breadcrumb renderer with auto-generation
      return wrapWithParentClass(
        <BreadcrumbRenderer
          items={breadcrumbs.length > 0 ? breadcrumbs : undefined}
          pageType="category"
          pageData={category}
          storeCode={store?.slug || store?.code}
          categories={categories}
          settings={settings}
          className={className}
        />
      );
    }

    // Search bar
    if (id === 'search_bar') {
      return wrapWithParentClass(
        <div className={className} style={styles}>
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder={content || "Search products..."}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      );
    }

    // Handle layered_navigation slot specifically
    if (id === 'layered_navigation') {
      // Prepare attributes for LayeredNavigation from filterableAttributes
      const attributes = filterableAttributes?.map(attr => ({
        code: attr.code || attr.name,
        name: attr.name || attr.code,
        is_filterable: true,
        options: attr.options || []
      })) || [];

      // Create slot configuration for LayeredNavigation microslots
      const layeredNavSlotConfig = {
        filter_card_header: slots?.filter_card_header || {},
        filter_clear_all_button: slots?.filter_clear_all_button || {},
        filter_active_filters: slots?.filter_active_filters || {},
        filter_active_filters_label: slots?.filter_active_filters_label || {},
        filter_price_section: slots?.filter_price_section || {},
        filter_price_title: slots?.filter_price_title || {},
        filter_attribute_section: slots?.filter_attribute_section || {},
        filter_attribute_title: slots?.filter_attribute_title || {},
        filter_attribute_option: slots?.filter_attribute_option || {},
        filter_option_checkbox: slots?.filter_option_checkbox || {},
        filter_option_label: slots?.filter_option_label || {},
        filter_option_count: slots?.filter_option_count || {}
      };

      return wrapWithParentClass(
        <div className={className} style={styles}>
          <div id="layer_2">
            <LayeredNavigation
              products={allProducts || products}
              attributes={attributes}
              onFilterChange={handleFilterChange}
              slotConfig={layeredNavSlotConfig}
              settings={settings}
            />
          </div>
        </div>
      );
    }

    // Handle active_filters slot from category-config.js
    // Note: Active filters are now handled directly within LayeredNavigation component
    if (id === 'active_filters') {
      return null; // LayeredNavigation handles active filters display
    }

    // Main content container
    if (id === 'main_content_container') {
      return wrapWithParentClass(
        <div className={className || "w-full"} style={styles}>
          <CategorySlotRenderer
            slots={slots}
            parentId={slot.id}
            viewMode={viewMode}
            categoryContext={categoryContext}
          />
        </div>
      );
    }

    // Sorting controls container
    if (id === 'sorting_controls') {
      return wrapWithParentClass(
        <div className={className} style={styles}>
          <CategorySlotRenderer
            slots={slots}
            parentId={slot.id}
            viewMode={viewMode}
            categoryContext={categoryContext}
          />
        </div>
      );
    }

    // Product count info
    if (id === 'product_count_info') {
      const totalProducts = allProducts?.length || 0;
      const startIndex = ((currentPage || 1) - 1) * 12 + 1;
      const endIndex = Math.min(startIndex + (products?.length || 0) - 1, totalProducts);

      return wrapWithParentClass(
        <div className={className} style={styles}>
          {totalProducts > 0 ? (
            `Showing ${startIndex}-${endIndex} of ${totalProducts} products`
          ) : (
            'No products found'
          )}
        </div>
      );
    }

    // Sort selector
    if (id === 'sort_selector') {
      const sortOptions = [
        { value: '', label: 'Default' },
        { value: 'name-asc', label: 'Name A-Z' },
        { value: 'name-desc', label: 'Name Z-A' },
        { value: 'price-asc', label: 'Price Low to High' },
        { value: 'price-desc', label: 'Price High to Low' },
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' }
      ];

      return wrapWithParentClass(
        <div className={className} style={styles}>
          <Label className="text-sm font-medium">Sort by:</Label>
          <select
            value={sortOption || ''}
            onChange={(e) => handleSortChange && handleSortChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // Products grid - render using ProductItemCard component
    if (id === 'products_grid') {
      // Use the className from slot configuration if available, otherwise use dynamic grid
      const dynamicGridClass = getDynamicGridClasses(slot);
      const finalClassName = className || dynamicGridClass;

      // State for preventing duplicate add to cart operations
      const [addingToCartStates, setAddingToCartStates] = useState({});

      // Create slot configuration object for ProductItemCard
      const slotConfig = {
        productTemplate: slots?.product_template || {},
        productImage: slots?.product_image || {},
        productName: slots?.product_name || {},
        productPrice: slots?.product_price || {},
        productComparePrice: slots?.product_compare_price || {},
        productAddToCart: slots?.product_add_to_cart || {}
      };

      return (
        <div className={`${finalClassName} mb-8`} style={styles}>
          {products.map(product => (
            <ProductItemCard
              key={product.id}
              product={product}
              settings={settings}
              store={store}
              taxes={taxes}
              selectedCountry={selectedCountry}
              productLabels={productLabels}
              viewMode={viewMode}
              slotConfig={slotConfig}
              isAddingToCart={addingToCartStates[product.id] || false}
              onAddToCartStateChange={(isAdding) => {
                setAddingToCartStates(prev => ({ ...prev, [product.id]: isAdding }));
              }}
            />
          ))}
        </div>
      );
    }

    // Handle product_item_card slot specifically
    if (id === 'product_item_card') {
      // Get configuration from slot content or use defaults
      const itemsToShow = slot.metadata?.itemsToShow || 3;
      const productsToShow = products.slice(0, itemsToShow);

      // Use the className from slot configuration if available, otherwise use dynamic grid
      const dynamicGridClass = getDynamicGridClasses(slot);
      const finalClassName = className || dynamicGridClass;

      // Create slot configuration object for ProductItemCard
      const slotConfig = {
        productTemplate: slots?.product_template || {},
        productImage: slots?.product_image || {},
        productName: slots?.product_name || {},
        productPrice: slots?.product_price || {},
        productComparePrice: slots?.product_compare_price || {},
        productAddToCart: slots?.product_add_to_cart || {}
      };

      return wrapWithParentClass(
        <div className={`${finalClassName} mb-8`} style={styles}>
          {productsToShow.map(product => (
            <ProductItemCard
              key={product.id}
              product={product}
              settings={settings}
              store={store}
              taxes={taxes}
              selectedCountry={selectedCountry}
              productLabels={productLabels}
              viewMode={viewMode}
              slotConfig={slotConfig}
              onAddToCartStateChange={(isAdding) => {
                console.log('🛒 Product item card - Add to cart state:', isAdding);
              }}
            />
          ))}
        </div>
      );
    }

    // Products container
    if (id === 'products_container') {
      return wrapWithParentClass(
        <div className={className || "w-full"} style={styles}>
          <CategorySlotRenderer
            slots={slots}
            parentId={slot.id}
            viewMode={viewMode}
            categoryContext={categoryContext}
          />
        </div>
      );
    }

    // Pagination container
    if (id === 'pagination_container' || id === 'pagination_controls') {
      if (!totalPages || totalPages <= 1) return null;

      const pages = [];
      const maxPagesToShow = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      // Previous button
      if (currentPage > 1) {
        pages.push(
          <Button
            key="prev"
            variant="outline"
            size="sm"
            onClick={() => handlePageChange && handlePageChange(currentPage - 1)}
          >
            Previous
          </Button>
        );
      }

      // Page numbers
      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange && handlePageChange(i)}
          >
            {i}
          </Button>
        );
      }

      // Next button
      if (currentPage < totalPages) {
        pages.push(
          <Button
            key="next"
            variant="outline"
            size="sm"
            onClick={() => handlePageChange && handlePageChange(currentPage + 1)}
          >
            Next
          </Button>
        );
      }

      return wrapWithParentClass(
        <div className={className} style={styles}>
          {pages}
        </div>
      );
    }

    // Handle container types (grid, flex, container)
    if (type === 'container' || type === 'grid' || type === 'flex') {
      const containerClass = type === 'grid' ? 'grid grid-cols-12 gap-2' :
                            type === 'flex' ? 'flex' : '';
      return (
        <div className={`${containerClass} ${className}`} style={styles}>
          <CategorySlotRenderer
            slots={slots}
            parentId={slot.id}
            viewMode={viewMode}
            categoryContext={categoryContext}
          />
        </div>
      );
    }

    // Handle basic element types
    switch (type) {
      case 'text':
        return (
          <div
            className={className}
            style={styles}
            dangerouslySetInnerHTML={{ __html: content || '' }}
          />
        );

      case 'image':
        return (
          <img
            src={content || 'https://via.placeholder.com/300x200'}
            alt="Category content"
            className={className}
            style={styles}
          />
        );

      case 'button':
        return (
          <Button
            className={className}
            style={styles}
          >
            {content || 'Button'}
          </Button>
        );

      case 'cms_block':
        return (
          <div className={className} style={styles}>
            <CmsBlockRenderer position={slot.metadata?.cmsPosition || 'undefined'} />
          </div>
        );

      case 'breadcrumbs':
        // Use unified breadcrumb renderer with auto-generation
        return wrapWithParentClass(
          <BreadcrumbRenderer
            items={breadcrumbs.length > 0 ? breadcrumbs : undefined}
            pageType="category"
            pageData={category}
            storeCode={store?.slug || store?.code}
            categories={categories}
            settings={settings}
            className={className}
          />
        );

      default:
        // For any unknown slot type, render as text
        return (
          <div className={className} style={styles}>
            {content || `[${type} slot]`}
          </div>
        );
    }
  };

  // Main render function - follows CartSlotRenderer structure
  return (
    <>
      {sortedSlots.map((slot) => {
        // Handle number, object with viewMode, and Tailwind responsive classes
        let colSpanClass = 'col-span-12'; // default Tailwind class
        let gridColumn = 'span 12 / span 12'; // default grid style

        if (typeof slot.colSpan === 'number') {
          // Old format: direct number
          colSpanClass = `col-span-${slot.colSpan}`;
          gridColumn = `span ${slot.colSpan} / span ${slot.colSpan}`;
        } else if (typeof slot.colSpan === 'object' && slot.colSpan !== null) {
          // New format: object with viewMode keys
          const viewModeValue = slot.colSpan[viewMode];

          if (typeof viewModeValue === 'number') {
            // Simple viewMode: number format
            colSpanClass = `col-span-${viewModeValue}`;
            gridColumn = `span ${viewModeValue} / span ${viewModeValue}`;
          } else if (typeof viewModeValue === 'string') {
            // Tailwind responsive class format: 'col-span-12 lg:col-span-8'
            colSpanClass = viewModeValue;
            // For Tailwind classes, we don't set gridColumn as it will be handled by CSS
            gridColumn = null;
          } else if (typeof viewModeValue === 'object' && viewModeValue !== null) {
            // Legacy nested breakpoint format: { mobile: 12, tablet: 12, desktop: 8 }
            const colSpanValue = viewModeValue.desktop || viewModeValue.tablet || viewModeValue.mobile || 12;
            colSpanClass = `col-span-${colSpanValue}`;
            gridColumn = `span ${colSpanValue} / span ${colSpanValue}`;
          }
        }

        return (
          <div
            key={slot.id}
            className={colSpanClass}
            style={{
              ...(gridColumn ? { gridColumn } : {}),
              ...slot.containerStyles
            }}
          >
            {renderSlotContent(slot)}
          </div>
        );
      })}
    </>
  );
}