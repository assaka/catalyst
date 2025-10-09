/**
 * CartSlotsEditor - Refactored to use UnifiedSlotsEditor
 * - Consistent with other slot editors
 * - AI enhancement ready
 * - Maintainable structure
 */

import { ShoppingCart, Package } from "lucide-react";
import UnifiedSlotsEditor from "@/components/editor/UnifiedSlotsEditor";
import { cartConfig } from '@/components/editor/slot/configs/cart-config';
import { getSlotComponent } from '@/components/editor/slot/SlotComponentRegistry';

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
  currencySymbol: '🔴20',
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
  ...cartConfig,
  pageType: 'cart',
  pageName: 'Cart',
  slotType: 'cart_layout',
  defaultViewMode: 'emptyCart',
  viewModes: cartConfig.views.map(view => ({
    key: view.id,
    label: view.label,
    icon: view.icon
  })),
  slotComponents: {},
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
  cmsBlockPositions: cartConfig.cmsBlocks
};

const CartSlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode = 'emptyCart'
}) => {
  return (
    <UnifiedSlotsEditor
      config={cartEditorConfig}
      mode={mode}
      onSave={onSave}
      viewMode={viewMode}
    />
  );
};

export default CartSlotsEditor;
