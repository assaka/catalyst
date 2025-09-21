import { Grid, FileText } from 'lucide-react';

// Import category components from SlotComponents
import {
  CategoryHeaderSlot,
  ProductGridSlot,
  CategoryFiltersSlot,
  CategorySortingSlot,
  CategoryBreadcrumbsSlot,
  CategoryPaginationSlot
} from '../SlotComponents';

// Category Page Configuration
export const categoryConfig = {
  title: 'Category Layout Editor',
  defaultView: 'grid',
  views: [
    { id: 'grid', label: 'Grid View', icon: Grid },
    { id: 'list', label: 'List View', icon: FileText }
  ],
  defaultSlots: ['header', 'breadcrumbs', 'filters', 'sorting', 'products', 'pagination'],
  slots: {
    header: {
      name: 'Category Header',
      views: ['grid', 'list'],
      defaultContent: '<h1>Category Name</h1>',
      component: CategoryHeaderSlot
    },
    breadcrumbs: {
      name: 'Breadcrumbs',
      views: ['grid', 'list'],
      defaultContent: '<nav>Home > Category</nav>',
      component: CategoryBreadcrumbsSlot
    },
    banner: {
      name: 'Category Banner',
      views: ['grid', 'list'],
      defaultContent: '',
      component: null
    },
    filters: {
      name: 'Product Filters',
      views: ['grid', 'list'],
      defaultContent: '',
      component: CategoryFiltersSlot
    },
    sorting: {
      name: 'Sort Options',
      views: ['grid', 'list'],
      defaultContent: '',
      component: CategorySortingSlot
    },
    products: {
      name: 'Product Grid/List',
      views: ['grid', 'list'],
      defaultContent: '',
      component: ProductGridSlot,
      getData: (data) => data.products || []
    },
    pagination: {
      name: 'Pagination',
      views: ['grid', 'list'],
      defaultContent: '',
      component: CategoryPaginationSlot
    },
    seoContent: {
      name: 'SEO Content',
      views: ['grid', 'list'],
      defaultContent: '<div class="seo-content">Category description...</div>',
      component: null
    }
  },
  cmsBlocks: [
    'category_header',
    'category_above_products',
    'category_below_products',
    'category_sidebar',
    'category_footer'
  ]
};

export default categoryConfig;