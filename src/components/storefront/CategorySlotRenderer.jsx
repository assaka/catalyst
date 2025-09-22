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

      // Create breadcrumb items with current category added
      const breadcrumbItems = [...breadcrumbs];
      if (category) {
        breadcrumbItems.push({
          name: category.name,
          url: window.location.pathname // Current page, so it won't be a link
        });
      }

      // Always use simple breadcrumb implementation to avoid context issues
      return wrapWithParentClass(
        <nav
          className={className || "flex items-center space-x-1 text-sm text-gray-500 mb-6"}
          style={styles}
          aria-label="Breadcrumb"
        >
          {breadcrumbItems.map((item, index) => (
            <Fragment key={index}>
              {index > 0 && <span className="text-gray-400 mx-1">/</span>}
              <span className={index === breadcrumbItems.length - 1 ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"}>
                {item.name}
              </span>
            </Fragment>
          ))}
        </nav>
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

        Object.entries(filters).forEach(([filterKey, filterValues]) => {
          // Include filters even if they have no values yet (empty array)
          // This ensures all 'use for filter' attributes are shown
          if (filterValues !== undefined) {
            if (filterValues.length > 0) {
              // Count products for each filter value using all products
              const optionsWithCount = filterValues.map(option => {
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

                  return String(attributeValue) === String(option.value);
                }).length;

                return {
                  ...option,
                  count: productCount
                };
              }); // Don't filter out options with 0 count - show all options

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
                          <div key={option.value} className="flex items-center justify-between">
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
                                {option.value}
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

    // Products container - render product slots dynamically
    if (id === 'products_container') {
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

      // Fallback to default product card rendering
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
                    const imageUrl = getProductImageUrl ? getProductImageUrl(product) : null;

                    // If getProductImageUrl returns an object, extract the URL
                    if (imageUrl && typeof imageUrl === 'object') {
                      return imageUrl.url || imageUrl.src || imageUrl.image || '/placeholder-product.jpg';
                    }

                    // If it's already a string, use it
                    if (typeof imageUrl === 'string') {
                      return imageUrl;
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
                  className={`w-full ${viewMode === 'list' ? 'h-32' : 'h-40'} object-cover ${viewMode === 'list' ? 'rounded-l-lg' : 'rounded-t-lg'}`}
                />
              </div>
              <CardContent className={viewMode === 'list' ? 'p-4 flex-1' : 'p-0'}>
                {viewMode !== 'list' && (
                  <div className="p-4">
                    <h3 className="font-semibold text-lg truncate mt-1">
                      {product.name}
                    </h3>
                    <div className="space-y-3 mt-4">
                      {/* Price display logic from ProductCard */}
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
                  </div>
                )}

                {/* List view layout */}
                {viewMode === 'list' && (
                  <>
                    <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                    {product.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        {product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price) ? (
                          <>
                            <span className="font-bold text-red-600 text-xl">
                              {formatDisplayPrice(
                                Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
                                settings?.hide_currency_product ? '' : (settings?.currency_symbol || currencySymbol || '$'),
                                store,
                                taxes,
                                selectedCountry
                              )}
                            </span>
                            <span className="text-gray-500 line-through text-sm">
                              {formatDisplayPrice(
                                Math.max(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
                                settings?.hide_currency_product ? '' : (settings?.currency_symbol || currencySymbol || '$'),
                                store,
                                taxes,
                                selectedCountry
                              )}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-xl text-gray-900">
                            {formatDisplayPrice(
                              parseFloat(product.price || 0),
                              settings?.hide_currency_product ? '' : (settings?.currency_symbol || currencySymbol || '$'),
                              store,
                              taxes,
                              selectedCountry
                            )}
                          </span>
                        )}
                      </div>

                      <Button
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
                        className="text-white border-0 hover:brightness-90 transition-all duration-200"
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

                    {product.stock_status && (
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
                  </>
                )}
              </CardContent>
            </Card>
          ))}
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
              className={className || "group overflow-hidden hover:shadow-lg transition-shadow"}
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
              className={className || "w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"}
              style={styles}
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
            <h3 key={id} className={className || "font-semibold text-lg truncate"} style={styles}>
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
      <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
        {breadcrumbs.map((item, index) => (
          <Fragment key={index}>
            {index > 0 && <span className="text-gray-400 mx-1">/</span>}
            <span className={index === breadcrumbs.length - 1 ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"}>
              {item.name}
            </span>
          </Fragment>
        ))}
        {category && (
          <>
            {breadcrumbs.length > 0 && <span className="text-gray-400 mx-1">/</span>}
            <span className="text-gray-900 font-medium">{category.name}</span>
          </>
        )}
      </nav>
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
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8 max-w-7xl mx-auto">
        {/* Render breadcrumbs first */}
        {renderBreadcrumbs()}

        {/* Category Hero Section with Image and Title - after breadcrumbs */}
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

      {/* Main Grid Layout */}
      <div className={`grid ${filtersEnabled ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-8 max-w-7xl mx-auto`}>
        {/* Filter Sidebar */}
        {filtersEnabled && (
          <div className="lg:col-span-1 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto">
            <CmsBlockRenderer position="category_above_filters" />
            {renderFiltersContainer()}
            <CmsBlockRenderer position="category_below_filters" />
          </div>
        )}

        {/* Main Content Area */}
        <div className={filtersEnabled ? "lg:col-span-3" : "lg:col-span-1"}>
          <CmsBlockRenderer position="category_above_products" />
          {renderMainContent()}
          <CmsBlockRenderer position="category_below_products" />
        </div>
      </div>
    </div>
  );
}