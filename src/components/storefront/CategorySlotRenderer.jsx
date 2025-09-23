import React, { useState, useMemo, useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Grid, List, Filter, Search, Tag, ChevronDown, ShoppingCart } from 'lucide-react';
import { SlotManager } from '@/utils/slotUtils';
import { filterSlotsByViewMode, sortSlotsByGridCoordinates } from '@/hooks/useSlotConfiguration';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import { formatDisplayPrice } from '@/utils/priceUtils';
import { getPrimaryImageUrl } from '@/utils/imageUtils';
import cartService from '@/services/cartService';
import BreadcrumbRenderer from '@/components/storefront/BreadcrumbRenderer';
// Note: Removed Breadcrumb import to avoid useStore() context issues in editor
// We'll use a simple implementation instead

/**
 * CategorySlotRenderer - Renders slots with full category functionality
 * Uses responsive grid layout with conditional filter sidebar
 */
export function CategorySlotRenderer({
  slots,
  parentId = null,
  viewMode = 'list',
  categoryContext = {}
}) {
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

  // Get header slots (above the main grid)
  const headerSlots = SlotManager.getChildSlots(slots, null).filter(slot =>
    ['header', 'category_title', 'header_description', 'category_description', 'breadcrumbs', 'breadcrumb_container', 'category_image'].includes(slot.id)
  );

  // Get main content slots
  const mainSlots = SlotManager.getChildSlots(slots, null).filter(slot =>
    !['header', 'category_title', 'header_description', 'category_description', 'breadcrumbs', 'breadcrumb_container', 'category_image'].includes(slot.id)
  );

  // Render header slots first
  const renderHeaderSlots = () => {
    return headerSlots.map(slot => renderSlotContent(slot));
  };

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
    const { id, type, content, className = '', styles = {}, parentClassName = '' } = slot;

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
    if (id === 'header' || id === 'category_title') {
      // Use content from slot if provided, otherwise use category name
      const headerContent = content || category?.name || 'Products';

      return wrapWithParentClass(
        <div className="mb-4">
          <h1 className={className || "text-4xl font-bold text-gray-900"} style={styles}>
            {headerContent}
          </h1>
        </div>
      );
    }

    if (id === 'header_description' || id === 'category_description') {
      // Use content from slot if provided, otherwise use category description
      const descContent = content || category?.description || '';

      if (!descContent) return null;

      return wrapWithParentClass(
        <p className={className || "text-gray-600 mt-2"} style={styles}>
          {descContent}
        </p>
      );
    }

    if (id === 'breadcrumbs' || id === 'breadcrumb_container') {
      // Use content from slot if provided, otherwise use Breadcrumb component
      if (content && content.trim()) {
        return wrapWithParentClass(
          <div
            className={className || "flex mb-4"}
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
          className={className || "flex items-center space-x-1 text-sm text-gray-500 mb-6"}
        />
      );
    }

    // Search bar
    if (id === 'search_bar') {
      return wrapWithParentClass(
        <div className={className || "relative mb-6"} style={styles}>
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

    // Filters container - Column 1 (exact LayeredNavigation structure)
    if (id === 'filters_container') {
      // Calculate price range from all products (not just paginated)
      const allProducts = categoryContext.allProducts || products;

      const { minPrice, maxPrice } = (() => {
        if (!allProducts || allProducts.length === 0) return { minPrice: 0, maxPrice: 1000 };

        const prices = [];
        allProducts.forEach(p => {
          const price = parseFloat(p.price || 0);
          if (price > 0) prices.push(price);

          const comparePrice = parseFloat(p.compare_price || 0);
          if (comparePrice > 0 && comparePrice !== price) {
            prices.push(comparePrice);
          }
        });

        if (prices.length === 0) return { minPrice: 0, maxPrice: 1000 };

        return {
          minPrice: Math.floor(Math.min(...prices)),
          maxPrice: Math.ceil(Math.max(...prices))
        };
      })();

      // Get current price range from selectedFilters or use full range
      const currentPriceRange = selectedFilters.priceRange || [minPrice, maxPrice];

      // Build filter options exactly like LayeredNavigation
      const filterOptions = (() => {
        const options = {};
        console.log('CategorySlotRenderer: Processing filters:', filters);

        Object.entries(filters).forEach(([filterKey, filterValues]) => {
          console.log(`CategorySlotRenderer: Processing filter ${filterKey}:`, filterValues);
          // Include filters even if they have no values yet (empty array)
          // This ensures all 'use for filter' attributes are shown
          if (filterValues !== undefined) {
            if (filterValues.length > 0) {
              // Count products for each filter value using all products
              const optionsWithCount = filterValues.map(optionRaw => {
                // Normalize the option to ensure we have a consistent structure
                const option = typeof optionRaw === 'object' && optionRaw !== null
                  ? {
                      value: String(optionRaw.value || optionRaw.label || optionRaw.name || optionRaw),
                      label: optionRaw.label || optionRaw.name || optionRaw.value || String(optionRaw)
                    }
                  : { value: String(optionRaw), label: String(optionRaw) };
                const productCount = allProducts.filter(p => {
                  const productAttributes = p.attributes || p.attribute_values || {};

                  // Try multiple possible keys for the attribute (like LayeredNavigation)
                  const possibleKeys = [
                    filterKey,
                    filterKey.toLowerCase(),
                    filterKey.toLowerCase().replace(/[_-\s]/g, ''),
                  ];

                  let attributeValue = null;
                  for (const key of possibleKeys) {
                    if (productAttributes[key] !== undefined || p[key] !== undefined) {
                      attributeValue = productAttributes[key] || p[key];
                      break;
                    }
                  }

                  // Extract value from object if needed (same logic as in Category.jsx)
                  let extractedValue = attributeValue;
                  if (typeof attributeValue === 'object' && attributeValue !== null) {
                    extractedValue = attributeValue.value || attributeValue.label || attributeValue.name;
                  } else if (Array.isArray(attributeValue)) {
                    // For arrays, check if any value matches
                    return attributeValue.some(val => {
                      const valToCheck = typeof val === 'object' && val !== null
                        ? (val.value || val.label || val.name)
                        : val;
                      return String(valToCheck) === String(option.value);
                    });
                  }

                  // Debug logging for specific filters
                  if ((filterKey === 'color' && option.value === 'Zwart') ||
                      (filterKey === 'manufacturer' && option.value === 'Aga')) {
                    console.log(`Debug ${filterKey} - ${option.value}:`, {
                      productId: p.id,
                      productName: p.name,
                      productAttributes,
                      possibleKeys,
                      foundAttributeValue: attributeValue,
                      extractedValue,
                      match: String(extractedValue) === String(option.value)
                    });
                  }

                  // Compare with the normalized option value
                  return String(extractedValue) === String(option.value);
                }).length;

                return {
                  ...option,
                  count: productCount
                };
              }).filter(option => option.count > 0); // Filter out options with 0 count

              options[filterKey] = {
                name: filterKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                values: optionsWithCount.map(opt => opt.value),
                options: optionsWithCount
              };
            } else {
              // Empty filter array - create section with no options but show the header
              options[filterKey] = {
                name: filterKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                values: [],
                options: []
              };
            }
          }
        });

        console.log('CategorySlotRenderer: Final filterOptions:', options);
        return options;
      })();

      // Check if any filters are active
      const hasActiveFilters = Object.keys(selectedFilters).length > 0 ||
                              (currentPriceRange[0] !== minPrice || currentPriceRange[1] !== maxPrice);

      if (!allProducts || allProducts.length === 0) {
        return wrapWithParentClass(
          <Card className={className || "sticky top-4"} style={styles}>
            <CardHeader>
              <CardTitle>Filter By</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">No products to filter</p>
            </CardContent>
          </Card>
        );
      }

      return wrapWithParentClass(
        <Card className={className || "sticky top-4"} style={styles}>
          <CardHeader>
            <div className="flex justify-between items-center h-5">
              <CardTitle>Filter By</CardTitle>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Render child slots at the top (e.g., active_filters, cms blocks, layered navigation placeholders) */}
            {renderChildSlots(slots, id).map(childSlot => {
              // Skip the actual layered navigation slot in filters - it's handled below
              if (childSlot.type === 'layered_navigation' && childSlot.id === 'layered_navigation') {
                return null;
              }
              return (
                <div key={childSlot.id} className="mb-4">
                  {renderSlotContent(childSlot)}
                </div>
              );
            })}

            <Accordion type="multiple" defaultValue={['price', ...Object.keys(filterOptions)]} className="w-full">
              {/* Price Slider */}
              <AccordionItem value="price">
                <AccordionTrigger className="font-semibold">Price</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="px-2">
                      <Slider
                        min={minPrice}
                        max={maxPrice}
                        step={1}
                        value={currentPriceRange}
                        onValueChange={(range) => {
                          const newFilters = { ...selectedFilters };
                          if (range[0] !== minPrice || range[1] !== maxPrice) {
                            newFilters.priceRange = range;
                          } else {
                            delete newFilters.priceRange;
                          }
                          handleFilterChange(newFilters);
                        }}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>${currentPriceRange[0]}</span>
                      <span>${currentPriceRange[1]}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Min: ${minPrice}</span>
                      <span>Max: ${maxPrice}</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Attribute Filters */}
              {Object.entries(filterOptions).map(([code, { name, values, options }]) => (
                <AccordionItem key={code} value={code}>
                  <AccordionTrigger className="font-semibold">{name}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {options.length > 0 ? (
                        options.map(option => (
                          <div key={`${code}-${option.value}`} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`attr-${code}-${option.value}`}
                                checked={selectedFilters[code]?.includes(option.value) || false}
                                onCheckedChange={(checked) => {
                                  const currentValues = selectedFilters[code] || [];
                                  const newValues = checked
                                    ? [...currentValues, option.value]
                                    : currentValues.filter(v => v !== option.value);

                                  const newFilters = { ...selectedFilters };
                                  if (newValues.length > 0) {
                                    newFilters[code] = newValues;
                                  } else {
                                    delete newFilters[code];
                                  }
                                  handleFilterChange(newFilters);
                                }}
                              />
                              <Label htmlFor={`attr-${code}-${option.value}`} className="text-sm">
                                {option.label || option.value}
                              </Label>
                            </div>
                            <span className="text-xs text-gray-400">({option.count})</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No options available</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      );
    }

    // Main content container - Column 2
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

    // Sort controls and product count
    if (id === 'sort_controls') {
      const sortOptions = [
        { value: 'name_asc', label: 'Name A-Z' },
        { value: 'name_desc', label: 'Name Z-A' },
        { value: 'price_asc', label: 'Price Low to High' },
        { value: 'price_desc', label: 'Price High to Low' },
        { value: 'newest', label: 'Newest First' },
        { value: 'popular', label: 'Most Popular' }
      ];

      return wrapWithParentClass(
        <div className={className || "flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"} style={styles}>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Showing {products.length > 0 ? ((currentPage - 1) * 12 + 1) : 0}-{Math.min(currentPage * 12, products.length)} of {products.length} products
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortOption}
              onChange={(e) => handleSortChange(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm bg-white"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    // View mode toggles
    if (id === 'view_mode_toggles') {
      return wrapWithParentClass(
        <div className={className || "flex items-center space-x-2 mb-6"} style={styles}>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('viewMode', 'grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('viewMode', 'list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    // Sorting controls container
    if (id === 'sorting_controls') {
      return wrapWithParentClass(
        <div className={className || "flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"} style={styles}>
          {renderChildSlots(slots, id).map(childSlot => renderSlotContent(childSlot))}
        </div>
      );
    }

    // Product count info
    if (id === 'product_count_info') {
      const totalProducts = allProducts?.length || 0;
      const startIndex = ((currentPage || 1) - 1) * 12 + 1;
      const endIndex = Math.min(startIndex + (products?.length || 0) - 1, totalProducts);

      return wrapWithParentClass(
        <div className={className || "text-sm text-gray-600"} style={styles}>
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
        <div className={className || "flex items-center gap-2"} style={styles}>
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

    // Active filters display
    if (id === 'active_filters') {
      // Only show if there are active filters
      if (!selectedFilters || Object.keys(selectedFilters).length === 0) {
        return null;
      }

      const filterEntries = Object.entries(selectedFilters).filter(([key, values]) =>
        values && (Array.isArray(values) ? values.length > 0 : values !== null && values !== undefined)
      );

      if (filterEntries.length === 0) {
        return null;
      }

      return wrapWithParentClass(
        <div className={className || "mb-6"} style={styles}>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Active Filters</h3>
          <div className="space-y-2">
            {/* Individual filter chips in vertical layout for sidebar */}

            {filterEntries.map(([filterKey, filterValue]) => {
              // Handle different filter types
              if (filterKey === 'priceRange' && Array.isArray(filterValue)) {
                return (
                  <div key={filterKey} className="flex items-center justify-between bg-blue-100 text-blue-800 px-3 py-2 rounded text-sm">
                    <span>Price: {currencySymbol}{filterValue[0]} - {currencySymbol}{filterValue[1]}</span>
                    <button
                      onClick={() => {
                        const newFilters = { ...selectedFilters };
                        delete newFilters.priceRange;
                        handleFilterChange && handleFilterChange(newFilters);
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-800 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                );
              }

              // Handle array filters (multi-select)
              if (Array.isArray(filterValue)) {
                return filterValue.map(value => (
                  <div key={`${filterKey}-${value}`} className="flex items-center justify-between bg-blue-100 text-blue-800 px-3 py-2 rounded text-sm">
                    <span>{filterKey}: {value}</span>
                    <button
                      onClick={() => {
                        const newFilters = { ...selectedFilters };
                        const newValues = filterValue.filter(v => v !== value);
                        if (newValues.length > 0) {
                          newFilters[filterKey] = newValues;
                        } else {
                          delete newFilters[filterKey];
                        }
                        handleFilterChange && handleFilterChange(newFilters);
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-800 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ));
              }

              // Handle single value filters
              return (
                <div key={filterKey} className="flex items-center justify-between bg-blue-100 text-blue-800 px-3 py-2 rounded text-sm">
                  <span>{filterKey}: {filterValue}</span>
                  <button
                    onClick={() => {
                      const newFilters = { ...selectedFilters };
                      delete newFilters[filterKey];
                      handleFilterChange && handleFilterChange(newFilters);
                    }}
                    className="ml-2 text-blue-600 hover:text-blue-800 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              );
            })}

          </div>
        </div>
      );
    }

    // Pagination controls
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
        <div className={className || "flex justify-center items-center gap-2 mt-8"} style={styles}>
          {pages}
        </div>
      );
    }

    // Products grid - render just the product items
    if (id === 'products_grid') {
      const gridClass = viewMode === 'grid'
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
        : 'space-y-4';

      // Find product template slot
      const productTemplateSlot = Object.values(slots || {}).find(slot =>
        slot.id === 'product_template' || slot.metadata?.isTemplate
      );

      // If we have a template, render products using the slot structure
      if (productTemplateSlot) {
        return (
          <div className={`${className} ${gridClass} mb-8`} style={styles}>
            {products.map((product, index) => (
              <div key={product.id} className="product-slot-wrapper">
                {renderProductFromSlots(product, index)}
              </div>
            ))}
          </div>
        );
      }

      // Fallback to default product card rendering (shortened for products_grid)
      return (
        <div className={`${className} ${gridClass} mb-8`} style={styles}>
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow p-4">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-xl font-bold text-green-600 mt-2">
                {formatDisplayPrice(product.price, currencySymbol)}
              </p>
            </div>
          ))}
        </div>
      );
    }

    // Products container - render all child slots (sorting, products grid, pagination, etc.)
    if (id === 'products_container') {
      return wrapWithParentClass(
        <div className={className || "lg:col-span-3"} style={styles}>
          {renderChildSlots(slots, id).map(childSlot => renderSlotContent(childSlot))}
        </div>
      );
    }

    // Pagination
    if (id === 'pagination_controls') {
      return wrapWithParentClass(
        <div className={className || "flex items-center justify-center space-x-2 mt-8"} style={styles}>
          <Button
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </Button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = Math.max(1, currentPage - 2) + i;
            if (pageNum > totalPages) return null;

            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? 'default' : 'outline'}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      );
    }

    // Subcategories container
    if (id === 'subcategories_container') {
      return wrapWithParentClass(
        <div className={className || "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8"} style={styles}>
          {subcategories.map(subcategory => (
            <Card
              key={subcategory.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(subcategory.url)}
            >
              {subcategory.image && (
                <img
                  src={subcategory.image}
                  alt={subcategory.name}
                  className="w-full h-32 object-cover rounded-t-lg"
                />
              )}
              <CardContent className="p-4">
                <h3 className="font-semibold text-center">{subcategory.name}</h3>
                {subcategory.product_count && (
                  <p className="text-sm text-gray-600 text-center mt-1">
                    {subcategory.product_count} products
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
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

      case 'link':
        return (
          <a
            href="#"
            className={className}
            style={styles}
          >
            {content || 'Link'}
          </a>
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
        // Show CMS block position name
        return (
          <div className={className} style={styles}>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
              <div className="text-sm font-medium mb-1">
                {slot.metadata?.displayName || 'CMS Block'}
              </div>
              <div className="text-xs text-gray-400">
                Position: {slot.metadata?.cmsPosition || 'undefined'}
              </div>
            </div>
          </div>
        );

      case 'layered_navigation':
        // Show layered navigation label
        return (
          <div className={className} style={styles}>
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-600 mb-2">
                {slot.metadata?.displayName || 'Layered Navigation'}
              </div>
              <div className="text-xs text-gray-500">
                Product filtering system will appear here
              </div>
            </div>
          </div>
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

  // Helper function to render product using slots
  function renderProductFromSlots(product, productIndex) {
    // Get all product-related slots
    const productSlots = Object.values(slots || {}).filter(slot =>
      slot.parentId === 'product_template' ||
      slot.id?.startsWith('product_') ||
      slot.metadata?.microslot
    );

    // Create a unique instance of slots for this product
    const productInstanceSlots = {};
    productSlots.forEach(slot => {
      const instanceId = `${slot.id}_${productIndex}`;
      productInstanceSlots[instanceId] = {
        ...slot,
        id: instanceId,
        // Replace parentId references
        parentId: slot.parentId === 'product_template' ? `product_template_${productIndex}` :
                 slot.parentId?.startsWith('product_') ? `${slot.parentId}_${productIndex}` : slot.parentId
      };
    });

    // Add the template slot itself
    const templateSlot = slots['product_template'];
    if (templateSlot) {
      productInstanceSlots[`product_template_${productIndex}`] = {
        ...templateSlot,
        id: `product_template_${productIndex}`,
        parentId: null
      };
    }

    // Render product slots with product data
    return renderProductSlots(productInstanceSlots, `product_template_${productIndex}`, product);
  }

  // Helper function to render product slots recursively
  function renderProductSlots(productSlots, parentId, product) {
    const childSlots = Object.values(productSlots).filter(slot => slot.parentId === parentId);

    if (childSlots.length === 0 && parentId === null) {
      // No slots found, return null
      return null;
    }

    return childSlots.map(slot => {
      const { id, type, content, className = '', styles = {} } = slot;
      const slotIdParts = id.split('_');
      const baseSlotId = slotIdParts.slice(0, -1).join('_'); // Remove the product index

      // Render based on slot type
      switch (baseSlotId) {
        case 'product_template':
          return (
            <Card
              key={id}
              className={`cursor-pointer ${className || "group overflow-hidden hover:shadow-lg transition-shadow"}`}
              style={styles}
              onClick={() => onProductClick && onProductClick(product)}
            >
              {renderProductSlots(productSlots, id, product)}
            </Card>
          );

        case 'product_image_container':
          return (
            <div key={id} className={className || "relative overflow-hidden"} style={styles}>
              {renderProductSlots(productSlots, id, product)}
            </div>
          );

        case 'product_image':
          const imageUrl = (() => {
            if (product.images && product.images.length > 0) {
              const firstImage = product.images[0];
              if (typeof firstImage === 'object') {
                return firstImage.url || firstImage.src || firstImage.image || '/placeholder-product.jpg';
              }
              return firstImage;
            }
            if (product.image) {
              if (typeof product.image === 'object') {
                return product.image.url || product.image.src || '/placeholder-product.jpg';
              }
              return product.image;
            }
            return '/placeholder-product.jpg';
          })();

          return (
            <img
              key={id}
              src={imageUrl}
              alt={product.name}
              className={`cursor-pointer ${className || "w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"}`}
              style={styles}
              onClick={() => onProductClick && onProductClick(product)}
            />
          );

        case 'product_content':
          return (
            <div key={id} className={className || "p-4 space-y-3"} style={styles}>
              {renderProductSlots(productSlots, id, product)}
            </div>
          );

        case 'product_name':
          return (
            <h3
              key={id}
              className={`cursor-pointer hover:underline ${className || "font-semibold text-lg truncate"}`}
              style={styles}
              onClick={() => onProductClick && onProductClick(product)}
            >
              {product.name}
            </h3>
          );

        case 'product_price_container':
          return (
            <div key={id} className={className || "flex items-baseline gap-2"} style={styles}>
              {renderProductSlots(productSlots, id, product)}
            </div>
          );

        case 'product_price':
          const displayPrice = product.compare_price && parseFloat(product.compare_price) > 0 &&
                              parseFloat(product.compare_price) !== parseFloat(product.price)
            ? Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0))
            : parseFloat(product.price || 0);

          return (
            <span key={id} className={className || "text-lg font-bold text-green-600"} style={styles}>
              {formatDisplayPrice(
                displayPrice,
                settings?.hide_currency_product ? '' : (settings?.currency_symbol || currencySymbol || '$'),
                store,
                taxes,
                selectedCountry
              )}
            </span>
          );

        case 'product_compare_price':
          if (product.compare_price && parseFloat(product.compare_price) > 0 &&
              parseFloat(product.compare_price) !== parseFloat(product.price)) {
            const comparePrice = Math.max(parseFloat(product.price || 0), parseFloat(product.compare_price || 0));
            return (
              <span key={id} className={className || "text-sm text-gray-500 line-through"} style={styles}>
                {formatDisplayPrice(
                  comparePrice,
                  settings?.hide_currency_product ? '' : (settings?.currency_symbol || currencySymbol || '$'),
                  store,
                  taxes,
                  selectedCountry
                )}
              </span>
            );
          }
          return null;

        case 'product_add_to_cart':
          return (
            <Button
              key={id}
              onClick={async (e) => {
                e.stopPropagation();
                e.preventDefault();

                try {
                  if (!product || !product.id || !store?.id) {
                    console.error('Invalid product or store for add to cart');
                    return;
                  }

                  const result = await cartService.addItem(
                    product.id,
                    1,
                    product.price || 0,
                    [],
                    store.id
                  );

                  if (result.success !== false) {
                    if (typeof window !== 'undefined' && window.catalyst?.trackAddToCart) {
                      window.catalyst.trackAddToCart(product, 1);
                    }

                    window.dispatchEvent(new CustomEvent('showFlashMessage', {
                      detail: {
                        type: 'success',
                        message: `${product.name} added to cart successfully!`
                      }
                    }));
                  }
                } catch (error) {
                  console.error("Failed to add to cart", error);
                }
              }}
              className={className || "w-full text-white border-0 hover:brightness-90 transition-all duration-200"}
              size="sm"
              style={{
                backgroundColor: settings?.theme?.add_to_cart_button_color || '#3B82F6',
                color: 'white',
                ...styles
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {content || 'Add to Cart'}
            </Button>
          );

        default:
          // For containers and other slot types
          if (type === 'container') {
            return (
              <div key={id} className={className} style={styles}>
                {renderProductSlots(productSlots, id, product)}
              </div>
            );
          }
          return null;
      }
    });
  }

  // Helper function to render breadcrumbs
  function renderBreadcrumbs() {
    const breadcrumbSlot = headerSlots.find(slot =>
      slot.id === 'breadcrumbs' || slot.id === 'breadcrumb_container'
    );
    if (breadcrumbSlot) {
      return renderSlotContent(breadcrumbSlot);
    }
    // Default breadcrumbs if no slot defined
    return (
      <BreadcrumbRenderer
        items={breadcrumbs.length > 0 ? breadcrumbs : undefined}
        pageType="category"
        pageData={category}
        storeCode={store?.slug || store?.code}
        categories={categories}
        settings={settings}
      />
    );
  }

  // Helper function to render other header slots (excluding breadcrumbs)
  function renderOtherHeaderSlots() {
    const otherSlots = headerSlots.filter(slot =>
      slot.id !== 'breadcrumbs' && slot.id !== 'breadcrumb_container'
    );
    return otherSlots.map(slot => renderSlotContent(slot));
  }

  // Helper function to render filters container
  function renderFiltersContainer() {
    const filtersSlot = mainSlots.find(slot => slot.id === 'filters_container');
    if (filtersSlot) {
      return renderSlotContent(filtersSlot);
    }
    return null;
  }

  // Helper function to render main content (products, sorting, etc.)
  function renderMainContent() {
    const contentSlots = mainSlots.filter(slot => slot.id !== 'filters_container');
    return contentSlots.map(slot => (
      <div key={slot.id} className="mb-6">
        {renderSlotContent(slot)}
      </div>
    ));
  }

  return (
        <div className="grid grid-cols-12 gap-2 auto-rows-min">
          {/* Breadcrumbs - Full Width (12 columns) */}
          <div className="col-span-12">
            {renderBreadcrumbs()}
          </div>

          {/* Header Section - Full Width (12 columns) */}
          <div className="col-span-12 mb-8">
            {/* Category Hero Section with Image and Title */}
            {(category?.image || category?.image_url || category?.name) && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                {(category?.image || category?.image_url) && (
                  <div className="relative w-full h-48 sm:h-64 lg:h-80">
                    <img
                      src={category?.image || category?.image_url}
                      alt={category?.name || 'Category'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                        {category?.name || 'Products'}
                      </h1>
                      {category?.description && (
                        <p className="mt-2 text-lg text-white/90 max-w-3xl">
                          {category?.description}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {/* If no image, show title and description separately */}
                {!(category?.image || category?.image_url) && category?.name && (
                  <div className="p-6">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                      {category?.name}
                    </h1>
                    {category?.description && (
                      <p className="mt-2 text-lg text-gray-600">
                        {category?.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Render other header slots except breadcrumbs */}
            {renderOtherHeaderSlots()}
          </div>

          {/* Filter Sidebar - 3 columns */}
          {filtersEnabled && (
            <div className="col-span-12 lg:col-span-3 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto">
              <CmsBlockRenderer position="category_above_filters" />
              {renderFiltersContainer()}
              <CmsBlockRenderer position="category_below_filters" />
            </div>
          )}

          {/* Main Content Area - 9 columns when filters enabled, 12 when not */}
          <div className={filtersEnabled ? "col-span-12 lg:col-span-9" : "col-span-12"}>
            <CmsBlockRenderer position="category_above_products" />
            {renderMainContent()}
            <CmsBlockRenderer position="category_below_products" />
          </div>
        </div>
  );
}