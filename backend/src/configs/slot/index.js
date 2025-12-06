// Central export for all page configurations
// Backend version - CommonJS format

const { cartConfig } = require('./cart-config');
const { categoryConfig } = require('./category-config');
const { productConfig } = require('./product-config');
const { homepageConfig } = require('./homepage-config');
const { checkoutConfig } = require('./checkout-config');
const { headerConfig } = require('./header-config');
const { accountConfig } = require('./account-config');
const { loginConfig } = require('./login-config');
const { successConfig } = require('./success-config');

const PAGE_CONFIGS = {
  cart: cartConfig,
  category: categoryConfig,
  product: productConfig,
  homepage: homepageConfig,
  checkout: checkoutConfig,
  header: headerConfig,
  account: accountConfig,
  login: loginConfig,
  success: successConfig
};

// Helper function to get page configuration
function getPageConfig(pageType) {
  return PAGE_CONFIGS[pageType] || PAGE_CONFIGS.homepage;
}

// Helper function to get hierarchical slots for a page
function getDefaultSlots(pageType) {
  const config = getPageConfig(pageType);
  return config.slots || {};
}

// Helper function to get CMS block positions for a page
function getCmsBlocks(pageType) {
  const config = getPageConfig(pageType);
  return config.cmsBlocks || [];
}

// Helper function to validate hierarchical slot configuration
function validateSlotConfig(pageType, slotConfig) {
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

// Helper function to get slot type definitions for a page
function getSlotDefinitions(pageType) {
  const config = getPageConfig(pageType);
  return config.slotDefinitions || {};
}

module.exports = {
  PAGE_CONFIGS,
  getPageConfig,
  getDefaultSlots,
  getCmsBlocks,
  validateSlotConfig,
  getSlotDefinitions,
  cartConfig,
  categoryConfig,
  productConfig,
  homepageConfig,
  checkoutConfig,
  headerConfig,
  accountConfig,
  loginConfig,
  successConfig
};
