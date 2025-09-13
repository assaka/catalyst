// Central export for all page configurations
import { cartConfig } from './cart-config';
import { categoryConfig } from './category-config';
import { productConfig } from './product-config';
import { homepageConfig } from './homepage-config';
import { checkoutConfig } from './checkout-config';

export const PAGE_CONFIGS = {
  cart: cartConfig,
  category: categoryConfig,
  product: productConfig,
  homepage: homepageConfig,
  checkout: checkoutConfig
};

// Helper function to get page configuration
export function getPageConfig(pageType) {
  return PAGE_CONFIGS[pageType] || PAGE_CONFIGS.homepage;
}

// Helper function to get hierarchical slots for a page
export function getDefaultSlots(pageType) {
  const config = getPageConfig(pageType);
  return config.slots || {};
}

// Helper function to get CMS block positions for a page
export function getCmsBlocks(pageType) {
  const config = getPageConfig(pageType);
  return config.cmsBlocks || [];
}

// Helper function to validate hierarchical slot configuration
export function validateSlotConfig(pageType, slotConfig) {
  const pageConfig = getPageConfig(pageType);
  const validSlots = Object.keys(pageConfig.slots || {});
  
  // Validate that all slots in config exist in page definition
  const validatedSlots = {};
  Object.keys(slotConfig.slots || {}).forEach(slotId => {
    if (validSlots.includes(slotId)) {
      validatedSlots[slotId] = slotConfig.slots[slotId];
    }
  });
  
  return {
    ...slotConfig,
    slots: validatedSlots
  };
}

// Helper function to get slot type definitions for a page (replaces microSlotDefinitions)
export function getSlotDefinitions(pageType) {
  const config = getPageConfig(pageType);
  return config.slotDefinitions || {};
}

// Export individual configs for direct import
export {
  cartConfig,
  categoryConfig,
  productConfig,
  homepageConfig,
  checkoutConfig
};