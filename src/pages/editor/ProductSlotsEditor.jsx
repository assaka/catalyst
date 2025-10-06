/**
 * ProductSlotsEditor - Refactored to use UnifiedSlotsEditor
 * - Consistent with other slot editors
 * - AI enhancement ready
 * - Maintainable structure
 */

import { Package } from "lucide-react";
import UnifiedSlotsEditor from "@/components/editor/UnifiedSlotsEditor";
import { generateMockProductContext } from '@/utils/mockProductData';
import aiEnhancementService from '@/services/aiEnhancementService';
// Unified components are now handled by UnifiedSlotRenderer automatically

// Create default slots function for product layout
const createDefaultSlots = async () => {
  try {
    console.log('🔧 LOADING PRODUCT CONFIG FROM createDefaultSlots...');
    const configModule = await import('@/components/editor/slot/configs/product-config');

    const productConfig = configModule.productConfig || configModule.default;

    if (!productConfig || !productConfig.slots) {
      console.error('❌ Invalid product config - no slots found');
      return null;
    }

    console.log('✅ Successfully loaded product config with slots:', Object.keys(productConfig.slots));
    return productConfig.slots;
  } catch (error) {
    console.error('❌ Failed to load product config:', error);
    return null;
  }
};

// Product Editor Configuration
const productEditorConfig = {
  pageType: 'product',
  pageName: 'Product Detail',
  slotType: 'product_layout',
  defaultViewMode: 'default',
  viewModes: [
    {
      key: 'default',
      label: 'Default View',
      icon: Package
    }
  ],
  // slotComponents are now handled by UnifiedSlotRenderer's component registry
  generateContext: (viewMode, selectedStore) => {
    // Pass real store settings to mock context generator
    const storeSettings = selectedStore?.settings || null;
    return generateMockProductContext(storeSettings);
  },
  createDefaultSlots,
  cmsBlockPositions: ['product_above', 'product_below']
};

// AI Enhancement Configuration
const productAiConfig = {
  enabled: true,
  onScreenshotAnalysis: async (file, layoutConfig, context) => {
    try {
      return await aiEnhancementService.analyzeScreenshot(file, layoutConfig, 'product', context);
    } catch (error) {
      console.error('AI analysis failed, using fallback:', error);
      // Fallback response if AI service fails
      return {
        summary: "AI analysis temporarily unavailable. Using fallback analysis for product page layout.",
        suggestions: [
          "Update product gallery layout to match reference design",
          "Adjust product information positioning and typography",
          "Modify add-to-cart button styling and placement"
        ],
        confidence: 0.6
      };
    }
  },
  onStyleGeneration: async (analysis, layoutConfig) => {
    try {
      return await aiEnhancementService.generateStyles(analysis, layoutConfig, 'product');
    } catch (error) {
      console.error('AI style generation failed, using fallback:', error);
      // Fallback style generation
      const updatedSlots = { ...layoutConfig.slots };

      // Apply basic style improvements
      if (updatedSlots.product_gallery) {
        updatedSlots.product_gallery.className = "rounded-lg shadow-lg bg-white p-4";
      }

      if (updatedSlots.product_info) {
        updatedSlots.product_info.className = "space-y-4 p-6";
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

const ProductSlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode = 'default'
}) => {
  return (
    <UnifiedSlotsEditor
      config={productEditorConfig}
      aiConfig={productAiConfig}
      mode={mode}
      onSave={onSave}
      viewMode={viewMode}
    />
  );
};

export default ProductSlotsEditor;