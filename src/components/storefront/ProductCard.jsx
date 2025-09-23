import React from 'react';
import { useStore } from '@/components/storefront/StoreProvider';
import ProductItemCard from '@/components/storefront/ProductItemCard';

/**
 * ProductCard - Wrapper component that uses ProductItemCard with store context
 * Maintains backward compatibility while using the new reusable component
 */
const ProductCard = ({ product, settings, className = "" }) => {
  const { productLabels, store, taxes, selectedCountry } = useStore();

  if (!product || !store) return null;

  return (
    <ProductItemCard
      product={product}
      settings={settings}
      store={store}
      taxes={taxes}
      selectedCountry={selectedCountry}
      productLabels={productLabels}
      className={className}
      viewMode="grid"
      slotConfig={{}}
    />
  );
};

export default ProductCard;