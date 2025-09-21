import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Filter, Grid, List } from 'lucide-react';

// ============================================
// Category-specific Slot Components
// ============================================

// CategoryHeaderSlot Component
export function CategoryHeaderSlot({ data, content }) {
  return (
    <div className="category-header">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <>
          <h1 className="text-3xl font-bold">{data?.category?.name || 'Category Name'}</h1>
          <p className="text-gray-600 mt-2">{data?.category?.description || 'Category description'}</p>
        </>
      )}
    </div>
  );
}

// CategoryBreadcrumbsSlot Component
export function CategoryBreadcrumbsSlot({ data, content }) {
  return (
    <nav className="text-sm text-gray-500 mb-4">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <div className="flex items-center space-x-2">
          <Link to="/" className="hover:text-gray-700">Home</Link>
          <span>&gt;</span>
          <span>{data?.category?.parent || 'Products'}</span>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">
            {data?.category?.name || 'Category'}
          </span>
        </div>
      )}
    </nav>
  );
}

// ProductGridSlot Component
export function ProductGridSlot({ data, content, config }) {
  const products = data?.products || [];
  const viewMode = config?.viewMode || 'grid';

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No products in this category</p>
      </div>
    );
  }

  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
      {products.slice(0, 6).map((product, index) => (
        <Card key={index} className={viewMode === 'grid' ? 'overflow-hidden' : 'overflow-hidden flex'}>
          <div className={viewMode === 'grid' ? '' : 'w-48 h-48 flex-shrink-0'}>
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className={viewMode === 'grid' ? 'w-full h-48 object-cover' : 'w-full h-full object-cover'}
              />
            ) : (
              <div className={viewMode === 'grid' ? 'w-full h-48 bg-gray-200 flex items-center justify-center' : 'w-full h-full bg-gray-200 flex items-center justify-center'}>
                <span className="text-gray-400">No Image</span>
              </div>
            )}
          </div>
          <CardContent className={viewMode === 'grid' ? 'p-4' : 'p-4 flex-1'}>
            <h3 className="font-semibold text-lg mb-2">{product.name || `Product ${index + 1}`}</h3>
            <p className="text-2xl font-bold text-blue-600 mb-2">
              ${product.price || '99.99'}
            </p>
            {viewMode === 'list' && (
              <p className="text-sm text-gray-600 mb-3">{product.description || 'Product description...'}</p>
            )}
            <Button className="w-full">
              Add to Cart
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// CategoryFiltersSlot Component
export function CategoryFiltersSlot({ data, content }) {
  return (
    <Card className="filters-sidebar">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Range */}
        <div>
          <h4 className="text-sm font-medium mb-3">Price Range</h4>
          <div className="space-y-2">
            <Input type="range" className="w-full" min="0" max="1000" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>$0</span>
              <span>$1000+</span>
            </div>
          </div>
        </div>

        {/* Brand Filter */}
        <div>
          <h4 className="text-sm font-medium mb-3">Brand</h4>
          <div className="space-y-2">
            {['Samsung', 'Apple', 'Sony', 'LG'].map(brand => (
              <label key={brand} className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">{brand}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Rating Filter */}
        <div>
          <h4 className="text-sm font-medium mb-3">Customer Rating</h4>
          <div className="space-y-2">
            {[4, 3, 2, 1].map(rating => (
              <label key={rating} className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">{rating}+ stars</span>
              </label>
            ))}
          </div>
        </div>

        {/* Apply Filters Button */}
        <Button className="w-full" variant="outline">
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
}

// CategorySortingSlot Component
export function CategorySortingSlot({ data, content, config }) {
  const viewMode = config?.viewMode || 'grid';

  return (
    <div className="category-sorting flex justify-between items-center mb-6">
      {/* Sort Options */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium">Sort by:</label>
        <select className="border rounded px-3 py-1 text-sm">
          <option value="featured">Featured</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="name">Name A-Z</option>
          <option value="rating">Customer Rating</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">View:</span>
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// CategoryPaginationSlot Component
export function CategoryPaginationSlot({ data, content }) {
  const currentPage = 1;
  const totalPages = 5;

  return (
    <div className="category-pagination flex justify-center items-center space-x-2 mt-8">
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        className="flex items-center"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>

      {/* Page Numbers */}
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map(page => (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
          >
            {page}
          </Button>
        ))}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        className="flex items-center"
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

// CategoryStatsSlot Component - Shows product count, etc.
export function CategoryStatsSlot({ data, content }) {
  const products = data?.products || [];
  const totalProducts = products.length;

  return (
    <div className="category-stats text-sm text-gray-600 mb-4">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <p>
          Showing {Math.min(6, totalProducts)} of {totalProducts} products
        </p>
      )}
    </div>
  );
}

// CategorySeoContentSlot Component - SEO content at bottom
export function CategorySeoContentSlot({ data, content }) {
  return (
    <div className="category-seo-content mt-12 prose max-w-none">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <div>
          <h2>About {data?.category?.name || 'This Category'}</h2>
          <p>
            Discover our wide selection of {data?.category?.name?.toLowerCase() || 'products'}.
            We offer high-quality items at competitive prices with fast shipping.
          </p>
          <p>
            Browse through our collection and find exactly what you're looking for.
            All products come with our satisfaction guarantee.
          </p>
        </div>
      )}
    </div>
  );
}

export default {
  CategoryHeaderSlot,
  CategoryBreadcrumbsSlot,
  ProductGridSlot,
  CategoryFiltersSlot,
  CategorySortingSlot,
  CategoryPaginationSlot,
  CategoryStatsSlot,
  CategorySeoContentSlot
};