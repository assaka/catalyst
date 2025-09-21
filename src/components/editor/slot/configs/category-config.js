import { Grid, FileText } from 'lucide-react';

// Category Page Configuration - Following cart-config.js pattern exactly
export const categoryConfig = {
  page_name: 'Category',
  slot_type: 'category_layout',

  // Slot configuration with full structure like cart-config
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
      colSpan: 12,
      rowSpan: 1,
      position: {
        colStart: 1,
        colSpan: 12,
        rowStart: 1,
        rowSpan: 1
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
      colSpan: 12,
      rowSpan: 1,
      position: {
        colStart: 1,
        colSpan: 12,
        rowStart: 2,
        rowSpan: 1
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
      content: '',
      className: 'category-filters',
      styles: {},
      parentId: null,
      layout: null,
      gridCols: null,
      colSpan: 3,
      rowSpan: 1,
      position: {
        colStart: 1,
        colSpan: 3,
        rowStart: 3,
        rowSpan: 1
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
      content: '',
      className: 'category-products',
      styles: {},
      parentId: null,
      layout: null,
      gridCols: null,
      colSpan: 9,
      rowSpan: 1,
      position: {
        colStart: 4,
        colSpan: 9,
        rowStart: 3,
        rowSpan: 1
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
      content: '',
      className: 'category-pagination',
      styles: {},
      parentId: null,
      layout: null,
      gridCols: null,
      colSpan: 12,
      rowSpan: 1,
      position: {
        colStart: 1,
        colSpan: 12,
        rowStart: 4,
        rowSpan: 1
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