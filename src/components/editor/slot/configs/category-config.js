import { Grid, List } from 'lucide-react';

// Category Page Configuration - EXACT Category.jsx layout structure
export const categoryConfig = {
  page_name: 'Category',
  slot_type: 'category_layout',

  // Slot configuration matching EXACT Category.jsx structure (lines 224-300)
  slots: {
    // Line 235-241: Header section with breadcrumb, title, description
    breadcrumbs: {
      id: 'breadcrumbs',
      type: 'text',
      content: '<nav class="flex items-center space-x-2 text-sm text-gray-600"><a href="/" class="hover:text-gray-900">Home</a><span>/</span><span class="text-gray-900">Electronics</span></nav>',
      className: 'w-full category-breadcrumbs',
      parentClassName: '',
      styles: {},
      parentId: null,
      position: { col: 1, row: 1 },
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    header: {
      id: 'header',
      type: 'text',
      content: '<h1 class="text-4xl font-bold">Electronics</h1>',
      className: 'w-full category-header',
      parentClassName: '',
      styles: {},
      parentId: null,
      position: { col: 1, row: 2 },
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    header_description: {
      id: 'header_description',
      type: 'text',
      content: '<p class="text-gray-600 mt-2">Browse our latest electronics and gadgets</p>',
      className: 'w-full mb-8',
      parentClassName: '',
      styles: {},
      parentId: null,
      position: { col: 1, row: 3 },
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    // Line 245-253: Filters sidebar (lg:col-span-1)
    filters: {
      id: 'filters',
      type: 'container',
      content: '',
      className: 'category-filters bg-white rounded-lg shadow p-6',
      styles: {},
      parentId: null,
      position: { col: 1, row: 4 },
      layout: 'block',
      colSpan: {
        grid: 3,   // lg:col-span-1 = 3 of 12
        list: 0    // Hidden in list view
      },
      viewMode: ['grid'],
      metadata: { hierarchical: false }
    },

    filters_title: {
      id: 'filters_title',
      type: 'text',
      content: '<h3 class="text-lg font-semibold mb-4">Filters</h3>',
      className: 'w-full',
      parentClassName: '',
      styles: {},
      parentId: 'filters',
      colSpan: {
        grid: 12,
        list: 0
      },
      viewMode: ['grid'],
      metadata: { hierarchical: false }
    },

    filters_content: {
      id: 'filters_content',
      type: 'text',
      content: '<div class="space-y-6"><div><h4 class="font-medium text-gray-700 mb-2">Price Range</h4><div class="space-y-2"><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">Under $25</span></label><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">$25 - $50</span></label><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">$50 - $100</span></label><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">Over $100</span></label></div></div><div><h4 class="font-medium text-gray-700 mb-2">Brand</h4><div class="space-y-2"><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">Apple</span></label><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">Samsung</span></label><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">Google</span></label></div></div><div><h4 class="font-medium text-gray-700 mb-2">Rating</h4><div class="space-y-2"><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">5 stars</span></label><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">4 stars & up</span></label><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">3 stars & up</span></label></div></div></div>',
      className: 'w-full',
      parentClassName: '',
      styles: {},
      parentId: 'filters',
      colSpan: {
        grid: 12,
        list: 0
      },
      viewMode: ['grid'],
      metadata: { hierarchical: false }
    },

    // Line 273: Products grid (lg:col-span-3)
    products: {
      id: 'products',
      type: 'container',
      content: '',
      className: 'category-products grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 min-h-[400px]',
      styles: {},
      parentId: null,
      position: { col: 4, row: 4 },
      layout: 'grid',
      colSpan: {
        grid: 9,   // lg:col-span-3 = 9 of 12
        list: 12   // Full width in list view
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    // Product cards
    product_1: {
      id: 'product_1',
      type: 'container',
      content: '',
      className: 'bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow',
      styles: {},
      parentId: 'products',
      layout: 'block',
      colSpan: {
        grid: 4,    // 1 of 3 columns in products grid
        list: 12    // Full width in list view
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_1_image: {
      id: 'product_1_image',
      type: 'image',
      content: 'https://via.placeholder.com/300x300',
      className: 'aspect-square bg-gray-100 rounded-t-lg w-full object-cover',
      parentClassName: '',
      styles: {},
      parentId: 'product_1',
      colSpan: {
        grid: 12,
        list: 4
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_1_content: {
      id: 'product_1_content',
      type: 'container',
      content: '',
      className: 'p-4',
      styles: {},
      parentId: 'product_1',
      layout: 'block',
      colSpan: {
        grid: 12,
        list: 8
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_1_name: {
      id: 'product_1_name',
      type: 'text',
      content: 'Wireless Headphones',
      className: 'text-lg font-semibold text-gray-900 mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'product_1_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_1_description: {
      id: 'product_1_description',
      type: 'text',
      content: 'High-quality wireless headphones with noise cancellation',
      className: 'text-gray-600 text-sm mb-3',
      parentClassName: '',
      styles: {},
      parentId: 'product_1_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_1_price: {
      id: 'product_1_price',
      type: 'text',
      content: '$199.99',
      className: 'text-xl font-bold text-gray-900 mb-3',
      parentClassName: '',
      styles: {},
      parentId: 'product_1_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_1_button: {
      id: 'product_1_button',
      type: 'button',
      content: 'Add to Cart',
      className: 'w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors',
      parentClassName: '',
      styles: {},
      parentId: 'product_1_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_2: {
      id: 'product_2',
      type: 'container',
      content: '',
      className: 'bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow',
      styles: {},
      parentId: 'products',
      layout: 'block',
      colSpan: {
        grid: 4,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_2_image: {
      id: 'product_2_image',
      type: 'image',
      content: 'https://via.placeholder.com/300x300',
      className: 'aspect-square bg-gray-100 rounded-t-lg w-full object-cover',
      parentClassName: '',
      styles: {},
      parentId: 'product_2',
      colSpan: {
        grid: 12,
        list: 4
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_2_content: {
      id: 'product_2_content',
      type: 'container',
      content: '',
      className: 'p-4',
      styles: {},
      parentId: 'product_2',
      layout: 'block',
      colSpan: {
        grid: 12,
        list: 8
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_2_name: {
      id: 'product_2_name',
      type: 'text',
      content: 'Smartphone',
      className: 'text-lg font-semibold text-gray-900 mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'product_2_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_2_description: {
      id: 'product_2_description',
      type: 'text',
      content: 'Latest model smartphone with advanced camera',
      className: 'text-gray-600 text-sm mb-3',
      parentClassName: '',
      styles: {},
      parentId: 'product_2_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_2_price: {
      id: 'product_2_price',
      type: 'text',
      content: '$799.99',
      className: 'text-xl font-bold text-gray-900 mb-3',
      parentClassName: '',
      styles: {},
      parentId: 'product_2_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_2_button: {
      id: 'product_2_button',
      type: 'button',
      content: 'Add to Cart',
      className: 'w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors',
      parentClassName: '',
      styles: {},
      parentId: 'product_2_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_3: {
      id: 'product_3',
      type: 'container',
      content: '',
      className: 'bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow',
      styles: {},
      parentId: 'products',
      layout: 'block',
      colSpan: {
        grid: 4,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_3_image: {
      id: 'product_3_image',
      type: 'image',
      content: 'https://via.placeholder.com/300x300',
      className: 'aspect-square bg-gray-100 rounded-t-lg w-full object-cover',
      parentClassName: '',
      styles: {},
      parentId: 'product_3',
      colSpan: {
        grid: 12,
        list: 4
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_3_content: {
      id: 'product_3_content',
      type: 'container',
      content: '',
      className: 'p-4',
      styles: {},
      parentId: 'product_3',
      layout: 'block',
      colSpan: {
        grid: 12,
        list: 8
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_3_name: {
      id: 'product_3_name',
      type: 'text',
      content: 'Tablet',
      className: 'text-lg font-semibold text-gray-900 mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'product_3_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_3_description: {
      id: 'product_3_description',
      type: 'text',
      content: 'Portable tablet perfect for work and entertainment',
      className: 'text-gray-600 text-sm mb-3',
      parentClassName: '',
      styles: {},
      parentId: 'product_3_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_3_price: {
      id: 'product_3_price',
      type: 'text',
      content: '$299.99',
      className: 'text-xl font-bold text-gray-900 mb-3',
      parentClassName: '',
      styles: {},
      parentId: 'product_3_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_3_button: {
      id: 'product_3_button',
      type: 'button',
      content: 'Add to Cart',
      className: 'w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors',
      parentClassName: '',
      styles: {},
      parentId: 'product_3_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },
  },

  // Configuration metadata
  metadata: {
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '1.0',
    pageType: 'category'
  },

  // View configuration
  views: [
    { id: 'grid', label: 'Grid View', icon: Grid },
    { id: 'list', label: 'List View', icon: List }
  ],

  // CMS blocks matching Category.jsx exactly (lines 246, 252, 257, 297)
  cmsBlocks: [
    'category_above_filters',
    'category_below_filters',
    'category_above_products',
    'category_below_products'
  ]
};

export default categoryConfig;