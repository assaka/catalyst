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
import { ComponentRegistry } from '@/components/editor/slot/SlotComponentRegistry';
import { processVariables } from '@/utils/variableProcessor';

// Import CategorySlotComponents to ensure they're registered
import '@/components/editor/slot/CategorySlotComponents';

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
      const breakpoints = gridConfig.breakpoints || {};
      const customBreakpoints = gridConfig.customBreakpoints || [];

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

      return classes.length > 0 ? classes.join(' ') : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4';
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
    itemsPerPage = 12, // Dynamic items per page
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

  // Sort completed

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
      metadata = {},
      component: componentName
    } = slot || {};

    // Check if this is a registered component type - use ComponentRegistry
    if (type === 'component' && componentName && ComponentRegistry.has(componentName)) {
      const registeredComponent = ComponentRegistry.get(componentName);

      // Format products with all necessary fields for templates
      const formattedProducts = products.map(product => {
        // formatDisplayPrice now properly handles both product objects and price values
        const displayPrice = formatDisplayPrice ? formatDisplayPrice(product) : product.price;
        const comparePrice = product.compare_price || product.compare_at_price;

        // Debug: Log ALL products to see their data
        console.log('Formatting product:', {
          name: product.name,
          price: product.price,
          compare_price: product.compare_price,
          compare_at_price: product.compare_at_price,
          hasComparePrice: !!comparePrice,
          allKeys: Object.keys(product)
        });

        // displayPrice is already a formatted string like "$1349.00"
        const formattedPriceStr = displayPrice;

        return {
          ...product,
          // Use same naming as product-config.js: price_formatted and compare_price_formatted
          price_formatted: formattedPriceStr,
          compare_price_formatted: comparePrice ? `${currencySymbol}${parseFloat(comparePrice).toFixed(2)}` : null,
          // Also keep old names for backwards compatibility
          formatted_price: formattedPriceStr,
          formatted_compare_price: comparePrice ? `${currencySymbol}${parseFloat(comparePrice).toFixed(2)}` : null,
          image_url: getProductImageUrl ? getProductImageUrl(product) : (product.images?.[0]?.url || product.image_url || product.image || ''),
          url: product.url || `/product/${product.slug || product.id}`,
          in_stock: product.in_stock !== false && product.stock_quantity !== 0, // Default to true unless explicitly false or 0
          labels: productLabels?.filter(label => {
            // Check if product has this label
            if (label.type === 'new' && product.is_new) return true;
            if (label.type === 'sale' && product.compare_price) return true;
            if (label.type === 'featured' && product.is_featured) return true;
            return false;
          }).map(label => ({
            text: label.text,
            className: label.background_color ? `bg-[${label.background_color}] text-white` : 'bg-red-600 text-white'
          })) || []
        };
      });

      // Prepare filters data for LayeredNavigation template
      const filtersData = filters || {};

      // Format price ranges
      let priceRanges = null;
      if (filtersData.price) {
        if (Array.isArray(filtersData.price)) {
          priceRanges = filtersData.price.map(item => ({
            value: typeof item === 'object' ? (item.value || item.label) : item,
            label: typeof item === 'object' ? (item.label || item.value) : item,
            count: 0,
            active: false
          }));
        } else if (typeof filtersData.price === 'object') {
          priceRanges = Object.entries(filtersData.price).map(([value, label]) => ({
            value: value,
            label: typeof label === 'string' ? label : value,
            count: 0,
            active: false
          }));
        }
      }

      // Format attribute filters
      console.log('🔍 CategorySlotRenderer - filterableAttributes:', filterableAttributes);
      console.log('🔍 CategorySlotRenderer - filtersData:', filtersData);

      const attributeFilters = filterableAttributes?.map(attr => {
        const attrCode = attr.code || attr.name;
        const options = filtersData[attrCode] || [];

        console.log(`🔍 CategorySlotRenderer - Processing attr: ${attrCode}, options:`, options);

        const formattedOptions = Array.isArray(options)
          ? options.map(option => {
              if (typeof option === 'object' && option !== null) {
                return {
                  value: option.value || option.label || String(option),
                  label: option.label || option.value || String(option),
                  count: option.count || 0,
                  active: false
                };
              }
              return {
                value: String(option),
                label: String(option),
                count: 0,
                active: false
              };
            })
          : [];

        const result = {
          code: attrCode,
          label: attr.name || attr.code || attrCode,
          options: formattedOptions
        };

        console.log(`🔍 CategorySlotRenderer - Formatted attr ${attrCode}:`, result);
        return result;
      }).filter(attr => attr && attr.options && attr.options.length > 0) || [];

      console.log('🔍 CategorySlotRenderer - Final attributeFilters:', attributeFilters);

      const formattedFilters = {
        price: priceRanges ? { ranges: priceRanges } : null,
        attributes: attributeFilters
      };

      // Debug: Log the filters being passed to template
      console.log('🔍 CategorySlotRenderer - formattedFilters:', JSON.stringify(formattedFilters, null, 2));

      // Prepare variable context for processVariables
      const variableContext = {
        category,
        products: formattedProducts,
        filters: formattedFilters,
        activeFilters: [],
        pagination: {
          start: (currentPage - 1) * itemsPerPage + 1,
          end: Math.min(currentPage * itemsPerPage, allProducts?.length || 0),
          total: allProducts?.length || 0,
          currentPage,
          totalPages,
          hasPrev: currentPage > 1,
          hasNext: currentPage < totalPages,
          prevPage: currentPage - 1,
          nextPage: currentPage + 1
        },
        sorting: {
          current: sortOption
        }
      };

      // Use the registered component's render method
      return registeredComponent.render({
        slot,
        categoryContext: categoryContext,
        variableContext,
        context: 'storefront',
        className,
        styles
      });
    }

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

    // NOTE: layered_navigation now uses ComponentRegistry with templates from category-config.js
    // The old hardcoded React component rendering has been removed

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

      // Handle infinite scroll case
      if (itemsPerPage === -1) {
        return wrapWithParentClass(
          <div className={className} style={styles}>
            {totalProducts > 0 ? (
              `Showing all ${totalProducts} products`
            ) : (
              'No products found'
            )}
          </div>
        );
      }

      // Calculate pagination ranges correctly
      const currentPageNum = currentPage || 1;
      const startIndex = (currentPageNum - 1) * itemsPerPage + 1;
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

    // NOTE: products_grid and product_items now use ComponentRegistry with templates from category-config.js
    // The old hardcoded ProductItemCard rendering has been removed

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
                // Handle add to cart state change
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