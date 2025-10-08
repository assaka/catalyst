/**
 * Default slot configurations for all page types
 * Used when creating initial draft configurations
 */

import { categoryConfig } from '@/components/editor/slot/configs/category-config';
import { homepageConfig } from '@/components/editor/slot/configs/homepage-config';
import { productConfig } from '@/components/editor/slot/configs/product-config';
import { checkoutConfig } from '@/components/editor/slot/configs/checkout-config';
import { accountConfig } from '@/components/editor/slot/configs/account-config';
import { loginConfig } from '@/components/editor/slot/configs/login-config';
import { successConfig } from '@/components/editor/slot/configs/success-config';

/**
 * Creates default slots for a given page type
 */
export const createDefaultSlotsForPageType = (pageType) => {
  const configs = {
    category: categoryConfig,
    homepage: homepageConfig,
    product: productConfig,
    checkout: checkoutConfig,
    account: accountConfig,
    login: loginConfig,
    success: successConfig,
    // Cart intentionally has no default slots - users build from scratch
    cart: null
  };

  const config = configs[pageType];
  if (!config || !config.defaultSlots) {
    return {}; // Return empty slots for cart or unknown types
  }

  const defaultSlots = {};

  // Create slots from the config's defaultSlots array
  config.defaultSlots.forEach((slotId, index) => {
    const slotDefinition = config.slots[slotId];
    if (slotDefinition) {
      defaultSlots[slotId] = {
        id: slotId,
        name: slotDefinition.name,
        component: slotDefinition.component || slotId,
        content: slotDefinition.defaultContent || '',
        className: slotDefinition.className || '',
        styles: {},
        position: {
          colStart: 1,
          colSpan: 12,
          rowStart: index + 1,
          rowSpan: 1
        },
        visible: true,
        locked: false
      };
    }
  });

  return defaultSlots;
};

/**
 * Creates a complete default configuration for a given page type
 */
export const createDefaultConfiguration = (pageType, pageName, slotType) => {
  const defaultSlots = createDefaultSlotsForPageType(pageType);

  return {
    page_name: pageName,
    slot_type: slotType,
    slots: defaultSlots,
    metadata: {
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: '1.0',
      pageType: pageType
    },
    cmsBlocks: []
  };
};

/**
 * Check if a configuration has the expected default slots for its page type
 */
export const hasDefaultSlots = (config, pageType) => {
  if (!config || !config.slots) return false;

  const expectedDefaults = createDefaultSlotsForPageType(pageType);
  const expectedSlotIds = Object.keys(expectedDefaults);
  const actualSlotIds = Object.keys(config.slots);

  // For cart, empty is expected
  if (pageType === 'cart') {
    return true; // Cart can have any configuration
  }

  // For other types, check if we have the expected default slots
  return expectedSlotIds.every(slotId => actualSlotIds.includes(slotId));
};

export default {
  createDefaultSlotsForPageType,
  createDefaultConfiguration,
  hasDefaultSlots
};