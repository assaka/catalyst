/**
 * CartSlots.jsx - SCHEMA-BASED VERSION
 * Example of how CartSlots could use proper schema validation
 */

import React from 'react';
import { SlotConfigBuilder, SlotValidator } from '@/core/slot-system/SlotSchema.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDisplayPrice } from '@/utils/priceUtils';

// All slot components are defined in CartSlots.jsx
// Import them directly with proper references

// =============================================================================
// 🏗️ SCHEMA-BASED SLOT CONFIGURATION
// =============================================================================

// Create schema-validated slot configuration
const cartSlotsBuilder = new SlotConfigBuilder('Cart')
  
  // Page structure slots
  .addSlot({
    id: 'cart-page-container',
    type: 'container',
    component: SlotCartPageContainer,
    name: 'Page Container',
    description: 'Main cart page wrapper with responsive layout',
    required: true,
    order: 0,
    layout: {
      direction: 'column',
      gap: 6,
      align: 'stretch'
    },
    styling: {
      className: 'bg-gray-50 cart-page min-h-screen'
    },
    metadata: {
      category: 'layout',
      tags: ['container', 'page', 'responsive'],
      documentation: 'Wraps entire cart page with max-width container and padding'
    }
  })
  
  .addSlot({
    id: 'cart-page-header', 
    type: 'component',
    component: SlotCartPageHeader,
    name: 'Page Header',
    description: 'Cart title and main heading',
    required: true,
    order: 1,
    props: {
      title: 'My Cart',
      className: 'text-3xl font-bold text-gray-900 mb-8'
    },
    conditions: {
      showWhen: 'cartItems.length > 0 || showEmptyHeader === true'
    },
    metadata: {
      category: 'content',
      tags: ['header', 'title', 'typography']
    }
  })
  
  .addSlot({
    id: 'cart-grid-layout',
    type: 'layout',
    component: SlotCartGridLayout,
    name: 'Grid Layout',
    description: 'Responsive grid container for cart content',
    required: true,
    order: 2,
    layout: {
      direction: 'row',
      gap: 8
    },
    responsive: {
      mobile: { direction: 'column', gap: 4 },
      tablet: { direction: 'column', gap: 6 },
      desktop: { direction: 'row', gap: 8 }
    },
    styling: {
      className: 'lg:grid lg:grid-cols-3 lg:gap-8'
    },
    metadata: {
      category: 'layout',
      tags: ['grid', 'responsive', 'container']
    }
  })
  
  // Content slots
  .addSlot({
    id: 'cart-items-container',
    type: 'container',
    component: SlotCartItemsContainer,
    name: 'Items Container',
    description: 'Container for all cart items with scrolling',
    required: true,
    order: 3,
    parent: 'cart-grid-layout',
    children: ['cart-item-single'],
    conditions: {
      showWhen: 'cartItems.length > 0',
      requiredData: ['cartItems']
    },
    styling: {
      className: 'lg:col-span-2'
    },
    metadata: {
      category: 'content',
      tags: ['items', 'scrollable', 'list']
    }
  })
  
  .addSlot({
    id: 'cart-item-single',
    type: 'micro-slot',
    component: SlotCartItem,
    name: 'Individual Item',
    description: 'Each product in the cart with quantity controls',
    required: false,
    order: 4,
    parent: 'cart-items-container',
    props: {
      showQuantityControls: true,
      showRemoveButton: true,
      showProductImage: true
    },
    layout: {
      direction: 'row',
      gap: 4,
      align: 'center'
    },
    conditions: {
      requiredData: ['item', 'product', 'currencySymbol', 'store']
    },
    metadata: {
      category: 'content',
      tags: ['product', 'item', 'interactive', 'quantity']
    }
  })
  
  .addSlot({
    id: 'cart-sidebar',
    type: 'container',
    component: SlotCartSidebar,
    name: 'Sidebar Container',
    description: 'Right sidebar for order summary and actions',
    required: true,
    order: 5,
    parent: 'cart-grid-layout',
    children: ['cart-order-summary', 'cart-coupon-section', 'cart-checkout-button'],
    layout: {
      direction: 'column',
      gap: 6
    },
    styling: {
      className: 'lg:col-span-1 space-y-6 mt-8 lg:mt-0'
    },
    metadata: {
      category: 'layout',
      tags: ['sidebar', 'summary', 'actions']
    }
  })
  
  .addSlot({
    id: 'cart-coupon-section',
    type: 'component',
    component: SlotCouponSection,
    name: 'Coupon Code',
    description: 'Discount code input and applied coupon display',
    required: false,
    order: 6,
    parent: 'cart-sidebar',
    props: {
      placeholder: 'Enter coupon code',
      buttonText: 'Apply'
    },
    conditions: {
      showWhen: 'settings.couponsEnabled === true'
    },
    metadata: {
      category: 'commerce',
      tags: ['coupon', 'discount', 'form', 'interactive']
    }
  })
  
  .addSlot({
    id: 'cart-order-summary',
    type: 'component',
    component: SlotOrderSummary,
    name: 'Order Summary',
    description: 'Subtotal, tax, discount, and total calculation',
    required: true,
    order: 7,
    parent: 'cart-sidebar',
    conditions: {
      requiredData: ['subtotal', 'tax', 'total', 'currencySymbol']
    },
    metadata: {
      category: 'commerce',
      tags: ['summary', 'calculation', 'pricing', 'totals']
    }
  })
  
  .addSlot({
    id: 'cart-checkout-button',
    type: 'action',
    component: SlotCheckoutButton,
    name: 'Checkout Button',
    description: 'Primary checkout action button',
    required: true,
    order: 8,
    parent: 'cart-sidebar',
    props: {
      text: 'Proceed to Checkout',
      size: 'lg',
      className: 'w-full'
    },
    conditions: {
      showWhen: 'cartItems.length > 0 && total > 0'
    },
    styling: {
      className: 'w-full'
    },
    metadata: {
      category: 'commerce',
      tags: ['checkout', 'action', 'button', 'primary']
    }
  })
  
  .addSlot({
    id: 'cart-empty-display',
    type: 'component',
    component: SlotEmptyCartDisplay,
    name: 'Empty Cart Message',
    description: 'Shown when cart has no items',
    required: false,
    order: 9,
    conditions: {
      showWhen: 'cartItems.length === 0'
    },
    props: {
      title: 'Your cart is empty',
      message: 'Looks like you haven\'t added anything to your cart yet.',
      buttonText: 'Continue Shopping'
    },
    metadata: {
      category: 'content',
      tags: ['empty-state', 'message', 'call-to-action']
    }
  })

  // Define layout presets
  .addLayoutPreset('default', {
    name: 'Default Layout',
    description: 'Standard cart layout with sidebar',
    slotOrder: [
      'cart-page-header',
      'cart-grid-layout', 
      'cart-items-container',
      'cart-sidebar',
      'cart-order-summary',
      'cart-coupon-section', 
      'cart-checkout-button'
    ]
  })
  
  .addLayoutPreset('compact', {
    name: 'Compact Layout',
    description: 'Single column layout for mobile',
    slotOrder: [
      'cart-page-header',
      'cart-items-container',
      'cart-order-summary', 
      'cart-checkout-button'
    ]
  })
  
  .addLayoutPreset('checkout-first', {
    name: 'Checkout First',
    description: 'Emphasizes checkout button at top',
    slotOrder: [
      'cart-page-header',
      'cart-checkout-button',
      'cart-items-container',
      'cart-order-summary',
      'cart-coupon-section'
    ]
  });

// Build and validate the configuration
export const CART_SLOT_CONFIG = cartSlotsBuilder.build();

// Validation
const validation = SlotValidator.validatePageConfig(CART_SLOT_CONFIG);
if (!validation.valid) {
  console.error('❌ Cart slot configuration validation failed:', validation.errors);
} else {
  console.log('✅ Cart slot configuration is valid');
}

// Export for use in GenericSlotEditor
export const CART_SLOT_DEFINITIONS = CART_SLOT_CONFIG.slotDefinitions;
export const CART_SLOT_ORDER = CART_SLOT_CONFIG.slotOrder;
export const CART_LAYOUT_PRESETS = CART_SLOT_CONFIG.layoutPresets;

// Schema-aware slot editor integration
export function createSchemaSlotEditor(config) {
  return {
    validate: () => SlotValidator.validatePageConfig(config),
    getSlotById: (id) => config.slotDefinitions[id],
    getSlotsByType: (type) => Object.values(config.slotDefinitions).filter(slot => slot.type === type),
    getSlotsByCategory: (category) => Object.values(config.slotDefinitions).filter(slot => 
      slot.metadata?.category === category
    ),
    updateSlotOrder: (newOrder) => {
      const orderValidation = SlotValidator.validateSlotOrder(newOrder, config.slotDefinitions);
      if (!orderValidation.valid) {
        throw new Error(`Invalid slot order: ${orderValidation.errors.join(', ')}`);
      }
      config.slotOrder = newOrder;
      return config;
    },
    addSlot: (definition) => {
      const validation = SlotValidator.validateSlotDefinition(definition);
      if (!validation.valid) {
        throw new Error(`Invalid slot: ${validation.errors.join(', ')}`);
      }
      config.slotDefinitions[definition.id] = validation.data;
      return config;
    }
  };
}

export default CART_SLOT_CONFIG;