import React, { useState, useMemo, useEffect } from 'react';
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
import { Grid, List, Filter, Search, Tag, ChevronDown } from 'lucide-react';
import { SlotManager } from '@/utils/slotUtils';
import { filterSlotsByViewMode, sortSlotsByGridCoordinates } from '@/hooks/useSlotConfiguration';
import Breadcrumb from '@/components/storefront/Breadcrumb';

/**
 * CategorySlotRenderer - Renders slots with full category functionality
 * Extends the concept of HierarchicalSlotRenderer for category-specific needs
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
    filters = {},
    sortOption,
    searchQuery,
    currentPage,
    totalPages,
    subcategories = [],
    breadcrumbs = [],
    selectedFilters = {},
    priceRange = {},
    currencySymbol = '$',
    settings,
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

  // Get child slots for current parent
  let childSlots = SlotManager.getChildSlots(slots, parentId);

  // Filter by viewMode
  const filteredSlots = filterSlotsByViewMode(childSlots, viewMode);

  // Sort slots using grid coordinates for precise positioning
  const sortedSlots = sortSlotsByGridCoordinates(filteredSlots);

  const renderSlotContent = (slot) => {
    const { id, type, content, className = '', styles = {}, parentClassName = '' } = slot;

    // Helper function to wrap content with parent class if needed
    const wrapWithParentClass = (children) => {
      if (parentClassName) {
        return <div className={parentClassName}>{children}</div>;
      }
      return children;
    };

    // Handle category header content - with dynamic content from categoryContext
    if (id === 'header' || id === 'category_title') {
      // Use content from slot if provided, otherwise use category name
      const headerContent = content || category?.name || 'Products';

      return wrapWithParentClass(
        <h1 className={className || "text-4xl font-bold"} style={styles}>
          {headerContent}
        </h1>
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

      // Use the actual Breadcrumb component with dynamic styling
      return wrapWithParentClass(
        <Breadcrumb
          items={breadcrumbItems}
          className={className || "flex items-center space-x-1 text-sm text-gray-500 mb-6"}
          style={styles}
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

        Object.entries(filters).forEach(([filterKey, filterValues]) => {
          if (filterValues && filterValues.length > 0) {
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
            }).filter(option => option.count > 0); // Only show options that have products

            if (optionsWithCount.length > 0) {
              options[filterKey] = {
                name: filterKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                values: optionsWithCount.map(opt => opt.value),
                options: optionsWithCount
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
                      {options.map(option => (
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
                      ))}
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

    // Products container - optimized for 2-column layout
    if (id === 'products_container') {
      const gridClass = viewMode === 'grid'
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
        : 'space-y-4';

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
                  src={getProductImageUrl(product)}
                  alt={product.name}
                  className={`w-full ${viewMode === 'list' ? 'h-32' : 'h-40'} object-cover ${viewMode === 'list' ? 'rounded-l-lg' : 'rounded-t-lg'}`}
                />
              </div>
              <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <h3 className="font-semibold text-base mb-2 line-clamp-2">{product.name}</h3>
                {product.description && viewMode === 'list' && (
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    {product.sale_price && product.sale_price < product.price ? (
                      <>
                        <span className="text-lg font-bold text-red-600">
                          {formatDisplayPrice(product.sale_price, currencySymbol, store, taxes, selectedCountry)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          {formatDisplayPrice(product.price, currencySymbol, store, taxes, selectedCountry)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold">
                        {formatDisplayPrice(product.price, currencySymbol, store, taxes, selectedCountry)}
                      </span>
                    )}
                  </div>
                  {product.rating && (
                    <div className="flex items-center">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm ml-1">{product.rating}</span>
                    </div>
                  )}
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