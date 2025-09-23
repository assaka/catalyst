import React, { useState, useMemo, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
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
import { createProductUrl } from '@/utils/urlUtils';
import ProductLabelComponent from '@/components/storefront/ProductLabel';
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
      const headerContent = content || category?.name || 'Products';

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
        <div className={className} style={styles}>
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

    // Products grid - render using enhanced ProductCard logic
    if (id === 'products_grid') {
      // Use the className from slot configuration if available, otherwise use default
      const defaultGridClass = viewMode === 'grid'
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
        : 'space-y-4';

      const finalClassName = className || defaultGridClass;

      // Product label logic - unified across all components
      const renderProductLabels = (product) => {
        // Filter labels that match the product conditions
        const matchingLabels = productLabels?.filter((label) => {
          let shouldShow = true; // Assume true, prove false (AND logic)

          if (label.conditions && Object.keys(label.conditions).length > 0) {
            // Check product_ids condition
            if (shouldShow && label.conditions.product_ids && Array.isArray(label.conditions.product_ids) && label.conditions.product_ids.length > 0) {
              if (!label.conditions.product_ids.includes(product.id)) {
                shouldShow = false;
              }
            }

            // Check category_ids condition
            if (shouldShow && label.conditions.category_ids && Array.isArray(label.conditions.category_ids) && label.conditions.category_ids.length > 0) {
              if (!product.category_ids || !product.category_ids.some(catId => label.conditions.category_ids.includes(catId))) {
                shouldShow = false;
              }
            }

            // Check price conditions
            if (shouldShow && label.conditions.price_conditions) {
              const conditions = label.conditions.price_conditions;
              if (conditions.has_sale_price) {
                const hasComparePrice = product.compare_price && parseFloat(product.compare_price) > 0;
                const pricesAreDifferent = hasComparePrice && parseFloat(product.compare_price) !== parseFloat(product.price);
                if (!pricesAreDifferent) {
                  shouldShow = false;
                }
              }
              if (shouldShow && conditions.is_new && conditions.days_since_created) {
                const productCreatedDate = new Date(product.created_date);
                const now = new Date();
                const daysSince = Math.floor((now.getTime() - productCreatedDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSince > conditions.days_since_created) {
                  shouldShow = false;
                }
              }
            }

            // Check attribute conditions
            if (shouldShow && label.conditions.attribute_conditions && Array.isArray(label.conditions.attribute_conditions) && label.conditions.attribute_conditions.length > 0) {
              const attributeMatch = label.conditions.attribute_conditions.every(cond => {
                if (product.attributes && product.attributes[cond.attribute_code]) {
                  const productAttributeValue = String(product.attributes[cond.attribute_code]).toLowerCase();
                  const conditionValue = String(cond.attribute_value).toLowerCase();
                  return productAttributeValue === conditionValue;
                }
                return false;
              });
              if (!attributeMatch) {
                shouldShow = false;
              }
            }
          }

          return shouldShow;
        }) || [];

        // Group labels by position and show one label per position
        const labelsByPosition = matchingLabels.reduce((acc, label) => {
          const position = label.position || 'top-right';
          if (!acc[position]) {
            acc[position] = [];
          }
          acc[position].push(label);
          return acc;
        }, {});

        // For each position, sort by sort_order (ASC) then by priority (DESC) and take the first one
        const labelsToShow = Object.values(labelsByPosition).map(positionLabels => {
          const sortedLabels = positionLabels.sort((a, b) => {
            const sortOrderA = a.sort_order || 0;
            const sortOrderB = b.sort_order || 0;
            if (sortOrderA !== sortOrderB) {
              return sortOrderA - sortOrderB; // ASC
            }
            const priorityA = a.priority || 0;
            const priorityB = b.priority || 0;
            return priorityB - priorityA; // DESC
          });
          return sortedLabels[0]; // Return highest priority label for this position
        }).filter(Boolean);

        // Show all labels (one per position)
        return labelsToShow.map(label => (
          <ProductLabelComponent
            key={label.id}
            label={label}
          />
        ));
      };

      // State for preventing duplicate add to cart operations (outside of map)
      const [addingToCartStates, setAddingToCartStates] = useState({});

      // Enhanced ProductCard rendering
      return (
        <div className={`${finalClassName} mb-8`} style={styles}>
          {products.map(product => {
            // Get product template slot configuration for styling
            const productTemplateSlot = slots?.product_template || {};
            const productImageSlot = slots?.product_image || {};
            const productNameSlot = slots?.product_name || {};
            const productPriceSlot = slots?.product_price || {};
            const productComparePriceSlot = slots?.product_compare_price || {};
            const productAddToCartSlot = slots?.product_add_to_cart || {};

            // Check if this product is being added to cart
            const isAddingToCart = addingToCartStates[product.id] || false;

            const handleAddToCart = async (e) => {
              e.preventDefault(); // Prevent navigation when clicking the button
              e.stopPropagation();

              // Prevent multiple rapid additions
              if (isAddingToCart) {
                return;
              }

              try {
                setAddingToCartStates(prev => ({ ...prev, [product.id]: true }));

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
                  console.error('❌ Failed to add to cart:', result.error);

                  // Show error flash message
                  window.dispatchEvent(new CustomEvent('showFlashMessage', {
                    detail: {
                      type: 'error',
                      message: `Failed to add ${product.name} to cart. Please try again.`
                    }
                  }));
                }
              } catch (error) {
                console.error("❌ Failed to add to cart", error);

                // Show error flash message for catch block
                window.dispatchEvent(new CustomEvent('showFlashMessage', {
                  detail: {
                    type: 'error',
                    message: `Error adding ${product.name} to cart. Please try again.`
                  }
                }));
              } finally {
                // Always reset the loading state after 2 seconds to prevent permanent lock
                setTimeout(() => {
                  setAddingToCartStates(prev => ({ ...prev, [product.id]: false }));
                }, 2000);
              }
            };

            return (
              <Card
                key={product.id}
                className={productTemplateSlot.className || `group overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
                style={productTemplateSlot.styles || {}}
              >
                <CardContent className="p-0">
                  <Link to={createProductUrl(store?.slug || '', product.slug || product.id)}>
                    <div className="relative">
                      <img
                        src={getPrimaryImageUrl(product.images) || '/placeholder-product.jpg'}
                        alt={product.name}
                        className={productImageSlot.className || `w-full ${viewMode === 'list' ? 'h-32' : 'h-48'} object-cover transition-transform duration-300 group-hover:scale-105`}
                        style={productImageSlot.styles || {}}
                      />
                      {/* Product labels */}
                      {renderProductLabels(product)}
                    </div>
                  </Link>
                  <div className={viewMode === 'list' ? 'p-4 flex-1' : 'p-4'}>
                    <h3 className={productNameSlot.className || "font-semibold text-lg truncate mt-1"} style={productNameSlot.styles || {}}>
                      <Link to={createProductUrl(store?.slug || '', product.slug || product.id)}>{product.name}</Link>
                    </h3>

                    {viewMode === 'list' && product.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="space-y-3 mt-4">
                      {/* Price display */}
                      <div className="flex items-baseline gap-2">
                        {product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price) ? (
                          <>
                            <p className={productPriceSlot.className || "font-bold text-red-600 text-xl"} style={productPriceSlot.styles || {}}>
                              {formatDisplayPrice(
                                Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
                                settings?.hide_currency_product ? '' : (settings?.currency_symbol || currencySymbol || '$'),
                                store,
                                taxes,
                                selectedCountry
                              )}
                            </p>
                            <p className={productComparePriceSlot.className || "text-gray-500 line-through text-sm"} style={productComparePriceSlot.styles || {}}>
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
                          <p className={productPriceSlot.className || "font-bold text-xl text-gray-900"} style={productPriceSlot.styles || {}}>
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
                        onClick={handleAddToCart}
                        disabled={isAddingToCart}
                        className={productAddToCartSlot.className || "w-full text-white border-0 hover:brightness-90 transition-all duration-200"}
                        size="sm"
                        style={{
                          backgroundColor: settings?.theme?.add_to_cart_button_color || '#3B82F6',
                          color: 'white',
                          ...productAddToCartSlot.styles
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {isAddingToCart ? 'Adding...' : (productAddToCartSlot.content || 'Add to Cart')}
                      </Button>

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
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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