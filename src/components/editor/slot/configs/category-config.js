import { Grid, FileText } from 'lucide-react';

// Category Page Configuration - Essential navigation slots are predefined, products area is customizable
export const categoryConfig = {
  page_name: 'Category',
  slot_type: 'category_layout',
  title: 'Category Layout Editor',
  defaultView: 'grid',

  // Essential slots that are auto-created (navigation, structure)
  defaultSlots: ['header', 'breadcrumbs', 'filters', 'pagination'],

  // Available slot definitions - essential navigation + customizable product slots
  slots: {
    // Essential navigation slots (auto-created)
    header: {
      name: 'Category Header',
      defaultContent: '<h1>Category Name</h1>',
      component: 'category-header',
      className: 'category-header'
    },
    breadcrumbs: {
      name: 'Navigation Breadcrumbs',
      defaultContent: '<nav>Home > Category</nav>',
      component: 'breadcrumbs',
      className: 'category-breadcrumbs'
    },
    filters: {
      name: 'Layered Navigation',
      defaultContent: '',
      component: 'category-filters',
      className: 'category-filters'
    },
    pagination: {
      name: 'Product Pagination',
      defaultContent: '',
      component: 'pagination',
      className: 'category-pagination'
    },

    // Customizable product area slots (user can add via editor)
    sorting: {
      name: 'Sort Controls',
      defaultContent: '',
      component: 'category-sorting',
      className: 'category-sorting'
    },
    products: {
      name: 'Product Grid/List',
      defaultContent: '',
      component: 'category-products',
      className: 'category-products'
    },
    products_toolbar: {
      name: 'Products Toolbar',
      defaultContent: '',
      component: 'products-toolbar',
      className: 'products-toolbar'
    },
    category_description: {
      name: 'Category Description',
      defaultContent: '<div class="category-description">Category description...</div>',
      component: 'category-description',
      className: 'category-description'
    },
    featured_products: {
      name: 'Featured Products',
      defaultContent: '',
      component: 'featured-products',
      className: 'featured-products'
    },
    category_banner: {
      name: 'Category Banner',
      defaultContent: '',
      component: 'category-banner',
      className: 'category-banner'
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