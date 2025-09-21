import { Grid, FileText } from 'lucide-react';

// Category Page Configuration - Following cart-config.js pattern exactly
export const categoryConfig = {
  page_name: 'Category',
  slot_type: 'category_layout',

  // Slot configuration matching cart-config.js structure exactly
  slots: {
    // Header slot
    header: {
      id: 'header',
      type: 'container',
      content: '<h1>Category Name</h1>',
      className: 'category-header',
      styles: {},
      parentId: null,
      layout: null,
      gridCols: null,
      colSpan: {
        grid: 12,
        list: 12
      },
      rowSpan: 1,
      position: {
        col: 1,
        row: 1
      },
      viewMode: ['grid', 'list'],
      metadata: {},
      visible: true,
      locked: false
    },

    // Breadcrumbs navigation
    breadcrumbs: {
      id: 'breadcrumbs',
      type: 'container',
      content: '<nav>Home > Category</nav>',
      className: 'category-breadcrumbs',
      styles: {},
      parentId: null,
      layout: null,
      gridCols: null,
      colSpan: {
        grid: 12,
        list: 12
      },
      rowSpan: 1,
      position: {
        col: 1,
        row: 2
      },
      viewMode: ['grid', 'list'],
      metadata: {},
      visible: true,
      locked: false
    },

    // Filters sidebar
    filters: {
      id: 'filters',
      type: 'container',
      content: '<div class="filters-container">Filter options here</div>',
      className: 'category-filters',
      styles: {},
      parentId: null,
      layout: null,
      gridCols: null,
      colSpan: {
        grid: 3,
        list: 12
      },
      rowSpan: 1,
      position: {
        col: 1,
        row: 3
      },
      viewMode: ['grid', 'list'],
      metadata: {},
      visible: true,
      locked: false
    },

    // Products grid/list
    products: {
      id: 'products',
      type: 'container',
      content: '<div class="products-grid">Products will appear here</div>',
      className: 'category-products',
      styles: {},
      parentId: null,
      layout: null,
      gridCols: null,
      colSpan: {
        grid: 9,
        list: 12
      },
      rowSpan: 1,
      position: {
        col: 4,
        row: 3
      },
      viewMode: ['grid', 'list'],
      metadata: {},
      visible: true,
      locked: false
    },

    // Pagination
    pagination: {
      id: 'pagination',
      type: 'container',
      content: '<div class="pagination">Page 1 2 3...</div>',
      className: 'category-pagination',
      styles: {},
      parentId: null,
      layout: null,
      gridCols: null,
      colSpan: {
        grid: 12,
        list: 12
      },
      rowSpan: 1,
      position: {
        col: 1,
        row: 4
      },
      viewMode: ['grid', 'list'],
      metadata: {},
      visible: true,
      locked: false
    }
  },

  // CMS block positions
  cmsBlocks: [
    'category_header',
    'category_above_products',
    'category_below_products',
    'category_sidebar',
    'category_footer'
  ],

  // View configuration
  views: [
    { id: 'grid', label: 'Grid View', icon: Grid },
    { id: 'list', label: 'List View', icon: FileText }
  ]
};

export default categoryConfig;