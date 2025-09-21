import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Grid, List, Filter, Search, Tag, ChevronDown } from 'lucide-react';
import { SlotManager } from '@/utils/slotUtils';
import { filterSlotsByViewMode, sortSlotsByGridCoordinates } from '@/hooks/useSlotConfiguration';

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
      // Use content from slot if provided, otherwise generate breadcrumbs
      if (content && content.trim()) {
        return wrapWithParentClass(
          <div
            className={className || "flex mb-4"}
            style={styles}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
      }

      // Generate dynamic breadcrumbs
      return wrapWithParentClass(
        <nav className={className || "flex mb-4"} style={styles} aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <button
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-800"
              >
                Home
              </button>
            </li>
            {breadcrumbs.map((breadcrumb, index) => (
              <li key={index} className="inline-flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-gray-500">{breadcrumb.name}</span>
                ) : (
                  <button
                    onClick={() => navigate(breadcrumb.url)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {breadcrumb.name}
                  </button>
                )}
              </li>
            ))}
            {category && (
              <li className="inline-flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-500">{category.name}</span>
              </li>
            )}
          </ol>
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

    // Filters container - Column 1
    if (id === 'filters_container') {
      return wrapWithParentClass(
        <div className={className || "w-full"} style={styles}>
          <Card className="sticky top-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  {content || 'Filters'}
                </h3>
                {Object.keys(selectedFilters).length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Price Range Filter */}
              {priceRange && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min || ''}
                      onChange={(e) => handleFilterChange('price', { ...priceRange, min: e.target.value })}
                      className="w-24"
                    />
                    <span>-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max || ''}
                      onChange={(e) => handleFilterChange('price', { ...priceRange, max: e.target.value })}
                      className="w-24"
                    />
                  </div>
                </div>
              )}

              {/* Category Filters */}
              {Object.entries(filters).map(([filterKey, filterOptions]) => (
                <div key={filterKey} className="mb-4">
                  <label className="block text-sm font-medium mb-2 capitalize">
                    {filterKey.replace('_', ' ')}
                  </label>
                  <div className="space-y-2">
                    {filterOptions.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedFilters[filterKey]?.includes(option.value) || false}
                          onChange={(e) => {
                            const currentValues = selectedFilters[filterKey] || [];
                            const newValues = e.target.checked
                              ? [...currentValues, option.value]
                              : currentValues.filter(v => v !== option.value);
                            handleFilterChange(filterKey, newValues);
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">
                          {option.label} ({option.count})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
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