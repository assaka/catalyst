/**
 * CategorySlotsEditor - Refactored to use UnifiedSlotsEditor
 * - Consistent with other slot editors
 * - AI enhancement ready
 * - Maintainable structure
 */

import { useCallback } from "react";
import { Grid, List } from "lucide-react";
import UnifiedSlotsEditor from "@/components/editor/UnifiedSlotsEditor";
import { generateMockCategoryContext } from '@/utils/mockCategoryData';
import aiEnhancementService from '@/services/aiEnhancementService';
import { useStore } from '@/components/storefront/StoreProvider';
import {
  CategoryHeaderSlot,
  CategoryBreadcrumbsSlot,
  CategoryActiveFiltersSlot,
  CategoryFiltersSlot,
  CategoryProductsSlot,
  CategorySortingSlot,
  CategoryPaginationSlot,
  CategoryLayeredNavigationSlot,
  CategoryProductItemCardSlot,
  CategoryProductItemsSlot
} from '@/components/editor/slot/slotComponentsCategory';
import ProductItemCard from '@/components/storefront/ProductItemCard';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
// Create default slots function for category layout
const createDefaultSlots = async () => {
  try {
    const configModule = await import('@/components/editor/slot/configs/category-config');

    const categoryConfig = configModule.categoryConfig || configModule.default;

    if (!categoryConfig || !categoryConfig.slots) {
      console.error('❌ Invalid category config - no slots found');
      return null;
    }


    const defaultConfig = {
      page_name: 'Category',
      slot_type: 'category_layout',
      slots: categoryConfig.slots,
      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '1.0',
        pageType: 'category'
      },
      cmsBlocks: categoryConfig.cmsBlocks || []
    };

    return defaultConfig;
  } catch (error) {
    console.error('❌ Failed to load category config:', error);
    return null;
  }
};

// Helper function to generate grid classes from store settings
const getGridClasses = (storeSettings) => {
  const gridConfig = storeSettings?.product_grid;

  if (!gridConfig) {
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
  }

  const breakpoints = gridConfig.breakpoints || {};
  const customBreakpoints = gridConfig.customBreakpoints || [];
  let classes = [];

  // Standard breakpoints
  Object.entries(breakpoints).forEach(([breakpoint, columns]) => {
    if (columns > 0) {
      if (breakpoint === 'default') {
        if (columns === 1) classes.push('grid-cols-1');
        else if (columns === 2) classes.push('grid-cols-2');
      } else {
        if (columns === 1) classes.push(`${breakpoint}:grid-cols-1`);
        else if (columns === 2) classes.push(`${breakpoint}:grid-cols-2`);
        else if (columns === 3) classes.push(`${breakpoint}:grid-cols-3`);
        else if (columns === 4) classes.push(`${breakpoint}:grid-cols-4`);
        else if (columns === 5) classes.push(`${breakpoint}:grid-cols-5`);
        else if (columns === 6) classes.push(`${breakpoint}:grid-cols-6`);
      }
    }
  });

  // Custom breakpoints
  customBreakpoints.forEach(({ name, columns }) => {
    if (name && columns > 0) {
      if (columns === 1) classes.push(`${name}:grid-cols-1`);
      else if (columns === 2) classes.push(`${name}:grid-cols-2`);
      else if (columns === 3) classes.push(`${name}:grid-cols-3`);
      else if (columns === 4) classes.push(`${name}:grid-cols-4`);
      else if (columns === 5) classes.push(`${name}:grid-cols-5`);
      else if (columns === 6) classes.push(`${name}:grid-cols-6`);
    }
  });

  return classes.length > 0 ? classes.join(' ') : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
};

// Custom slot renderer for category-specific components
const categoryCustomSlotRenderer = (slot, context) => {
  const sampleCategoryContext = context || generateMockCategoryContext();
  const storeSettings = context?.storeSettings || {};

  console.log(`🎯 CUSTOM SLOT RENDERER CALLED FOR: ${slot.id} (parentId: ${slot.parentId})`);

  // Handle component slots (new pattern)
  if (slot.type === 'component') {
    const componentName = slot.component;

    if (componentName === 'BreadcrumbRenderer') {
      return (
        <div className={slot.className} style={slot.styles}>
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Home</span>
            <span>/</span>
            <span>Category</span>
            <span>/</span>
            <span className="font-medium text-gray-900">Current Page</span>
          </nav>
        </div>
      );
    }

    if (componentName === 'ActiveFilters') {
      return (
        <div className={slot.className} style={slot.styles}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Brand: Apple ×
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              Price: $100-$500 ×
            </span>
          </div>
        </div>
      );
    }

    if (componentName === 'LayeredNavigation') {
      return (
        <div className={slot.className} style={slot.styles}>
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Filter By</h3>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Price</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">Under $25</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">$25 - $50</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (componentName === 'SortSelector') {
      return (
        <div className={slot.className} style={slot.styles}>
          <select className="border border-gray-300 rounded px-3 py-1 text-sm bg-white">
            <option>Sort by: Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Name: A to Z</option>
          </select>
        </div>
      );
    }

    if (componentName === 'PaginationComponent') {
      return (
        <div className={slot.className} style={slot.styles}>
          <div className="flex items-center justify-center space-x-2">
            <button className="px-3 py-1 border rounded">Previous</button>
            <span className="px-3 py-1">1 of 10</span>
            <button className="px-3 py-1 border rounded">Next</button>
          </div>
        </div>
      );
    }

    // CmsBlockRenderer is handled by UnifiedSlotRenderer, but add fallback
    if (componentName === 'CmsBlockRenderer') {
      const position = slot.metadata?.cmsPosition || slot.id || 'default';
      return (
        <div className={slot.className} style={slot.styles}>
          <CmsBlockRenderer position={position} />
        </div>
      );
    }
  }

  // Handle CMS block slots (legacy pattern)
  if (slot.type === 'cms_block') {
    const position = slot.metadata?.cmsPosition || slot.id || 'default';
    return (
      <div className={slot.className} style={slot.styles}>
        <CmsBlockRenderer position={position} />
      </div>
    );
  }

  // Handle generic slot types as fallbacks
  if (slot.type === 'text') {
    return (
      <div className={slot.className} style={slot.styles}>
        <span dangerouslySetInnerHTML={{ __html: slot.content || 'Text content' }} />
      </div>
    );
  }

  if (slot.type === 'select') {
    return (
      <div className={slot.className} style={slot.styles}>
        <select className="border border-gray-300 rounded px-3 py-1 text-sm bg-white">
          <option>Sort option 1</option>
          <option>Sort option 2</option>
        </select>
      </div>
    );
  }

  if (slot.type === 'pagination') {
    return (
      <div className={slot.className} style={slot.styles}>
        <div className="flex items-center justify-center space-x-2">
          <button className="px-3 py-1 border rounded">Previous</button>
          <span className="px-3 py-1">1 of 10</span>
          <button className="px-3 py-1 border rounded">Next</button>
        </div>
      </div>
    );
  }

  if (slot.type === 'breadcrumbs') {
    return (
      <div className={slot.className} style={slot.styles}>
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Home</span>
          <span>/</span>
          <span>Category</span>
          <span>/</span>
          <span className="font-medium text-gray-900">Current Page</span>
        </nav>
      </div>
    );
  }

  if (slot.type === 'active_filters') {
    return (
      <div className={slot.className} style={slot.styles}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Active Filters:</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            Brand: Apple ×
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            Price: $100-$500 ×
          </span>
        </div>
      </div>
    );
  }

  if (slot.type === 'layered_navigation') {
    return (
      <div className={slot.className} style={slot.styles}>
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Filter By</h3>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Price</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">Under $25</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">$25 - $50</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // IMMEDIATELY check for product_items
  if (slot.id === 'product_items') {
    console.log('🚨 PRODUCT_ITEMS REACHED CUSTOM SLOT RENDERER!');
    console.log('🚨 This should trigger our handler');
  }

  // Handle products_container explicitly
  if (slot.id === 'products_container') {
    console.log('📦 PRODUCTS_CONTAINER EXPLICIT HANDLER RUNNING!');
    console.log('📦 WILL RENDER CHILDREN RECURSIVELY');

    // Find the product_items child slot and render it explicitly
    const productItemsSlot = Object.values(context?.layoutConfig?.slots || {}).find(s => s.id === 'product_items');

    if (productItemsSlot) {
      console.log('📦 FOUND product_items slot, rendering explicitly');

      // Get microslot configurations from category config
      const microslotConfigs = {
        productAddToCart: context?.layoutConfig?.slots?.product_add_to_cart || {
          className: 'bg-blue-600 text-white border-0 hover:bg-blue-700 transition-colors duration-200 px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2',
          content: 'Add to Cart'
        },
        productImage: context?.layoutConfig?.slots?.product_image || {},
        productName: context?.layoutConfig?.slots?.product_name || {},
        productPrice: context?.layoutConfig?.slots?.product_price || {},
        productComparePrice: context?.layoutConfig?.slots?.product_compare_price || {}
      };

      // Merge slot content with metadata and microslot configs
      const contentWithConfig = {
        ...productItemsSlot.content,
        ...productItemsSlot.metadata,
        ...microslotConfigs,
        itemsToShow: productItemsSlot.metadata?.itemsToShow || 3,
        gridConfig: productItemsSlot.metadata?.gridConfig || { mobile: 1, tablet: 2, desktop: 3 }
      };

      return (
        <div className="products-container-wrapper">
          <CategoryProductItemCardSlot
            categoryContext={sampleCategoryContext}
            content={contentWithConfig}
            config={{ viewMode: context?.viewMode }}
          />
        </div>
      );
    }
    return null;
  }

  // Handle product_items container - load products based on grid config
  if (slot.id === 'product_items') {
    console.log('🛍️ PRODUCT_ITEMS: Loading products with dynamic grid');

    // Calculate how many products to show based on grid config
    const gridConfig = storeSettings?.product_grid;
    const maxColumns = gridConfig?.breakpoints ? Math.max(...Object.values(gridConfig.breakpoints).filter(v => v > 0)) : 3;
    const rows = gridConfig?.rows || 2;
    const productsToShow = maxColumns * rows;

    // Load products based on calculated amount
    const products = sampleCategoryContext?.products?.slice(0, productsToShow) || [];
    console.log('🛍️ Rendering products:', products.length, 'Grid classes:', getGridClasses(storeSettings));

    return (
      <div className={`grid ${getGridClasses(storeSettings)} gap-4`}>
        {products.map((product, index) => (
          <ProductItemCard
            key={product.id}
            product={product}
            settings={{
              currency_symbol: '$',
              theme: { add_to_cart_button_color: '#3B82F6' }
            }}
            store={{ slug: 'demo-store', id: 1 }}
            taxes={[]}
            selectedCountry="US"
            productLabels={sampleCategoryContext?.productLabels || []}
            viewMode={context?.viewMode}
            slotConfig={slot}
            onAddToCartStateChange={() => {}}
          />
        ))}
      </div>
    );
  }

  // Handle individual product_item_card if needed (fallback for individual card rendering)
  if (slot.id === 'product_item_card') {
    console.log('🎴 PRODUCT_ITEM_CARD HANDLER RUNNING!');

    // For individual card rendering, just render a single sample card
    const sampleProduct = sampleCategoryContext?.products?.[0];
    if (!sampleProduct) return null;

    return (
      <ProductItemCard
        key={sampleProduct.id}
        product={sampleProduct}
        settings={{
          currency_symbol: '$',
          theme: { add_to_cart_button_color: '#3B82F6' }
        }}
        store={{ slug: 'demo-store', id: 1 }}
        taxes={[]}
        selectedCountry="US"
        productLabels={sampleCategoryContext?.productLabels || []}
        viewMode={context?.viewMode}
        slotConfig={slot}
        onAddToCartStateChange={() => {}}
      />
    );
  }

  // Handle breadcrumbs content specifically
  if (slot.id === 'breadcrumbs_content') {
    return (
      <CategoryBreadcrumbsSlot
        categoryData={sampleCategoryContext}
        categoryContext={sampleCategoryContext}
        content={slot.content}
        className={slot.className}
        styles={slot.styles}
        config={{ viewMode: context?.viewMode }}
      />
    );
  }

  const componentMap = {
    // Breadcrumbs and headers
    'breadcrumbs_content': CategoryBreadcrumbsSlot,
    'category_title': CategoryHeaderSlot,
    'category_header': CategoryHeaderSlot,
    'category_description': CategoryHeaderSlot,

    // Filters and navigation
    'filters_container': CategoryFiltersSlot,
    'layered_navigation': CategoryLayeredNavigationSlot,
    'active_filters': CategoryActiveFiltersSlot,

    // Products
    'products_container': CategoryProductsSlot,
    'products_grid': CategoryProductsSlot,
    'product_items': CategoryProductItemsSlot,
    'product_item_card': CategoryProductItemCardSlot,
    'product_template': CategoryProductItemCardSlot,

    // Sorting and controls
    'sorting_controls': CategorySortingSlot,
    'product_count_info': CategorySortingSlot,
    'sort_selector': CategorySortingSlot,

    // Pagination
    'pagination_controls': CategoryPaginationSlot,
    'pagination_container': CategoryPaginationSlot
  };

  const SlotComponent = componentMap[slot.id];

  if (SlotComponent) {
    return (
      <SlotComponent
        categoryData={sampleCategoryContext}
        categoryContext={sampleCategoryContext}
        content={slot.content}
        className={slot.className}
        styles={slot.styles}
        config={{ viewMode: context?.viewMode }}
        allSlots={context?.layoutConfig?.slots}
        mode={context?.mode}
        onElementClick={context?.onElementClick}
      />
    );
  }

  return null;
};

// Category Editor Configuration
const categoryEditorConfig = {
  pageType: 'category',
  pageName: 'Category',
  slotType: 'category_layout',
  defaultViewMode: 'grid',
  viewModes: [
    {
      key: 'grid',
      label: 'Grid View',
      icon: Grid
    },
    {
      key: 'list',
      label: 'List View',
      icon: List
    }
  ],
  slotComponents: {
    CategoryHeaderSlot,
    CategoryBreadcrumbsSlot,
    CategoryActiveFiltersSlot,
    CategoryFiltersSlot,
    CategoryProductsSlot,
    CategorySortingSlot,
    CategoryPaginationSlot,
    CategoryLayeredNavigationSlot,
    CategoryProductItemCardSlot,
    CategoryProductItemsSlot
  },
  generateContext: generateMockCategoryContext,
  createDefaultSlots,
  viewModeAdjustments: {
    filters_container: {
      colSpan: {
        shouldAdjust: (currentValue) => typeof currentValue === 'number',
        newValue: {
          grid: 'col-span-12 lg:col-span-3',
          list: 'col-span-12 lg:col-span-3'
        }
      }
    },
    products_container: {
      colSpan: {
        shouldAdjust: (currentValue) => typeof currentValue === 'number',
        newValue: {
          grid: 'col-span-12 lg:col-span-9',
          list: 'col-span-12 lg:col-span-9'
        }
      }
    }
  },
  customSlotRenderer: categoryCustomSlotRenderer,
  cmsBlockPositions: ['category_above_products', 'category_below_products']
};

// AI Enhancement Configuration for Category
const categoryAiConfig = {
  enabled: true,
  onScreenshotAnalysis: async (file, layoutConfig, context) => {
    try {
      return await aiEnhancementService.analyzeScreenshot(file, layoutConfig, 'category', context);
    } catch (error) {
      console.error('AI analysis failed, using fallback:', error);
      return {
        summary: "AI analysis temporarily unavailable. Using fallback analysis for category page layout.",
        suggestions: [
          "Update product grid layout to match reference design",
          "Adjust filter sidebar positioning and styling",
          "Modify product card design and spacing",
          "Enhance category header and breadcrumb styling",
          "Update pagination and sorting controls"
        ],
        confidence: 0.6
      };
    }
  },
  onStyleGeneration: async (analysis, layoutConfig) => {
    try {
      return await aiEnhancementService.generateStyles(analysis, layoutConfig, 'category');
    } catch (error) {
      console.error('AI style generation failed, using fallback:', error);
      const updatedSlots = { ...layoutConfig.slots };

      // Apply basic style improvements
      if (updatedSlots.products_container) {
        updatedSlots.products_container.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";
      }

      if (updatedSlots.filters_container) {
        updatedSlots.filters_container.className = "bg-white rounded-lg shadow-sm p-6 sticky top-4";
      }

      if (updatedSlots.category_header) {
        updatedSlots.category_header.className = "text-3xl font-bold text-gray-900 mb-6";
      }

      return {
        slots: updatedSlots,
        metadata: {
          aiGenerated: false,
          fallback: true,
          analysisId: Date.now(),
          confidence: analysis.confidence || 0.5
        }
      };
    }
  }
};

const CategorySlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode = 'grid'
}) => {
  // Get store settings for product grid configuration
  // Handle null case when StoreProvider is not available in editor context
  const storeContext = useStore();
  const storeSettings = storeContext?.settings || null;

  // Create enhanced config with store settings
  const enhancedConfig = {
    ...categoryEditorConfig,
    storeSettings
  };

  return (
    <UnifiedSlotsEditor
      config={enhancedConfig}
      aiConfig={categoryAiConfig}
      mode={mode}
      onSave={onSave}
      viewMode={viewMode}
    />
  );
};


export default CategorySlotsEditor;