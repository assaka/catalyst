import React, { useEffect, useRef } from 'react';
import { useStore } from '@/components/storefront/StoreProvider';
import { _setStoreContext } from './priceUtils';

/**
 * PriceUtilsProvider - Initializes the price utils with store context
 * This component should wrap your app to enable context-aware price formatting
 */
export const PriceUtilsProvider = ({ children }) => {
  const storeContext = useStore();
  const lastStoreRef = useRef(null);

  // Set context synchronously during render to ensure it's available
  // before any child components try to use price utils.
  // Update whenever the store object changes (not just on first render).
  if (storeContext?.store && storeContext.store !== lastStoreRef.current) {
    _setStoreContext(storeContext);
    lastStoreRef.current = storeContext.store;
  }

  // Also update via useEffect for any subsequent context changes
  useEffect(() => {
    if (storeContext?.store) {
      _setStoreContext(storeContext);
    }
  }, [storeContext]);

  return <>{children}</>;
};

export default PriceUtilsProvider;
