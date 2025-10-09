import { useState, useEffect, useCallback } from 'react';
import { useLayoutConfig } from './useSlotConfiguration';
import { headerConfig } from '@/components/editor/slot/configs/header-config';

/**
 * Custom hook for loading header configuration
 * @param {Object} store - The store object
 * @returns {Object} - { headerSlots, headerConfigLoaded, reloadHeaderConfig }
 */
export function useHeaderConfig(store) {
  const { layoutConfig, configLoaded, reloadConfig } = useLayoutConfig(
    store,
    'header',
    headerConfig
  );

  const [headerSlots, setHeaderSlots] = useState(null);
  const [headerConfigLoaded, setHeaderConfigLoaded] = useState(false);

  useEffect(() => {
    if (configLoaded && layoutConfig) {
      // Extract slots from layout config
      const slots = layoutConfig.slots || headerConfig.slots;
      setHeaderSlots(slots);
      setHeaderConfigLoaded(true);
    } else if (configLoaded && !layoutConfig) {
      // Use default header config if no published config
      setHeaderSlots(headerConfig.slots);
      setHeaderConfigLoaded(true);
    }
  }, [configLoaded, layoutConfig]);

  return {
    headerSlots,
    headerConfigLoaded,
    reloadHeaderConfig: reloadConfig
  };
}

export default useHeaderConfig;
