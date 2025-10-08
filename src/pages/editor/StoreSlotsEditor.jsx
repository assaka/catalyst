/**
 * StoreSlotsEditor - Store/Storefront landing page slot editor
 * - Uses UnifiedSlotsEditor
 * - Supports store customization
 * - Maintainable structure
 */

import { Store, Home } from "lucide-react";
import UnifiedSlotsEditor from "@/components/editor/UnifiedSlotsEditor";

// Store page configuration
const storeConfig = {
  slotLayout: {
    hero_section: { name: 'Hero Section', colSpan: 12, order: 0 },
    featured_products: { name: 'Featured Products', colSpan: 12, order: 1 },
    categories_grid: { name: 'Categories Grid', colSpan: 12, order: 2 },
    promotional_banner: { name: 'Promotional Banner', colSpan: 12, order: 3 },
    content_area: { name: 'Content Area', colSpan: 12, order: 4 },
    footer_widgets: { name: 'Footer Widgets', colSpan: 12, order: 5 }
  },
  views: [
    {
      id: 'default',
      label: 'Default View',
      icon: Store,
      description: 'Standard store landing page'
    },
    {
      id: 'promotional',
      label: 'Promotional View',
      icon: Home,
      description: 'Store with promotional content'
    }
  ],
  cmsBlocks: ['hero_section', 'promotional_banner', 'footer_widgets']
};

// Generate store context based on view mode
const generateStoreContext = (viewMode) => ({
  storeName: 'My Store',
  storeDescription: 'Welcome to our online store',
  featuredProducts: viewMode === 'promotional' ? [
    { id: 1, name: 'Featured Product 1', price: 99.99, image_url: '/featured1.jpg' },
    { id: 2, name: 'Featured Product 2', price: 149.99, image_url: '/featured2.jpg' }
  ] : [],
  categories: [
    { id: 1, name: 'Electronics', slug: 'electronics' },
    { id: 2, name: 'Clothing', slug: 'clothing' },
    { id: 3, name: 'Home & Garden', slug: 'home-garden' }
  ],
  promotions: viewMode === 'promotional' ? [
    { id: 1, title: 'Summer Sale', discount: '30% OFF' }
  ] : []
});

// Store Editor Configuration
const storeEditorConfig = {
  ...storeConfig,
  pageType: 'store',
  pageName: 'Store Landing',
  slotType: 'store_layout',
  defaultViewMode: 'default',
  viewModes: storeConfig.views.map(view => ({
    key: view.id,
    label: view.label,
    icon: view.icon
  })),
  slotComponents: {},
  generateContext: generateStoreContext,
  viewModeAdjustments: {},
  cmsBlockPositions: storeConfig.cmsBlocks
};

const StoreSlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode = 'default'
}) => {
  return (
    <UnifiedSlotsEditor
      config={storeEditorConfig}
      mode={mode}
      onSave={onSave}
      viewMode={viewMode}
    />
  );
};

export default StoreSlotsEditor;
