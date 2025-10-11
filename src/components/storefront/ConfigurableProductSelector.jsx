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
 * @param {Object} product - The configurable product
 * @param {Object} store - The store context
 * @param {Function} onVariantChange - Callback when a variant is selected
 */
export default function ConfigurableProductSelector({ product, store, onVariantChange }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [availableOptions, setAvailableOptions] = useState({});

  useEffect(() => {
    if (product?.id && product?.type === 'configurable') {
      loadVariants();
    } else {
      setLoading(false);
    }
  }, [product?.id]);

  const loadVariants = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/configurable-products/${product.id}/public-variants`);

      if (response.success && response.data) {
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

        setAvailableOptions(options);
      }
    } catch (error) {
      console.error('Failed to load variants:', error);
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

                return (
                  <button
                    key={value}
                    onClick={() => handleAttributeSelect(attrCode, value)}
                    className={`
                      relative px-4 py-2 rounded-md border-2 transition-all
                      ${selected
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    `}
                  >
                    <span className="flex items-center gap-2">
                      {value}
                      {selected && (
                        <Check className="w-4 h-4" />
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
