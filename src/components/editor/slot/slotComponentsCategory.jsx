import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, Grid, List, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import LayeredNavigation from '@/components/storefront/LayeredNavigation';
import ProductItemCard from '@/components/storefront/ProductItemCard';

// ============================================
// Category-specific Slot Components
// ============================================

// CategoryHeaderSlot Component
export function CategoryHeaderSlot({ categoryData, content, className, styles }) {
  const { category } = categoryData || {};

  return (
    <div className={className || "category-header"} style={styles}>
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <>
          <h1 className="text-3xl font-bold text-gray-900">
            {category?.name || 'Category Name'}
          </h1>
          {category?.description && (
            <p className="text-gray-600 mt-2">{category.description}</p>
          )}
        </>
      )}
    </div>
  );
}

// CategoryBreadcrumbsSlot Component
export function CategoryBreadcrumbsSlot({ categoryData, content, storeCode, categories, className, styles }) {
  const { category, breadcrumbs } = categoryData || {};


  return (
    <nav className={className || "category-breadcrumbs"} style={styles}>
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-gray-900 whitespace-nowrap">Home</Link>
          {breadcrumbs && breadcrumbs.length > 0 ? (
            // Use the hierarchical breadcrumbs from the context
            breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                <span>/</span>
                {item.url ? (
                  <Link to={item.url} className="hover:text-gray-900 whitespace-nowrap">
                    {item.name}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-900 whitespace-nowrap">{item.name}</span>
                )}
              </React.Fragment>
            ))
          ) : (
            // Fallback to simple category display
            category?.name && (
              <>
                <span>/</span>
                <span className="font-medium text-gray-900 whitespace-nowrap">{category.name}</span>
              </>
            )
          )}
        </div>
      )}
    </nav>
  );
}

// CategoryFiltersSlot Component - Column 1 in 2-column layout
export function CategoryFiltersSlot({ categoryData, content }) {
  return (
    <div className="category-filters w-full">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <Card className="sticky top-4">
          <CardContent className="p-4">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </h3>

                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Price Range</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">Under $25</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">$25 - $50</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">$50 - $100</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">Over $100</span>
                    </label>
                  </div>
                </div>

                {/* Brand */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Brand</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">Apple</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">Samsung</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">Google</span>
                    </label>
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Rating</h4>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map(rating => (
                      <label key={rating} className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                          <span className="text-sm ml-1">& up</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// CategoryMainContentSlot Component - Column 2 in 2-column layout
export function CategoryMainContentSlot({ categoryData, content, config }) {
  return (
    <div className="category-main-content w-full">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <div className="space-y-6">
          <CategorySortingSlot categoryData={categoryData} />
          <CategoryProductsSlot categoryData={categoryData} config={config} />
          <CategoryPaginationSlot categoryData={categoryData} />
        </div>
      )}
    </div>
  );
}

// CategorySortingSlot Component - For column 2 layout
export function CategorySortingSlot({ categoryData, content }) {
  const { products } = categoryData || {};

  return (
    <div className="category-sorting">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">Sort by:</span>
          <select className="border border-gray-300 rounded px-3 py-1 text-sm bg-white">
            <option>Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Name: A-Z</option>
            <option>Name: Z-A</option>
            <option>Newest First</option>
          </select>
        </div>
      )}
    </div>
  );
}

// CategoryProductsSlot Component - Optimized for 2-column layout
export function CategoryProductsSlot({ categoryData, content, config }) {
  const { products } = categoryData || {};
  const { viewMode } = config || {};

  return (
    <div className="category-products">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <div>
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-sm text-gray-600">View:</span>
            <Button variant="outline" size="sm">
              <Grid className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Products Grid - Optimized for narrower column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {(products || []).map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-base">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      ${product.price}
                    </span>
                    <Button size="sm">Add to Cart</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {products?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found in this category.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// CategoryPaginationSlot Component
export function CategoryPaginationSlot({ categoryData, content }) {
  return (
    <div className="category-pagination">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <div className="flex items-center justify-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="default" size="sm">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <span className="px-2 text-gray-500">...</span>
          <Button variant="outline" size="sm">10</Button>
          <Button variant="outline" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// CategoryActiveFiltersSlot Component - Displays active filters with clear functionality
export function CategoryActiveFiltersSlot({ categoryContext, content, config }) {
  const { selectedFilters = {}, clearFilters, filterableAttributes = [] } = categoryContext || {};

  // Check if there are any active filters
  const hasActiveFilters = Object.keys(selectedFilters).length > 0;

  if (!hasActiveFilters) {
    return null; // Don't render anything if no active filters
  }

  return (
    <div className="category-active-filters mb-4">
      {content?.html ? (
        <div dangerouslySetInnerHTML={{ __html: content.html }} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Active Filters:</span>

          {/* Render active attribute filters */}
          {Object.entries(selectedFilters).map(([filterKey, filterValues]) => {
            if (filterKey === 'priceRange') {
              const [min, max] = filterValues;
              return (
                <span
                  key="price-range"
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                >
                  Price: ${min} - ${max}
                  <button
                    onClick={() => {
                      const newFilters = { ...selectedFilters };
                      delete newFilters.priceRange;
                      if (categoryContext?.handleFilterChange) {
                        categoryContext.handleFilterChange(newFilters);
                      }
                    }}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              );
            }

            if (Array.isArray(filterValues)) {
              return filterValues.map(value => {
                // Find the attribute to get the display name
                const attribute = filterableAttributes.find(attr =>
                  attr.code === filterKey || attr.name === filterKey
                );
                const attributeName = attribute?.name || filterKey;

                return (
                  <span
                    key={`${filterKey}-${value}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {attributeName}: {value}
                    <button
                      onClick={() => {
                        const newValues = filterValues.filter(v => v !== value);
                        const newFilters = { ...selectedFilters };
                        if (newValues.length > 0) {
                          newFilters[filterKey] = newValues;
                        } else {
                          delete newFilters[filterKey];
                        }
                        if (categoryContext?.handleFilterChange) {
                          categoryContext.handleFilterChange(newFilters);
                        }
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                );
              });
            }
            return null;
          })}

          {/* Clear all filters button */}
          <button
            onClick={() => {
              if (clearFilters) {
                clearFilters();
              } else if (categoryContext?.handleFilterChange) {
                categoryContext.handleFilterChange({});
              }
            }}
            className="text-sm text-gray-500 hover:text-gray-700 underline ml-2"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

// CategoryLayeredNavigationSlot Component - Simplified single container with editable labels
export function CategoryLayeredNavigationSlot({ categoryContext, content, config, allSlots, mode }) {
  const { allProducts, filterableAttributes, handleFilterChange } = categoryContext || {};

  // Extract label configurations and styles from the slot configuration
  const labelConfigs = {
    filter_card_header: allSlots?.filter_by_label || { content: 'Filter By' },
    filter_price_title: allSlots?.price_filter_label || { content: 'Price' },
    filter_attribute_titles: {
      brand: allSlots?.brand_filter_label || { content: 'Brand' },
      color: allSlots?.color_filter_label || { content: 'Color' },
      size: allSlots?.size_filter_label || { content: 'Size' },
      material: allSlots?.material_filter_label || { content: 'Material' }
    },
    // Extract custom styling for filter options
    filter_option_styles: allSlots?.filter_option_styles || {
      styles: {
        optionTextColor: '#374151',
        optionHoverColor: '#1F2937',
        optionCountColor: '#9CA3AF',
        checkboxColor: '#3B82F6',
        activeFilterBgColor: '#DBEAFE',
        activeFilterTextColor: '#1E40AF'
      }
    }
  };

  console.log('🏷️ CategoryLayeredNavigationSlot label configs:', labelConfigs);

  return (
    <div className="category-layered-navigation">
      {content?.html ? (
        <div dangerouslySetInnerHTML={{ __html: content.html }} />
      ) : (
        <LayeredNavigation
          products={allProducts || []}
          attributes={filterableAttributes || []}
          onFilterChange={(filters) => {
            console.log('🔍 Filters changed in LayeredNavigation:', filters);
            if (handleFilterChange) {
              handleFilterChange(filters);
            }
          }}
          showActiveFilters={false} // We handle active filters separately
          slotConfig={labelConfigs} // Pass label configurations
          settings={{
            enable_product_filters: true,
            collapse_filters: false,
            max_visible_attributes: 5
          }}
          isEditMode={mode === 'edit'} // Pass edit mode to disable interactivity
        />
      )}
    </div>
  );
}

// CategoryProductItemCardSlot Component - Editable wrapper for ProductItemCard
export function CategoryProductItemCardSlot({ categoryContext, content, config }) {
  const { products, currencySymbol, productLabels } = categoryContext || {};
  const { viewMode = 'grid' } = config || {};

  // Debug logging to see what we have
  console.log('🛍️ CategoryProductItemCardSlot DEBUG:', {
    hasProducts: !!products,
    productsCount: products?.length || 0,
    products: products,
    categoryContext: categoryContext,
    content: content,
    config: config,
    contentGridConfig: content?.gridConfig,
    contentKeys: content ? Object.keys(content) : 'NO CONTENT'
  });

  // Get configuration from content or use defaults
  const {
    itemsToShow = 3,
    store = { slug: 'demo-store', id: 1 },
    settings = {
      currency_symbol: currencySymbol || '$',
      theme: { add_to_cart_button_color: '#3B82F6' }
    },
    gridConfig = { mobile: 1, tablet: 2, desktop: 3 }
  } = content || {};

  console.log('🔧 CategoryProductItemCardSlot GRID CONFIG:', {
    gridConfigFromContent: content?.gridConfig,
    finalGridConfig: gridConfig,
    defaultUsed: !content?.gridConfig
  });

  // Generate dynamic grid classes based on configuration
  const getGridClasses = () => {
    console.log('🔧 getGridClasses called with:', { gridConfig, viewMode });

    if (viewMode === 'list') {
      return 'grid-cols-1';
    }

    const { mobile = 1, tablet = 2, desktop = 3 } = gridConfig;
    const classes = `grid-cols-${mobile} sm:grid-cols-${tablet} lg:grid-cols-${desktop}`;
    console.log('🔧 Generated grid classes:', classes);
    return classes;
  };

  return (
    <div className="category-product-item-cards">
      {content?.html ? (
        <div dangerouslySetInnerHTML={{ __html: content.html }} />
      ) : (
        <div className={`grid gap-4 ${getGridClasses()}`}>
          {(products || []).slice(0, itemsToShow).map((product) => (
            <ProductItemCard
              key={product.id}
              product={product}
              settings={settings}
              store={store}
              taxes={[]}
              selectedCountry="US"
              productLabels={productLabels || []}
              viewMode={viewMode}
              slotConfig={content || {}}
              onAddToCartStateChange={(isAdding) => {
                console.log('🛒 Add to cart state:', isAdding);
                // In edit mode, this could show editing options
                if (content?.onCartStateChange) {
                  content.onCartStateChange(isAdding);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Export all category slot components
export default {
  CategoryHeaderSlot,
  CategoryBreadcrumbsSlot,
  CategoryActiveFiltersSlot,
  CategoryFiltersSlot,
  CategoryMainContentSlot,
  CategorySortingSlot,
  CategoryProductsSlot,
  CategoryPaginationSlot,
  CategoryLayeredNavigationSlot,
  CategoryProductItemCardSlot
};