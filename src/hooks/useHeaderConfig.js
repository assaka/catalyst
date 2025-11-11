import { useState, useEffect, useCallback } from 'react';
import { useLayoutConfig } from './useSlotConfiguration';
import { headerConfig } from '@/components/editor/slot/configs/header-config';
import { useStore } from '@/components/storefront/StoreProvider';

/**
 * Custom hook for loading header configuration
 * Uses bootstrap headerSlotConfig if available (no API call!)
 * @param {Object} store - The store object
 * @returns {Object} - { headerSlots, headerConfigLoaded, reloadHeaderConfig }
 */
export function useHeaderConfig(store) {
  const { headerSlotConfig: bootstrapHeaderConfig } = useStore() || {};

  // Only fetch if bootstrap didn't provide config
  const shouldFetch = !bootstrapHeaderConfig;

  const { layoutConfig, configLoaded, reloadConfig } = useLayoutConfig(
    store,
    'header',
    headerConfig,
    shouldFetch
  );

  const [headerSlots, setHeaderSlots] = useState(null);
  const [headerConfigLoaded, setHeaderConfigLoaded] = useState(false);

  useEffect(() => {
    // Priority 1: Use bootstrap data if available (no API call!)
    if (bootstrapHeaderConfig?.slots) {
      setHeaderSlots(bootstrapHeaderConfig.slots);
      setHeaderConfigLoaded(true);
      return;
    }

    // Priority 2: Use fetched layout config
    if (configLoaded && layoutConfig) {
      const slots = layoutConfig.slots || headerConfig.slots;
      setHeaderSlots(slots);
      setHeaderConfigLoaded(true);
    } else if (configLoaded && !layoutConfig) {
      // Priority 3: Use default header config
      setHeaderSlots(headerConfig.slots);
      setHeaderConfigLoaded(true);
    }
  }, [configLoaded, layoutConfig, bootstrapHeaderConfig]);

  return {
    headerSlots,
    headerConfigLoaded,
    reloadHeaderConfig: reloadConfig
  };
}

export default useHeaderConfig;
