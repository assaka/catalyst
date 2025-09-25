/**
 * CartSlotsEditor - Refactored to use UnifiedSlotsEditor
 * - Consistent with other slot editors
 * - AI enhancement ready
 * - Maintainable structure
 */

import { ShoppingCart, Package } from "lucide-react";
import UnifiedSlotsEditor from "@/components/editor/UnifiedSlotsEditor";
import aiEnhancementService from '@/services/aiEnhancementService';
import {
  CartHeaderSlot,
  CartItemsSlot,
  CartSummarySlot,
  CartCouponSlot,
  CartEmptyStateSlot
} from '@/components/editor/slot/slotComponentsCart';

// Generate cart context based on view mode
const generateCartContext = (viewMode) => ({
  cartItems: viewMode === 'withProducts' ? [
    {
      id: 1,
      product_id: 1,
      quantity: 2,
      price: 29.99,
      product: { id: 1, name: 'Sample Product 1', image_url: '/sample-product.jpg' },
      selected_options: []
    },
    {
      id: 2,
      product_id: 2,
      quantity: 1,
      price: 49.99,
      product: { id: 2, name: 'Sample Product 2', image_url: '/sample-product2.jpg' },
      selected_options: [{ name: 'Size', value: 'Large', price: 5.00 }]
    }
  ] : [],
  subtotal: 109.97,
  discount: 10.00,
  tax: 8.00,
  total: 107.97,
  currencySymbol: '$',
  appliedCoupon: null,
  couponCode: '',
  setCouponCode: () => {},
  handleApplyCoupon: () => {},
  handleRemoveCoupon: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  handleCheckout: () => {},
  calculateItemTotal: (item) => item.price * item.quantity,
  safeToFixed: (value) => value.toFixed(2)
});

// Cart Editor Configuration
const cartEditorConfig = {
  pageType: 'cart',
  pageName: 'Cart',
  slotType: 'cart_layout',
  defaultViewMode: 'emptyCart',
  viewModes: [
    {
      key: 'emptyCart',
      label: 'Empty Cart',
      icon: ShoppingCart
    },
    {
      key: 'withProducts',
      label: 'With Products',
      icon: Package
    }
  ],
  slotComponents: {
    CartHeaderSlot,
    CartItemsSlot,
    CartSummarySlot,
    CartCouponSlot,
    CartEmptyStateSlot
  },
  generateContext: generateCartContext,
  viewModeAdjustments: {
    content_area: {
      colSpan: {
        shouldAdjust: (currentValue) => typeof currentValue === 'number',
        newValue: {
          emptyCart: 12,
          withProducts: 'col-span-12 sm:col-span-12 lg:col-span-8'
        }
      }
    }
  },
  customSlotRenderer: (slot, context) => {
    const componentMap = {
      'header_title': CartHeaderSlot,
      'empty_cart_container': CartEmptyStateSlot,
      'cart_items_container': CartItemsSlot,
      'coupon_container': CartCouponSlot,
      'order_summary_container': CartSummarySlot
    };
    const SlotComponent = componentMap[slot.id];
    if (SlotComponent) {
      return (
        <SlotComponent
          cartContext={context}
          content={slot.content}
          config={{ viewMode: context?.viewMode }}
        />
      );
    }
    return null;
  },
  cmsBlockPositions: ['cart_above_items', 'cart_below_items']
};

// AI Enhancement Configuration for Cart
const cartAiConfig = {
  enabled: true,
  onScreenshotAnalysis: async (file, layoutConfig, context) => {
    try {
      return await aiEnhancementService.analyzeScreenshot(file, layoutConfig, 'cart', context);
    } catch (error) {
      console.error('AI analysis failed, using fallback:', error);
      return {
        summary: "AI analysis temporarily unavailable. Using fallback analysis for shopping cart layout.",
        suggestions: [
          "Update cart item layout to match reference design",
          "Adjust order summary positioning and styling",
          "Modify checkout button styling and placement",
          "Enhance empty cart state design"
        ],
        confidence: 0.6
      };
    }
  },
  onStyleGeneration: async (analysis, layoutConfig) => {
    try {
      return await aiEnhancementService.generateStyles(analysis, layoutConfig, 'cart');
    } catch (error) {
      console.error('AI style generation failed, using fallback:', error);
      const updatedSlots = { ...layoutConfig.slots };

      // Apply basic style improvements
      if (updatedSlots.cart_items_container) {
        updatedSlots.cart_items_container.className = "bg-white rounded-lg shadow-sm border p-4 space-y-4";
      }

      if (updatedSlots.order_summary_container) {
        updatedSlots.order_summary_container.className = "bg-gray-50 rounded-lg p-6";
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

const CartSlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode = 'emptyCart'
}) => {
  return (
    <UnifiedSlotsEditor
      config={cartEditorConfig}
      aiConfig={cartAiConfig}
      mode={mode}
      onSave={onSave}
      viewMode={viewMode}
    />
  );
};

export default CartSlotsEditor;
