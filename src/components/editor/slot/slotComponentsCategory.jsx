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
export function CategoryHeaderSlot({ categoryData, content }) {
  const { category } = categoryData || {};

  return (
    <div className="category-header">
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
export function CategoryBreadcrumbsSlot({ categoryData, content, storeCode, categories }) {
  const { category, breadcrumbs } = categoryData || {};

  return (
    <nav className="category-breadcrumbs">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          {breadcrumbs && breadcrumbs.length > 0 ? (
            // Use the hierarchical breadcrumbs from the context
            breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                <span>/</span>
                {item.url ? (
                  <Link to={item.url} className="hover:text-gray-900">
                    {item.name}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-900">{item.name}</span>
                )}
              </React.Fragment>
            ))
          ) : (
            // Fallback to simple category display
            category?.name && (
              <>
                <span>/</span>
                <span className="font-medium text-gray-900">{category.name}</span>
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Showing {products?.length > 0 ? 1 : 0}-{products?.length || 0} of {products?.length || 0} products
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select className="border border-gray-300 rounded px-3 py-1 text-sm bg-white">
              <option>Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Name: A-Z</option>
              <option>Name: Z-A</option>
              <option>Newest First</option>
            </select>
          </div>
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

// CategoryLayeredNavigationSlot Component - Editable wrapper for LayeredNavigation
export function CategoryLayeredNavigationSlot({ categoryContext, content, config }) {
  const { allProducts, filterableAttributes } = categoryContext || {};

  return (
    <div className="category-layered-navigation">
      {content?.html ? (
        <div dangerouslySetInnerHTML={{ __html: content.html }} />
      ) : (
        <LayeredNavigation
          products={allProducts || []}
          attributes={filterableAttributes || []}
          onFilterChange={(filters) => {
            console.log('🔍 Filters changed:', filters);
            // In edit mode, this would update the slot configuration
            if (content?.onFilterUpdate) {
              content.onFilterUpdate(filters);
            }
          }}
        />
      )}
    </div>
  );
}

// CategoryProductItemCardSlot Component - Editable wrapper for ProductItemCard
export function CategoryProductItemCardSlot({ categoryContext, content, config }) {
  const { products, currencySymbol, productLabels } = categoryContext || {};
  const { viewMode = 'grid' } = config || {};

  // Get configuration from content or use defaults
  const {
    itemsToShow = 3,
    store = { slug: 'demo-store', id: 1 },
    settings = {
      currency_symbol: currencySymbol || '$',
      theme: { add_to_cart_button_color: '#3B82F6' }
    }
  } = content || {};

  return (
    <div className="category-product-item-cards">
      {content?.html ? (
        <div dangerouslySetInnerHTML={{ __html: content.html }} />
      ) : (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
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
  CategoryFiltersSlot,
  CategoryMainContentSlot,
  CategorySortingSlot,
  CategoryProductsSlot,
  CategoryPaginationSlot,
  CategoryLayeredNavigationSlot,
  CategoryProductItemCardSlot
};