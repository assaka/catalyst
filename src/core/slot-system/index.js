/**
 * Slot System - Main entry point
 * Exports all slot system components and initializes default slots
 */

import slotRegistry from './SlotRegistry.js';
import configMerger from './ConfigMerger.js';
import { SlotRenderer, SlotContainer, withSlots } from './SlotRenderer.jsx';
import {
  ProductCardContainer,
  ProductCardImage,
  ProductCardName,
  ProductCardPricing,
  ProductCardAddToCart,
  ProductCardActions,
  ProductCardContent
} from './default-components/ProductCardSlots.jsx';
import {
  CartPageContainer,
  CartPageHeader,
  EmptyCartDisplay,
  CartItemsContainer,
  CartItem,
  CartSidebar,
  CouponSection,
  OrderSummary,
  CheckoutButton,
  CartGridLayout
} from './default-components/CartSlots.jsx';

/**
 * Initialize the slot system with default components
 */
function initializeSlotSystem() {
  console.log('🚀 Initializing Phoenix Slot System...');

  // Register ProductCard slots
  slotRegistry.register('product.card.container', ProductCardContainer, {
    order: 0,
    required: true,
    defaultProps: {}
  });

  slotRegistry.register('product.card.image', ProductCardImage, {
    order: 1,
    required: true,
    defaultProps: {}
  });

  slotRegistry.register('product.card.content', ProductCardContent, {
    order: 2,
    required: true,
    defaultProps: {}
  });

  slotRegistry.register('product.card.name', ProductCardName, {
    order: 3,
    required: true,
    defaultProps: {}
  });

  slotRegistry.register('product.card.actions', ProductCardActions, {
    order: 4,
    required: false,
    defaultProps: {}
  });

  slotRegistry.register('product.card.pricing', ProductCardPricing, {
    order: 5,
    required: true,
    defaultProps: {}
  });

  slotRegistry.register('product.card.add_to_cart', ProductCardAddToCart, {
    order: 6,
    required: false,
    defaultProps: {}
  });

  // Register Cart slots
  slotRegistry.register('cart.page.container', CartPageContainer, {
    order: 0,
    required: true,
    defaultProps: {}
  });

  slotRegistry.register('cart.page.header', CartPageHeader, {
    order: 1,
    required: true,
    defaultProps: {}
  });

  slotRegistry.register('cart.empty.display', EmptyCartDisplay, {
    order: 2,
    required: false,
    defaultProps: {}
  });

  slotRegistry.register('cart.layout.grid', CartGridLayout, {
    order: 3,
    required: true,
    defaultProps: {}
  });

  slotRegistry.register('cart.items.container', CartItemsContainer, {
    order: 4,
    required: true,
    defaultProps: {}
  });

  slotRegistry.register('cart.item.single', CartItem, {
    order: 5,
    required: true,
    defaultProps: {}
  });

  slotRegistry.register('cart.sidebar.container', CartSidebar, {
    order: 6,
    required: true,
    defaultProps: {}
  });

  slotRegistry.register('cart.coupon.section', CouponSection, {
    order: 7,
    required: false,
    defaultProps: {}
  });

  slotRegistry.register('cart.summary.order', OrderSummary, {
    order: 8,
    required: true,
    defaultProps: {}
  });

  slotRegistry.register('cart.checkout.button', CheckoutButton, {
    order: 9,
    required: true,
    defaultProps: {}
  });

  console.log('✅ Phoenix Slot System initialized with ProductCard and Cart components');
}

/**
 * Load user configuration into the slot system
 * @param {Object} userConfig - User slot configuration
 */
function loadUserConfiguration(userConfig) {
  try {
    // Validate configuration
    const validation = configMerger.validateConfig(userConfig);
    
    if (!validation.valid) {
      console.error('❌ Invalid user configuration:', validation.errors);
      return false;
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️ Configuration warnings:', validation.warnings);
    }

    // Apply to slot registry
    slotRegistry.applyUserConfig(userConfig);
    
    console.log('✅ User configuration loaded successfully');
    return true;

  } catch (error) {
    console.error('❌ Error loading user configuration:', error);
    return false;
  }
}

/**
 * Get current slot system state for debugging
 */
function getSlotSystemState() {
  return {
    registry: slotRegistry.exportState(),
    timestamp: new Date().toISOString()
  };
}

// Initialize on import
initializeSlotSystem();

// Export everything
export {
  // Core system
  slotRegistry,
  configMerger,
  SlotRenderer,
  SlotContainer,
  withSlots,
  
  // Default components
  ProductCardContainer,
  ProductCardImage,
  ProductCardName,
  ProductCardPricing,
  ProductCardAddToCart,
  ProductCardActions,
  ProductCardContent,
  
  // Cart components
  CartPageContainer,
  CartPageHeader,
  EmptyCartDisplay,
  CartItemsContainer,
  CartItem,
  CartSidebar,
  CouponSection,
  OrderSummary,
  CheckoutButton,
  CartGridLayout,
  
  // Utilities
  loadUserConfiguration,
  getSlotSystemState
};

// Default export is the SlotRenderer for convenience
export default SlotRenderer;