import { useState, useEffect } from 'react';
import slotConfigurationService from '@/services/slotConfigurationService';
import { useABTesting } from '@/hooks/useABTest';

/**
 * Hook to load slot configuration with A/B test overrides automatically applied
 *
 * Usage:
 * const { config, isLoading } = useSlotConfigWithABTest(storeId, 'product', defaultConfig);
 */
export function useSlotConfigWithABTest(storeId, pageType, defaultConfig) {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get active A/B tests for this page
  const { activeTests, isLoading: testsLoading } = useABTesting(storeId, pageType);

  useEffect(() => {
    if (!storeId || !pageType) {
      setIsLoading(false);
      return;
    }

    async function loadConfigWithTests() {
      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Load published slot configuration
        const response = await slotConfigurationService.getPublishedConfiguration(storeId, pageType);

        let baseConfig = null;

        // Check if we have a valid published config
        if (response.success && response.data &&
            response.data.configuration &&
            response.data.configuration.slots &&
            Object.keys(response.data.configuration.slots).length > 0) {

          const publishedConfig = response.data;

          // Merge with default config
          const mergedSlots = {
            ...defaultConfig.slots,
            ...publishedConfig.configuration.slots
          };

          baseConfig = {
            ...publishedConfig.configuration,
            slots: mergedSlots
          };
        } else {
          // Use default config if no published config
          baseConfig = defaultConfig;
        }

        // Step 2: Apply A/B test overrides
        const finalConfig = await applyABTestOverrides(baseConfig, activeTests);

        console.log('[useSlotConfigWithABTest] Final config with A/B tests:', {
          baseSlotCount: Object.keys(baseConfig.slots || {}).length,
          activeTestsCount: activeTests?.length || 0,
          finalSlotCount: Object.keys(finalConfig.slots || {}).length,
          overridesApplied: activeTests?.length > 0
        });

        setConfig(finalConfig);
        setIsLoading(false);

      } catch (err) {
        console.error('[useSlotConfigWithABTest] Error:', err);
        setError(err.message);
        setConfig(defaultConfig); // Fallback to default
        setIsLoading(false);
      }
    }

    // Wait for A/B tests to load before processing
    if (!testsLoading) {
      loadConfigWithTests();
    }
  }, [storeId, pageType, defaultConfig, activeTests, testsLoading]);

  return { config, isLoading: isLoading || testsLoading, error };
}

/**
 * Apply A/B test overrides to slot configuration
 */
async function applyABTestOverrides(baseConfig, activeTests) {
  if (!activeTests || activeTests.length === 0) {
    console.log('[A/B Test] No active tests, returning base config');
    return baseConfig;
  }

  console.log('[A/B Test] Applying overrides from', activeTests.length, 'active tests');

  // Clone the config to avoid mutations
  const finalConfig = JSON.parse(JSON.stringify(baseConfig));

  // Apply each test's overrides
  activeTests.forEach((test, index) => {
    console.log(`[A/B Test ${index + 1}] Test: ${test.test_name}, Variant: ${test.variant_name}`);

    if (test.variant_config?.slot_overrides) {
      const overrides = test.variant_config.slot_overrides;

      console.log(`[A/B Test ${index + 1}] Found slot overrides:`, Object.keys(overrides));

      // Apply each slot override
      Object.entries(overrides).forEach(([slotId, override]) => {
        if (finalConfig.slots[slotId]) {
          // Slot exists, merge the override
          console.log(`[A/B Test ${index + 1}] Overriding slot "${slotId}":`, {
            before: finalConfig.slots[slotId].content,
            after: override.content
          });

          finalConfig.slots[slotId] = {
            ...finalConfig.slots[slotId],
            ...override
          };
        } else {
          // Slot doesn't exist, create it if enabled
          if (override.enabled !== false) {
            console.log(`[A/B Test ${index + 1}] Creating new slot "${slotId}"`);
            finalConfig.slots[slotId] = override;
          }
        }
      });
    } else {
      console.log(`[A/B Test ${index + 1}] No slot overrides found in variant config`);
    }
  });

  return finalConfig;
}

export default useSlotConfigWithABTest;
