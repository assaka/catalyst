/**
 * ProductCard (Slotted Version) - Pilot Component for Phoenix Migration
 * This replaces the monolithic ProductCard with a slot-based architecture
 */

import React from 'react';
import { SlotRenderer, SlotContainer } from '@/core/slot-system';

const ProductCardSlotted = ({ product, settings, className = "" }) => {
  // Early return if no product
  if (!product) return null;

  // Common props that all slots will receive
  const commonSlotProps = {
    product,
    settings,
    // These would come from context in a real implementation
    store: { slug: 'demo', id: 1 },
    taxes: [],
    selectedCountry: 'US',
    productLabels: []
  };

  return (
    <div className={className}>
      {/* Container slot - wraps the entire card */}
      <SlotRenderer
        slotId="product.card.container"
        {...commonSlotProps}
      >
        {/* Image slot */}
        <SlotRenderer
          slotId="product.card.image"
          {...commonSlotProps}
        />

        {/* Content wrapper */}
        <SlotRenderer
          slotId="product.card.content"
          {...commonSlotProps}
        >
          {/* Product name */}
          <SlotRenderer
            slotId="product.card.name"
            {...commonSlotProps}
          />

          {/* Actions section (pricing + button) */}
          <SlotRenderer
            slotId="product.card.actions"
            {...commonSlotProps}
          >
            {/* Pricing */}
            <SlotRenderer
              slotId="product.card.pricing"
              {...commonSlotProps}
            />

            {/* Add to cart button */}
            <SlotRenderer
              slotId="product.card.add_to_cart"
              {...commonSlotProps}
            />
          </SlotRenderer>
        </SlotRenderer>
      </SlotRenderer>
    </div>
  );
};

export default ProductCardSlotted;