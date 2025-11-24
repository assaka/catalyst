/**
 * Slot Configuration A/B Testing Service
 * Integrates A/B testing with config slot based pages
 *
 * Usage Examples:
 *
 * 1. Test different hero component props:
 *    variant.config = {
 *      slot_overrides: {
 *        "hero-slot": {
 *          props: {
 *            title: "NEW: 50% Off Everything!",
 *            buttonText: "Shop Now",
 *            backgroundColor: "#ff6b6b"
 *          }
 *        }
 *      }
 *    }
 *
 * 2. Test different component in a slot:
 *    variant.config = {
 *      slot_overrides: {
 *        "promo-slot": {
 *          component: "BannerCarousel",  // Instead of static banner
 *          props: { autoplay: true }
 *        }
 *      }
 *    }
 *
 * 3. Test adding/removing slots:
 *    variant.config = {
 *      slot_overrides: {
 *        "recommended-products": {
 *          enabled: false  // Remove this slot
 *        },
 *        "new-trust-badges": {
 *          enabled: true,
 *          component: "TrustBadges",
 *          position: 2,  // Insert at position 2
 *          props: { badges: ["secure", "shipping", "returns"] }
 *        }
 *      }
 *    }
 *
 * 4. Test entire page layout:
 *    variant.config = {
 *      page_template: "category_v2",  // Use different template
 *      slot_configuration: { ... }     // Complete slot config override
 *    }
 */

const abTestingService = require('./ABTestingService');
const ConnectionManager = require('../database/ConnectionManager');

class SlotConfigABTesting {
  constructor() {
    // Cache for compiled configurations
    this.configCache = new Map();
  }

  /**
   * Get slot configuration with A/B test variants applied
   * @param {string} pageType - Page type (category, product, cart, etc.)
   * @param {object} baseConfig - Base slot configuration
   * @param {string} sessionId - User session ID
   * @param {object} context - Additional context (storeId, userId, etc.)
   * @returns {Promise<object>} Merged configuration with A/B test overrides
   */
  async getConfigWithVariants(pageType, baseConfig, sessionId, context = {}) {
    try {
      // Find active tests for this page type
      const activeTests = await this.getActiveTestsForPage(
        pageType,
        context.storeId
      );

      if (activeTests.length === 0) {
        // No active tests, return base config
        return {
          config: baseConfig,
          activeTests: [],
          appliedVariants: []
        };
      }

      // Get variant assignments for each test
      const variantAssignments = await Promise.all(
        activeTests.map(test =>
          abTestingService.getVariant(test.id, sessionId, {
            userId: context.userId,
            context: {
              device_type: context.deviceType,
              user_agent: context.userAgent,
              ip_address: context.ipAddress
            }
          })
        )
      );

      // Apply variant configurations
      const mergedConfig = this.mergeConfigurations(
        baseConfig,
        variantAssignments,
        activeTests
      );

      return {
        config: mergedConfig,
        activeTests: activeTests.map(t => ({
          id: t.id,
          name: t.name
        })),
        appliedVariants: variantAssignments.map((v, i) => ({
          testId: activeTests[i].id,
          testName: activeTests[i].name,
          variantId: v.variant_id,
          variantName: v.variant_name,
          isControl: v.is_control
        }))
      };
    } catch (error) {
      console.error('[SLOT AB TESTING] Error getting config with variants:', error);
      // Return base config on error
      return {
        config: baseConfig,
        activeTests: [],
        appliedVariants: [],
        error: error.message
      };
    }
  }

  /**
   * Get active A/B tests for a page type
   */
  async getActiveTestsForPage(pageType, storeId) {
    try {
      const adapter = await ConnectionManager.getStoreConnection(storeId);
      const supabaseClient = adapter.client || adapter.getClient();
      const { data: tests, error } = await supabaseClient
        .from('ab_tests')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'running');

      if (error) {
        throw error;
      }

      // Filter tests that apply to this page type
      return (tests || []).filter(test => {
        const metadata = test.metadata || {};
        const targetPages = metadata.target_pages || [];

        // If no target pages specified, test applies to all pages
        if (targetPages.length === 0) return true;

        // Check if this page type is targeted
        return targetPages.includes(pageType);
      });
    } catch (error) {
      console.error('[SLOT AB TESTING] Error getting active tests:', error);
      return [];
    }
  }

  /**
   * Merge base configuration with variant overrides
   * @param {object} baseConfig - Base slot configuration
   * @param {array} variants - Array of variant assignments
   * @param {array} tests - Array of test objects
   * @returns {object} Merged configuration
   */
  mergeConfigurations(baseConfig, variants, tests) {
    let mergedConfig = JSON.parse(JSON.stringify(baseConfig)); // Deep clone

    variants.forEach((variant, index) => {
      // Skip control variants (no changes)
      if (variant.is_control) {
        return;
      }

      const variantConfig = variant.config || {};

      // Apply page template override
      if (variantConfig.page_template) {
        mergedConfig.page_template = variantConfig.page_template;
      }

      // Apply complete slot configuration override
      if (variantConfig.slot_configuration) {
        mergedConfig = this.deepMerge(mergedConfig, variantConfig.slot_configuration);
        return; // Skip slot overrides if complete config provided
      }

      // Apply individual slot overrides
      if (variantConfig.slot_overrides) {
        mergedConfig = this.applySlotOverrides(
          mergedConfig,
          variantConfig.slot_overrides
        );
      }

      // Apply component prop overrides
      if (variantConfig.component_props) {
        mergedConfig = this.applyComponentPropOverrides(
          mergedConfig,
          variantConfig.component_props
        );
      }

      // Apply CSS/style overrides
      if (variantConfig.style_overrides) {
        mergedConfig.style_overrides = {
          ...(mergedConfig.style_overrides || {}),
          ...variantConfig.style_overrides
        };
      }

      // Apply feature flags
      if (variantConfig.feature_flags) {
        mergedConfig.feature_flags = {
          ...(mergedConfig.feature_flags || {}),
          ...variantConfig.feature_flags
        };
      }
    });

    return mergedConfig;
  }

  /**
   * Apply slot overrides to configuration
   */
  applySlotOverrides(config, slotOverrides) {
    const slots = config.slots || [];
    const modifiedSlots = [...slots];

    Object.entries(slotOverrides).forEach(([slotId, override]) => {
      const slotIndex = modifiedSlots.findIndex(s => s.id === slotId || s.name === slotId);

      if (slotIndex >= 0) {
        // Existing slot - modify it
        if (override.enabled === false) {
          // Remove slot
          modifiedSlots.splice(slotIndex, 1);
        } else {
          // Update slot properties
          modifiedSlots[slotIndex] = this.deepMerge(
            modifiedSlots[slotIndex],
            override
          );
        }
      } else if (override.enabled !== false) {
        // New slot - add it
        const newSlot = {
          id: slotId,
          name: slotId,
          ...override
        };

        // Insert at specified position or append
        if (override.position !== undefined) {
          modifiedSlots.splice(override.position, 0, newSlot);
        } else {
          modifiedSlots.push(newSlot);
        }
      }
    });

    return {
      ...config,
      slots: modifiedSlots
    };
  }

  /**
   * Apply component prop overrides
   * Useful for testing specific prop changes without overriding entire slots
   */
  applyComponentPropOverrides(config, componentPropsOverrides) {
    const slots = config.slots || [];

    const modifiedSlots = slots.map(slot => {
      const slotId = slot.id || slot.name;

      if (componentPropsOverrides[slotId]) {
        return {
          ...slot,
          props: {
            ...(slot.props || {}),
            ...componentPropsOverrides[slotId]
          }
        };
      }

      return slot;
    });

    return {
      ...config,
      slots: modifiedSlots
    };
  }

  /**
   * Deep merge objects (right overwrites left)
   */
  deepMerge(target, source) {
    const output = { ...target };

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }

    return output;
  }

  /**
   * Check if value is object
   */
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Create A/B test for slot configuration
   * Helper method for creating tests programmatically
   */
  async createSlotTest(testConfig) {
    const {
      storeId,
      name,
      description,
      pageTypes,
      controlConfig,
      variantConfigs,
      primaryMetric = 'conversion_rate',
      trafficAllocation = 1.0
    } = testConfig;

    // Build variants array
    const variants = [
      {
        id: 'control',
        name: 'Control (Original)',
        description: 'Original slot configuration',
        weight: 1,
        is_control: true,
        config: controlConfig || {}
      },
      ...variantConfigs.map((variantConfig, index) => ({
        id: `variant_${index + 1}`,
        name: variantConfig.name || `Variant ${index + 1}`,
        description: variantConfig.description || '',
        weight: variantConfig.weight || 1,
        is_control: false,
        config: variantConfig.config
      }))
    ];

    // Create test
    const adapter = await ConnectionManager.getStoreConnection(storeId);
    const supabaseClient = adapter.client || adapter.getClient();
    const { data: test, error } = await supabaseClient
      .from('ab_tests')
      .insert({
        store_id: storeId,
        name,
        description,
        status: 'draft',
        variants,
        traffic_allocation: trafficAllocation,
        primary_metric: primaryMetric,
        metadata: {
          target_pages: pageTypes,
          test_type: 'slot_configuration'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return test;
  }

  /**
   * Example test configurations for common scenarios
   */
  getExampleTests() {
    return {
      // Example 1: Test different hero CTAs
      heroButtonTest: {
        name: 'Hero CTA Button Test',
        pageTypes: ['home', 'category'],
        variantConfigs: [
          {
            name: 'Variant A - Shop Now',
            config: {
              slot_overrides: {
                'hero': {
                  props: {
                    buttonText: 'Shop Now',
                    buttonColor: '#ff6b6b'
                  }
                }
              }
            }
          },
          {
            name: 'Variant B - Explore Collection',
            config: {
              slot_overrides: {
                'hero': {
                  props: {
                    buttonText: 'Explore Collection',
                    buttonColor: '#4ecdc4'
                  }
                }
              }
            }
          }
        ]
      },

      // Example 2: Test product card layout
      productCardTest: {
        name: 'Product Card Layout Test',
        pageTypes: ['category', 'search'],
        variantConfigs: [
          {
            name: 'Variant A - Grid with Large Images',
            config: {
              component_props: {
                'product-grid': {
                  columns: 3,
                  imageAspectRatio: '4:3',
                  showQuickView: true
                }
              }
            }
          },
          {
            name: 'Variant B - List View',
            config: {
              component_props: {
                'product-grid': {
                  layout: 'list',
                  showDescriptionPreview: true
                }
              }
            }
          }
        ]
      },

      // Example 3: Test trust badges position
      trustBadgesTest: {
        name: 'Trust Badges Position Test',
        pageTypes: ['product'],
        variantConfigs: [
          {
            name: 'Variant A - Above Add to Cart',
            config: {
              slot_overrides: {
                'trust-badges': {
                  position: 5, // Before add to cart button
                  props: {
                    layout: 'horizontal'
                  }
                }
              }
            }
          },
          {
            name: 'Variant B - Below Product Description',
            config: {
              slot_overrides: {
                'trust-badges': {
                  position: 10, // After description
                  props: {
                    layout: 'vertical',
                    badges: ['secure-checkout', 'free-shipping', '30-day-returns']
                  }
                }
              }
            }
          }
        ]
      },

      // Example 4: Test cart upsell
      cartUpsellTest: {
        name: 'Cart Upsell Component Test',
        pageTypes: ['cart'],
        variantConfigs: [
          {
            name: 'Variant A - Carousel Recommendations',
            config: {
              slot_overrides: {
                'cart-upsell': {
                  enabled: true,
                  component: 'ProductCarousel',
                  props: {
                    title: 'You might also like',
                    limit: 6,
                    autoplay: true
                  }
                }
              }
            }
          },
          {
            name: 'Variant B - Bundle Deals',
            config: {
              slot_overrides: {
                'cart-upsell': {
                  enabled: true,
                  component: 'BundleDeals',
                  props: {
                    title: 'Complete your purchase',
                    discountPercent: 10
                  }
                }
              }
            }
          },
          {
            name: 'Variant C - No Upsell',
            config: {
              slot_overrides: {
                'cart-upsell': {
                  enabled: false
                }
              }
            }
          }
        ]
      },

      // Example 5: Test checkout flow simplification
      checkoutFlowTest: {
        name: 'Checkout Flow Simplification Test',
        pageTypes: ['checkout'],
        variantConfigs: [
          {
            name: 'Variant A - Single Page Checkout',
            config: {
              page_template: 'checkout_single_page',
              feature_flags: {
                express_checkout: true,
                guest_checkout_first: true
              }
            }
          },
          {
            name: 'Variant B - Multi-Step with Progress Bar',
            config: {
              slot_overrides: {
                'checkout-progress': {
                  enabled: true,
                  component: 'CheckoutProgressBar',
                  position: 0
                }
              }
            }
          }
        ]
      }
    };
  }
}

// Singleton instance
const slotConfigABTesting = new SlotConfigABTesting();

module.exports = slotConfigABTesting;
