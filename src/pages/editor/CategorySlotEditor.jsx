/**
 * CategorySlotEditor - Category page layout editor using the generic slot system
 */

import React from 'react';
import GenericSlotEditor from '@/components/editor/slot-system/GenericSlotEditor';
import { getPageConfig } from '@/components/editor/slot-system/page-configs';

// Category-specific slot components
function CategoryHeaderSlot({ data, content }) {
  return (
    <div className="category-header">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <>
          <h1 className="text-3xl font-bold">{data.category?.name || 'Category Name'}</h1>
          <p className="text-gray-600 mt-2">{data.category?.description || 'Category description'}</p>
        </>
      )}
    </div>
  );
}

function ProductGridSlot({ data, content, config }) {
  const products = data.products || [];
  const viewMode = config.viewMode || 'grid';
  
  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No products in this category
      </div>
    );
  }
  
  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-4' : 'space-y-4'}>
      {products.slice(0, 6).map((product, index) => (
        <div key={index} className={viewMode === 'grid' ? 'border rounded-lg p-4' : 'border rounded-lg p-4 flex gap-4'}>
          <div className={viewMode === 'grid' ? '' : 'w-32 h-32 bg-gray-200 rounded flex-shrink-0'}>
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-auto" />
            ) : (
              <div className="w-full h-32 bg-gray-200 rounded"></div>
            )}
          </div>
          <div className={viewMode === 'grid' ? 'mt-2' : 'flex-1'}>
            <h3 className="font-semibold">{product.name || `Product ${index + 1}`}</h3>
            <p className="text-gray-600">${product.price || '99.99'}</p>
            {viewMode === 'list' && (
              <p className="text-sm text-gray-500 mt-1">{product.description || 'Product description...'}</p>
            )}
            <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Add to Cart
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function FiltersSlot({ data, content }) {
  return (
    <div className="filters-sidebar">
      <h3 className="font-semibold mb-4">Filters</h3>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Price Range</h4>
          <input type="range" className="w-full" />
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">Brand</h4>
          <div className="space-y-1">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Brand A
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Brand B
            </label>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">Size</h4>
          <div className="grid grid-cols-3 gap-2">
            {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
              <button key={size} className="border rounded px-2 py-1 hover:bg-gray-100">
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SortingSlot({ data, content }) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="text-gray-600">
        Showing {data.products?.length || 0} products
      </div>
      <select className="border rounded px-3 py-1">
        <option>Sort by: Featured</option>
        <option>Price: Low to High</option>
        <option>Price: High to Low</option>
        <option>Name: A-Z</option>
        <option>Name: Z-A</option>
        <option>Newest First</option>
      </select>
    </div>
  );
}

// Create enhanced page config with components
const categoryPageConfig = {
  ...getPageConfig('category'),
  slots: {
    ...getPageConfig('category').slots,
    header: {
      ...getPageConfig('category').slots.header,
      component: CategoryHeaderSlot
    },
    products: {
      ...getPageConfig('category').slots.products,
      component: ProductGridSlot
    },
    filters: {
      ...getPageConfig('category').slots.filters,
      component: FiltersSlot
    },
    sorting: {
      ...getPageConfig('category').slots.sorting,
      component: SortingSlot
    }
  }
};

export default function CategorySlotEditor({ data = {}, onSave, mode = 'editor' }) {
  // Sample data for preview
  const sampleData = {
    category: {
      id: 1,
      name: 'Electronics',
      description: 'Latest electronic gadgets and accessories'
    },
    products: [
      { id: 1, name: 'Smartphone X', price: 999, image: 'https://via.placeholder.com/200' },
      { id: 2, name: 'Laptop Pro', price: 1499, image: 'https://via.placeholder.com/200' },
      { id: 3, name: 'Wireless Earbuds', price: 199, image: 'https://via.placeholder.com/200' },
      { id: 4, name: 'Smart Watch', price: 399, image: 'https://via.placeholder.com/200' },
      { id: 5, name: 'Tablet Plus', price: 799, image: 'https://via.placeholder.com/200' },
      { id: 6, name: 'Power Bank', price: 49, image: 'https://via.placeholder.com/200' },
    ],
    ...data
  };
  
  return (
    <div className="category-slot-editor">
      <GenericSlotEditor
        pageType="category"
        pageConfig={categoryPageConfig}
        data={sampleData}
        mode={mode}
        onSave={onSave}
        className="max-w-7xl mx-auto px-4"
      />
    </div>
  );
}