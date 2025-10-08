/**
 * SuccessSlotsEditor - Order success/confirmation page slot editor
 * - Uses UnifiedSlotsEditor
 * - Supports success page customization
 * - Maintainable structure
 */

import { CheckCircle, Package } from "lucide-react";
import UnifiedSlotsEditor from "@/components/editor/UnifiedSlotsEditor";
import { successConfig } from '@/components/editor/slot/configs/success-config';

// Generate success page context based on view mode
const generateSuccessContext = (viewMode) => ({
  order: viewMode === 'withOrder' ? {
    id: '12345',
    date: new Date().toLocaleDateString(),
    items: [
      {
        id: 1,
        name: 'Sample Product 1',
        image_url: '/sample-product.jpg',
        quantity: 2,
        price: 29.99
      },
      {
        id: 2,
        name: 'Sample Product 2',
        image_url: '/sample-product2.jpg',
        quantity: 1,
        price: 49.99
      }
    ],
    subtotal: 109.97,
    shipping: 10.00,
    tax: 8.00,
    total: 127.97,
    status: 'confirmed'
  } : null,
  shipping: {
    name: 'John Doe',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'United States',
    method: 'Standard Shipping (5-7 business days)'
  },
  payment: {
    method: 'Credit Card',
    last4: '4242',
    status: 'Paid'
  },
  tracking: {
    number: null,
    carrier: null,
    url: null
  }
});

// Success Editor Configuration
const successEditorConfig = {
  pageType: 'success',
  pageName: 'Order Success',
  slotType: 'success_layout',
  defaultViewMode: 'empty',
  viewModes: successConfig.views.map(view => ({
    key: view.id,
    label: view.label,
    icon: view.icon
  })),
  slotComponents: {},
  generateContext: generateSuccessContext,
  viewModeAdjustments: {},
  cmsBlockPositions: successConfig.cmsBlocks,
  // Include the config data for reference
  slots: successConfig.slots,
  metadata: successConfig.metadata,
  views: successConfig.views,
  cmsBlocks: successConfig.cmsBlocks
};

const SuccessSlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode = 'empty'
}) => {
  return (
    <UnifiedSlotsEditor
      config={successEditorConfig}
      mode={mode}
      onSave={onSave}
      viewMode={viewMode}
    />
  );
};

export default SuccessSlotsEditor;
