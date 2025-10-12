import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/button';
import { Check } from 'lucide-react';
import apiClient from '@/api/client';

/**
 * ConfigurableProductSelector Component
 *
 * Displays variant selectors for configurable products (similar to Magento).
 * Allows customers to select product variants based on configurable attributes (e.g., size, color).
 *
 * Note: Out-of-stock variant handling depends on store settings:
 * - If display_out_of_stock = true: All variants are shown, out-of-stock ones are visually disabled
 * - If display_out_of_stock = false: Only in-stock variants are returned from API, no disabled options shown
 *
 * @param {Object} product - The configurable product
 * @param {Object} store - The store context
 * @param {Object} settings - The store settings (to check display_out_of_stock)
 * @param {Function} onVariantChange - Callback when a variant is selected
 */
export default function ConfigurableProductSelector({ product, store, settings, onVariantChange }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [availableOptions, setAvailableOptions] = useState({});

  // Debug logging
  console.log('🔧 ConfigurableProductSelector mounted:', {
    hasProduct: !!product,
    productId: product?.id,
    productType: product?.type,
    productName: product?.name,
    willLoadVariants: product?.id && product?.type === 'configurable'
  });

  useEffect(() => {
    console.log('🔧 ConfigurableProductSelector useEffect triggered:', {
      productId: product?.id,
      productType: product?.type,
      shouldLoad: product?.id && product?.type === 'configurable'
    });

    if (product?.id && product?.type === 'configurable') {
      loadVariants();
    } else {
      console.log('❌ Not loading variants - conditions not met');
      setLoading(false);
    }
  }, [product?.id]);

  const loadVariants = async () => {
    try {
      console.log('📦 Loading variants for product:', product.id);
      setLoading(true);
      const response = await apiClient.get(`/configurable-products/${product.id}/public-variants`);

      console.log('📦 Variants response:', response);

      if (response.success && response.data) {
        console.log('✅ Setting', response.data.length, 'variants');
        setVariants(response.data);

        // Build available options from variants
        const options = {};
        const configurableAttrIds = product.configurable_attributes || [];

        response.data.forEach(variantRelation => {
          const attrValues = variantRelation.attribute_values || {};

          Object.entries(attrValues).forEach(([attrCode, value]) => {
            if (!options[attrCode]) {
              options[attrCode] = new Set();
            }
            options[attrCode].add(value);
          });
        });

        // Convert Sets to Arrays
        Object.keys(options).forEach(key => {
          options[key] = Array.from(options[key]);
        });

        console.log('✅ Available options built:', options);
        setAvailableOptions(options);
      } else {
        console.warn('⚠️ Response not in expected format:', response);
      }
    } catch (error) {
      console.error('❌ Failed to load variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttributeSelect = (attrCode, value) => {
    const newSelection = {
      ...selectedAttributes,
      [attrCode]: value
    };
    setSelectedAttributes(newSelection);

    // Find matching variant
    const matchingVariant = variants.find(variantRelation => {
      const attrValues = variantRelation.attribute_values || {};
      return Object.keys(newSelection).every(key => attrValues[key] === newSelection[key]);
    });

    if (matchingVariant && onVariantChange) {
      onVariantChange(matchingVariant.variant);
    }
  };

  // Check if a specific attribute value combination leads to an out-of-stock variant
  const isOptionOutOfStock = (attrCode, value) => {
    // Check if selecting this value would lead to a variant that's out of stock
    const testSelection = {
      ...selectedAttributes,
      [attrCode]: value
    };

    const matchingVariant = variants.find(variantRelation => {
      const attrValues = variantRelation.attribute_values || {};
      return Object.keys(testSelection).every(key => attrValues[key] === testSelection[key]);
    });

    if (!matchingVariant || !matchingVariant.variant) {
      return false; // No variant found yet, don't mark as out of stock
    }

    const variant = matchingVariant.variant;

    // Check stock status
    if (variant.infinite_stock) {
      return false; // Always in stock
    }

    if (!variant.manage_stock) {
      return false; // Not tracking stock, assume in stock
    }

    return variant.stock_quantity <= 0; // Out of stock if quantity is 0 or less
  };

  if (!product || product.type !== 'configurable') {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="flex gap-2">
            <div className="h-10 w-16 bg-gray-200 rounded"></div>
            <div className="h-10 w-16 bg-gray-200 rounded"></div>
            <div className="h-10 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {Object.entries(availableOptions).map(([attrCode, values]) => {
        const isSelected = (value) => selectedAttributes[attrCode] === value;

        return (
          <div key={attrCode} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {attrCode.replace(/_/g, ' ')}
              {selectedAttributes[attrCode] && (
                <span className="ml-2 text-gray-600 font-normal">
                  ({selectedAttributes[attrCode]})
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {values.map((value) => {
                const selected = isSelected(value);
                // Only check for out-of-stock if store displays out-of-stock products
                // If display_out_of_stock = false, backend already filtered them out
                const displayOutOfStock = settings?.display_out_of_stock !== false; // Default to true
                const outOfStock = displayOutOfStock ? isOptionOutOfStock(attrCode, value) : false;

                return (
                  <button
                    key={value}
                    onClick={() => !outOfStock && handleAttributeSelect(attrCode, value)}
                    disabled={outOfStock}
                    className={`
                      relative px-4 py-2 rounded-md border-2 transition-all
                      ${outOfStock
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                        : selected
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    `}
                    title={outOfStock ? 'Out of stock' : ''}
                  >
                    <span className="flex items-center gap-2">
                      {value}
                      {selected && !outOfStock && (
                        <Check className="w-4 h-4" />
                      )}
                      {outOfStock && (
                        <span className="text-xs">(Out of stock)</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
