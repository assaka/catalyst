/**
 * CheckoutSlotsEditor - Checkout page slot editor
 * - Uses UnifiedSlotsEditor
 * - Supports checkout customization
 * - Maintainable structure
 */

import { ShoppingBag, CreditCard } from "lucide-react";
import UnifiedSlotsEditor from "@/components/editor/UnifiedSlotsEditor";
import { checkoutConfig } from '@/components/editor/slot/configs/checkout-config';

// Generate checkout context based on view mode
const generateCheckoutContext = (viewMode) => ({
  cartItems: [
    {
      id: 1,
      product: { name: 'Sample Product', image_url: '/sample-product.jpg' },
      quantity: 2,
      price: 29.99
    }
  ],
  subtotal: 59.98,
  tax: 4.80,
  total: 64.78,
  shipping: {
    name: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  },
  payment: {
    method: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  },
  isProcessing: viewMode === 'processing'
});

// Checkout Editor Configuration
const checkoutEditorConfig = {
  pageType: 'checkout',
  pageName: 'Checkout',
  slotType: 'checkout_layout',
  defaultViewMode: 'default',
  viewModes: checkoutConfig.views.map(view => ({
    key: view.id,
    label: view.label,
    icon: view.icon
  })),
  slotComponents: {},
  generateContext: generateCheckoutContext,
  viewModeAdjustments: {},
  cmsBlockPositions: checkoutConfig.cmsBlocks,
  // Include the config data for reference
  slots: checkoutConfig.slots,
  metadata: checkoutConfig.metadata,
  views: checkoutConfig.views,
  cmsBlocks: checkoutConfig.cmsBlocks
};

const CheckoutSlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode = 'default'
}) => {
  return (
    <UnifiedSlotsEditor
      config={checkoutEditorConfig}
      mode={mode}
      onSave={onSave}
      viewMode={viewMode}
    />
  );
};

export default CheckoutSlotsEditor;
