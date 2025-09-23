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

  // Get child slots for current parent
  let childSlots = SlotManager.getChildSlots(slots, parentId);

  // Filter by viewMode if applicable
  const filteredSlots = filterSlotsByViewMode(childSlots, viewMode);

  // Sort slots using grid coordinates for precise positioning
  const sortedSlots = sortSlotsByGridCoordinates(filteredSlots);

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
      const allProductsForFilter = categoryContext.allProducts || products;

      const { minPrice, maxPrice } = (() => {
        if (!allProductsForFilter || allProductsForFilter.length === 0) return { minPrice: 0, maxPrice: 1000 };

        const prices = [];
        allProductsForFilter.forEach(p => {
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

        Object.entries(filters).forEach(([filterKey, filterValues]) => {
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

                  // Try multiple possible keys for the attribute
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

                  // Extract value from object if needed
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
            {/* Render child slots at the top */}
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

    // Products grid - render just the product items
    if (id === 'products_grid') {
      const gridClass = viewMode === 'grid'
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
        : 'space-y-4';

      // Full product card rendering with images and add to cart
      return (
        <div className={`${className} ${gridClass} mb-8`} style={styles}>
          {products.map(product => (
            <Card
              key={product.id}
              className={`cursor-pointer hover:shadow-lg transition-shadow ${
                viewMode === 'list' ? 'flex' : ''
              }`}
              onClick={() => onProductClick && onProductClick(product)}
            >
              <div className={viewMode === 'list' ? 'w-40 flex-shrink-0' : ''}>
                <img
                  src={(() => {
                    // Handle different image formats
                    if (getProductImageUrl) {
                      const imageUrl = getProductImageUrl(product);
                      if (imageUrl && typeof imageUrl === 'object') {
                        return imageUrl.url || imageUrl.src || imageUrl.image || '/placeholder-product.jpg';
                      }
                      if (typeof imageUrl === 'string') {
                        return imageUrl;
                      }
                    }

                    // Fallback to direct product properties
                    if (product.images && product.images.length > 0) {
                      const firstImage = product.images[0];
                      if (typeof firstImage === 'object') {
                        return firstImage.url || firstImage.src || firstImage.image || '/placeholder-product.jpg';
                      }
                      return firstImage;
                    }

                    if (product.image) {
                      if (typeof product.image === 'object') {
                        return product.image.url || product.image.src || product.image.image || '/placeholder-product.jpg';
                      }
                      return product.image;
                    }

                    return '/placeholder-product.jpg';
                  })()}
                  alt={product.name}
                  className={`w-full ${viewMode === 'list' ? 'h-32' : 'h-48'} object-cover ${viewMode === 'list' ? 'rounded-l-lg' : 'rounded-t-lg'}`}
                />
              </div>
              <CardContent className={viewMode === 'list' ? 'p-4 flex-1' : 'p-4'}>
                <h3 className="font-semibold text-lg truncate">
                  {product.name}
                </h3>

                {viewMode === 'list' && product.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="mt-4 space-y-3">
                  {/* Price display */}
                  <div className="flex items-baseline gap-2">
                    {product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price) ? (
                      <>
                        <p className="font-bold text-red-600 text-xl">
                          {formatDisplayPrice(
                            Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
                            settings?.hide_currency_product ? '' : (settings?.currency_symbol || currencySymbol || '$'),
                            store,
                            taxes,
                            selectedCountry
                          )}
                        </p>
                        <p className="text-gray-500 line-through text-sm">
                          {formatDisplayPrice(
                            Math.max(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
                            settings?.hide_currency_product ? '' : (settings?.currency_symbol || currencySymbol || '$'),
                            store,
                            taxes,
                            selectedCountry
                          )}
                        </p>
                      </>
                    ) : (
                      <p className="font-bold text-xl text-gray-900">
                        {formatDisplayPrice(
                          parseFloat(product.price || 0),
                          settings?.hide_currency_product ? '' : (settings?.currency_symbol || currencySymbol || '$'),
                          store,
                          taxes,
                          selectedCountry
                        )}
                      </p>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();

                      try {
                        if (!product || !product.id) {
                          console.error('Invalid product for add to cart');
                          return;
                        }

                        if (!store?.id) {
                          console.error('Store ID is required for add to cart');
                          return;
                        }

                        // Add to cart using cartService
                        const result = await cartService.addItem(
                          product.id,
                          1, // quantity
                          product.price || 0,
                          [], // selectedOptions
                          store.id
                        );

                        if (result.success !== false) {
                          // Track add to cart event
                          if (typeof window !== 'undefined' && window.catalyst?.trackAddToCart) {
                            window.catalyst.trackAddToCart(product, 1);
                          }

                          // Show flash message
                          window.dispatchEvent(new CustomEvent('showFlashMessage', {
                            detail: {
                              type: 'success',
                              message: `${product.name} added to cart successfully!`
                            }
                          }));
                        } else {
                          console.error('Failed to add to cart:', result.error);
                        }
                      } catch (error) {
                        console.error("Failed to add to cart", error);
                      }
                    }}
                    className="w-full text-white border-0 hover:brightness-90 transition-all duration-200"
                    size="sm"
                    style={{
                      backgroundColor: settings?.theme?.add_to_cart_button_color || '#3B82F6',
                      color: 'white'
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>

                {/* Stock status for list view */}
                {viewMode === 'list' && product.stock_status && (
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      product.stock_status === 'in_stock'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
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
        <div className={className || "flex justify-center items-center gap-2 mt-8"} style={styles}>
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