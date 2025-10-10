import React, { useEffect } from 'react';
import { useStore } from '@/components/storefront/StoreProvider';
import { _setStoreContext } from './priceUtils';

/**
 * PriceUtilsProvider - Initializes the price utils with store context
 * This component should wrap your app to enable context-aware price formatting
 */
export const PriceUtilsProvider = ({ children }) => {
  const storeContext = useStore();

  useEffect(() => {
    if (storeContext) {
      _setStoreContext(storeContext);
    }
  }, [storeContext]);

  return <>{children}</>;
};

export default PriceUtilsProvider;
