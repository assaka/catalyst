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

// Helper function to get default slots for a page
export function getDefaultSlots(pageType) {
  const config = getPageConfig(pageType);
  return config.defaultSlots || [];
}

// Helper function to get CMS block positions for a page
export function getCmsBlocks(pageType) {
  const config = getPageConfig(pageType);
  return config.cmsBlocks || [];
}

// Helper function to validate slot configuration
export function validateSlotConfig(pageType, slotConfig) {
  const pageConfig = getPageConfig(pageType);
  const validSlots = Object.keys(pageConfig.slots);
  
  // Filter out invalid slots
  const validatedSlots = slotConfig.majorSlots?.filter(slot => 
    validSlots.includes(slot)
  ) || pageConfig.defaultSlots;
  
  return {
    ...slotConfig,
    majorSlots: validatedSlots
  };
}

// Helper function to get micro-slot definitions for a page
export function getMicroSlotDefinitions(pageType) {
  const config = getPageConfig(pageType);
  return config.microSlotDefinitions || {};
}

// Export individual configs for direct import
export {
  cartConfig,
  categoryConfig,
  productConfig,
  homepageConfig,
  checkoutConfig
};