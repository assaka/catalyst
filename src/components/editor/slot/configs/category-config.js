import { Grid, List, Package, Image, DollarSign, ShoppingCart } from 'lucide-react';

// Category Page Configuration - Slot-based layout with microslots
export const categoryConfig = {
  page_name: 'Category',
  slot_type: 'category_layout',

  // Main layout slots
  slots: {
    // Main header container for all header elements
    page_header: {
      id: 'page_header',
      type: 'container',
      content: '',
      className: 'w-full mb-8',
      parentClassName: '',
      styles: {},
      parentId: null,
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    breadcrumbs_content: {
      id: 'breadcrumbs_content',
      type: 'breadcrumbs',
      content: '',
      className: 'flex items-center space-x-2 text-sm text-gray-600 mb-6',
      parentClassName: '',
      styles: {},
      parentId: 'page_header',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        component: 'CategoryBreadcrumbs',
        displayName: 'Breadcrumb Navigation'
      }
    },

    category_title: {
      id: 'category_title',
      type: 'text',
      content: 'Category Name',
      className: 'text-4xl font-bold text-gray-900 mb-2',
      parentClassName: '',
      styles: {
        color: '#FF6B6B'  // Test color - light red/coral
      },
      parentId: 'page_header',
      position: { col: 1, row: 2 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        displayName: 'Category Title'
      }
    },

    category_description: {
      id: 'category_description',
      type: 'text',
      content: 'Discover our amazing collection of products in this category. Browse through our curated selection and find exactly what you need.',
      className: 'text-gray-600 mb-6',
      parentClassName: '',
      styles: {},
      parentId: 'page_header',
      position: { col: 1, row: 3 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        displayName: 'Category Description'
      }
    },

    // Products section
    products_container: {
      id: 'products_container',
      type: 'container',
      content: '',
      className: '',
      parentClassName: '',
      styles: {},
      parentId: null,
      position: { col: 4, row: 2 },
      colSpan: { grid: 9, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Sorting controls and product count
    sorting_controls: {
      id: 'sorting_controls',
      type: 'container',
      content: '',
      className: 'flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4',
      parentClassName: '',
      styles: {},
      parentId: 'products_container',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // CMS blocks above products
    products_above_cms: {
      id: 'products_above_cms',
      type: 'cms_block',
      content: '',
      className: 'mb-6',
      parentClassName: '',
      styles: {},
      parentId: 'products_container',
      position: { col: 1, row: 2 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        cmsPosition: 'category_above_products',
        displayName: 'CMS Block - Above Products'
      }
    },

    // Product count info
    product_count_info: {
      id: 'product_count_info',
      type: 'text',
      content: 'Showing 1-12 of 48 products',
      className: 'text-sm text-gray-600',
      parentClassName: '',
      styles: {},
      parentId: 'sorting_controls',
      position: { col: 1, row: 1 },
      colSpan: { grid: 6, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        component: 'ProductCountInfo'
      }
    },

    // Sort selector
    sort_selector: {
      id: 'sort_selector',
      type: 'select',
      content: '',
      className: 'flex items-center gap-2',
      parentClassName: 'text-right',
      styles: {},
      parentId: 'sorting_controls',
      position: { col: 7, row: 1 },
      colSpan: { grid: 6, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        component: 'SortSelector'
      }
    },

    // Active filters display (at top of sidebar below Filter By)
    active_filters: {
      id: 'active_filters',
      type: 'active_filters',
      content: '',
      className: 'mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'filters_container',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        component: 'ActiveFilters'
      }
    },

    // Main products display using ProductItemCard component
    product_items: {
      id: 'product_items',
      type: 'container',
      content: '',
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'products_container',
      position: { col: 1, row: 3 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        component: 'ProductItemCard',
        displayName: 'Product Grid',
        itemsToShow: 3,
        gridConfig: { mobile: 1, tablet: 2, desktop: 3 }
      }
    },

    // Single product template with microslots (for products_grid alternative)
    product_item_card: {
      id: 'product_item_card',
      type: 'container',
      content: '',
      className: 'group overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow',
      parentClassName: '',
      styles: {},
      parentId: 'product_items',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: true,
        isTemplate: true,
        repeatable: true
      }
    },

    // Product microslots
    product_image_container: {
      id: 'product_image_container',
      type: 'container',
      content: '',
      className: 'relative overflow-hidden',
      parentClassName: '',
      styles: {},
      parentId: 'product_item_card',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 4 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true, microslot: true }
    },

    product_image: {
      id: 'product_image',
      type: 'image',
      content: '',
      className: 'w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105',
      parentClassName: '',
      styles: {},
      parentId: 'product_image_container',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false, microslot: true }
    },

    product_labels: {
      id: 'product_labels',
      type: 'container',
      content: '',
      className: 'absolute top-2 left-2 z-10 flex flex-col gap-1',
      parentClassName: '',
      styles: {},
      parentId: 'product_image_container',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true, microslot: true, overlay: true }
    },

    product_name: {
      id: 'product_name',
      type: 'text',
      content: 'Sample Product Name',
      className: 'font-semibold text-lg truncate',
      parentClassName: '',
      styles: {},
      parentId: 'product_item_card',
      position: { col: 1, row: 2 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false, microslot: true }
    },

    product_price_container: {
      id: 'product_price_container',
      type: 'container',
      content: '',
      className: 'flex items-baseline gap-2',
      parentClassName: '',
      styles: {},
      parentId: 'product_item_card',
      position: { col: 1, row: 3 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true, microslot: true }
    },

    product_price: {
      id: 'product_price',
      type: 'text',
      content: '$29.99',
      className: 'text-lg font-bold text-green-600',
      parentClassName: '',
      styles: {},
      parentId: 'product_price_container',
      position: { col: 1, row: 1 },
      colSpan: { grid: 6, list: 6 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false, microslot: true }
    },

    product_compare_price: {
      id: 'product_compare_price',
      type: 'text',
      content: '$39.99',
      className: 'text-sm text-gray-500 line-through',
      parentClassName: '',
      styles: {},
      parentId: 'product_price_container',
      position: { col: 7, row: 1 },
      colSpan: { grid: 6, list: 6 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false, microslot: true }
    },

    product_add_to_cart: {
      id: 'product_add_to_cart',
      type: 'button',
      content: 'Add to Cart',
      className: 'bg-blue-600 text-white border-0 hover:bg-blue-700 transition-colors duration-200 px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2',
      parentClassName: 'text-center',
      styles: {},
      parentId: 'product_item_card',
      position: { col: 1, row: 4 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false, microslot: true }
    },

    // CMS blocks below products
    products_below_cms: {
      id: 'products_below_cms',
      type: 'cms_block',
      content: '',
      className: 'mt-8',
      parentClassName: '',
      styles: {},
      parentId: 'products_container',
      position: { col: 1, row: 4 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        cmsPosition: 'category_below_products',
        displayName: 'CMS Block - Below Products'
      }
    },

    // Pagination
    pagination_container: {
      id: 'pagination_container',
      type: 'pagination',
      content: '',
      className: 'flex justify-center mt-8',
      parentClassName: 'text-center',
      styles: {},
      parentId: 'products_container',
      position: { col: 1, row: 5 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        component: 'PaginationComponent'
      }
    },

    // Filters section
    filters_container: {
      id: 'filters_container',
      type: 'container',
      content: '',
      className: 'lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto',
      parentClassName: '',
      styles: {},
      parentId: null,
      position: { col: 1, row: 2 },
      colSpan: { grid: 3, list: 12 },
      viewMode: ['grid'],
      metadata: { hierarchical: true }
    },

    // CMS blocks in filters
    filters_above_cms: {
      id: 'filters_above_cms',
      type: 'cms_block',
      content: '',
      className: 'mb-6',
      parentClassName: '',
      styles: {},
      parentId: 'filters_container',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        cmsPosition: 'category_above_filters',
        displayName: 'CMS Block - Above Filters'
      }
    },

    // Simplified Layered Navigation - Single container with editable labels
    layered_navigation: {
      id: 'layered_navigation',
      type: 'layered_navigation',
      content: '',
      className: 'space-y-6',
      parentClassName: '',
      styles: {},
      parentId: 'filters_container',
      position: { col: 1, row: 2 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        component: 'LayeredNavigation',
        displayName: 'Product Filters (Price, Brand, Size, etc.)'
      }
    },

    // Editable labels for layered navigation with color customization
    filter_by_label: {
      id: 'filter_by_label',
      type: 'text',
      content: 'Filter By',
      className: 'text-lg font-semibold text-gray-900',
      parentClassName: '',
      styles: {
        color: '#1F2937' // Default dark gray
      },
      parentId: 'layered_navigation',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Filter By Label',
        labelType: 'header',
        customizable: ['color', 'fontSize', 'fontWeight']
      }
    },

    price_filter_label: {
      id: 'price_filter_label',
      type: 'text',
      content: 'Price',
      className: 'font-semibold text-base text-gray-900',
      parentClassName: '',
      styles: {
        color: '#374151' // Default gray-700
      },
      parentId: 'layered_navigation',
      position: { col: 1, row: 2 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Price Filter Label',
        labelType: 'attribute',
        customizable: ['color', 'fontSize', 'fontWeight']
      }
    },

    // Shared attribute filter label for all attribute filters (Brand, Color, Size, Material)
    attribute_filter_label: {
      id: 'attribute_filter_label',
      type: 'text',
      content: 'Attribute Filter',
      className: 'font-semibold text-base text-gray-900',
      parentClassName: '',
      styles: {
        color: '#374151' // Default gray-700
      },
      parentId: 'layered_navigation',
      position: { col: 1, row: 3 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'All Attribute Filter Labels (Brand, Color, Size, Material)',
        labelType: 'attribute_shared',
        customizable: ['color', 'fontSize', 'fontWeight']
      }
    },

    brand_filter_label: {
      id: 'brand_filter_label',
      type: 'text',
      content: 'Brand',
      className: 'font-semibold text-base text-gray-900',
      parentClassName: '',
      styles: {
        color: '#374151' // Default gray-700
      },
      parentId: 'layered_navigation',
      position: { col: 1, row: 4 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Brand Filter Label',
        labelType: 'attribute',
        customizable: ['color', 'fontSize', 'fontWeight']
      }
    },

    color_filter_label: {
      id: 'color_filter_label',
      type: 'text',
      content: 'Color',
      className: 'font-semibold text-base text-gray-900',
      parentClassName: '',
      styles: {
        color: '#374151' // Default gray-700
      },
      parentId: 'layered_navigation',
      position: { col: 1, row: 5 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Color Filter Label',
        labelType: 'attribute',
        customizable: ['color', 'fontSize', 'fontWeight']
      }
    },

    size_filter_label: {
      id: 'size_filter_label',
      type: 'text',
      content: 'Size',
      className: 'font-semibold text-base text-gray-900',
      parentClassName: '',
      styles: {
        color: '#374151' // Default gray-700
      },
      parentId: 'layered_navigation',
      position: { col: 1, row: 6 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Size Filter Label',
        labelType: 'attribute',
        customizable: ['color', 'fontSize', 'fontWeight']
      }
    },

    material_filter_label: {
      id: 'material_filter_label',
      type: 'text',
      content: 'Material',
      className: 'font-semibold text-base text-gray-900',
      parentClassName: '',
      styles: {
        color: '#374151' // Default gray-700
      },
      parentId: 'layered_navigation',
      position: { col: 1, row: 7 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Material Filter Label',
        labelType: 'attribute',
        customizable: ['color', 'fontSize', 'fontWeight']
      }
    },

    // Customizable filter option styles
    filter_option_styles: {
      id: 'filter_option_styles',
      type: 'style_config',
      content: '',
      className: '',
      parentClassName: '',
      styles: {
        optionTextColor: '#374151', // Default gray-700 for option text
        optionHoverColor: '#1F2937', // Default gray-800 for hover
        optionCountColor: '#9CA3AF', // Default gray-400 for count
        checkboxColor: '#3B82F6', // Default blue-500 for checkbox
        activeFilterBgColor: '#DBEAFE', // Default blue-100 for active filter background
        activeFilterTextColor: '#1E40AF' // Default blue-800 for active filter text
      },
      parentId: 'layered_navigation',
      position: { col: 1, row: 8 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Filter Options Styling',
        labelType: 'styling',
        customizable: ['optionTextColor', 'optionHoverColor', 'optionCountColor', 'checkboxColor', 'activeFilterBgColor', 'activeFilterTextColor']
      }
    },

    filters_below_cms: {
      id: 'filters_below_cms',
      type: 'cms_block',
      content: '',
      className: 'mt-6',
      parentClassName: '',
      styles: {},
      parentId: 'filters_container',
      position: { col: 1, row: 3 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        cmsPosition: 'category_below_filters',
        displayName: 'CMS Block - Below Filters'
      }
    }

  },

  // View configuration
  views: [
    { id: 'grid', label: 'Grid View', icon: Grid },
    { id: 'list', label: 'List View', icon: List }
  ],

  // CMS blocks for additional content areas
  cmsBlocks: [
    'category_header',
    'category_above_filters',
    'category_below_filters',
    'category_above_products',
    'category_below_products',
    'category_footer'
  ],

  // Microslot definitions for category and product components
  microslots: {
    breadcrumbs_content: {
      type: 'breadcrumbs',
      editable: true,
      dataBinding: 'category.breadcrumbs',
      categoryBinding: 'category'
    },
    category_title: {
      type: 'text',
      editable: true,
      dataBinding: 'category.name',
      fallback: 'Category Name'
    },
    product_image: {
      type: 'image',
      editable: true,
      dataBinding: 'product.images[0]',
      altBinding: 'product.name'
    },
    product_name: {
      type: 'text',
      editable: true,
      dataBinding: 'product.name',
      linkBinding: 'product.url'
    },
    product_price: {
      type: 'price',
      editable: true,
      dataBinding: 'product.price',
      formatBinding: 'formatDisplayPrice'
    },
    product_compare_price: {
      type: 'price',
      editable: true,
      dataBinding: 'product.compare_price',
      conditionalDisplay: 'product.compare_price > product.price'
    },
    product_add_to_cart: {
      type: 'button',
      editable: true,
      actionBinding: 'addToCart',
      conditionalDisplay: 'product.in_stock'
    }
  }
};

export default categoryConfig;