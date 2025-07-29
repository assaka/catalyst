import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { createProductUrl } from '@/utils/urlUtils';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/components/storefront/StoreProvider';
import ProductLabelComponent from '@/components/storefront/ProductLabel';
import { formatDisplayPrice } from '@/utils/priceUtils';

const ProductCard = ({ product, settings, className = "" }) => {
  const { productLabels, store, taxes, selectedCountry } = useStore();

  if (!product || !store) return null;

  // Product label logic - unified across all components
  const renderProductLabels = () => {
    // Filter labels that match the product conditions (using same logic as other pages)
    const matchingLabels = productLabels?.filter((label) => {
      let shouldShow = true; // Assume true, prove false (AND logic)

      if (label.conditions && Object.keys(label.conditions).length > 0) {
        // Check product_ids condition
        if (shouldShow && label.conditions.product_ids && Array.isArray(label.conditions.product_ids) && label.conditions.product_ids.length > 0) {
          if (!label.conditions.product_ids.includes(product.id)) {
            shouldShow = false;
          }
        }

        // Check category_ids condition
        if (shouldShow && label.conditions.category_ids && Array.isArray(label.conditions.category_ids) && label.conditions.category_ids.length > 0) {
          if (!product.category_ids || !product.category_ids.some(catId => label.conditions.category_ids.includes(catId))) {
            shouldShow = false;
          }
        }

        // Check price conditions
        if (shouldShow && label.conditions.price_conditions) {
          const conditions = label.conditions.price_conditions;
          if (conditions.has_sale_price) {
            const hasComparePrice = product.compare_price && parseFloat(product.compare_price) > 0;
            const pricesAreDifferent = hasComparePrice && parseFloat(product.compare_price) !== parseFloat(product.price);
            if (!pricesAreDifferent) {
              shouldShow = false;
            }
          }
          if (shouldShow && conditions.is_new && conditions.days_since_created) {
            const productCreatedDate = new Date(product.created_date);
            const now = new Date();
            const daysSince = Math.floor((now.getTime() - productCreatedDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince > conditions.days_since_created) {
              shouldShow = false;
            }
          }
        }

        // Check attribute conditions
        if (shouldShow && label.conditions.attribute_conditions && Array.isArray(label.conditions.attribute_conditions) && label.conditions.attribute_conditions.length > 0) {
          const attributeMatch = label.conditions.attribute_conditions.every(cond => {
            if (product.attributes && product.attributes[cond.attribute_code]) {
              const productAttributeValue = String(product.attributes[cond.attribute_code]).toLowerCase();
              const conditionValue = String(cond.attribute_value).toLowerCase();
              return productAttributeValue === conditionValue;
            }
            return false;
          });
          if (!attributeMatch) {
            shouldShow = false;
          }
        }
      }

      return shouldShow;
    }) || [];

    // Group labels by position and show one label per position
    const labelsByPosition = matchingLabels.reduce((acc, label) => {
      const position = label.position || 'top-right';
      if (!acc[position]) {
        acc[position] = [];
      }
      acc[position].push(label);
      return acc;
    }, {});

    // For each position, sort by sort_order (ASC) then by priority (DESC) and take the first one
    const labelsToShow = Object.values(labelsByPosition).map(positionLabels => {
      const sortedLabels = positionLabels.sort((a, b) => {
        const sortOrderA = a.sort_order || 0;
        const sortOrderB = b.sort_order || 0;
        if (sortOrderA !== sortOrderB) {
          return sortOrderA - sortOrderB; // ASC
        }
        const priorityA = a.priority || 0;
        const priorityB = b.priority || 0;
        return priorityB - priorityA; // DESC
      });
      return sortedLabels[0]; // Return highest priority label for this position
    }).filter(Boolean);

    // Show all labels (one per position)
    return labelsToShow.map(label => (
      <ProductLabelComponent
        key={label.id}
        label={label}
      />
    ));
  };

  return (
    <Card className={`group overflow-hidden ${className}`}>
      <CardContent className="p-0">
        <Link to={createProductUrl(store.slug, product.slug, product.id || '')}>
          <div className="relative">
            <img
              src={product.images?.[0] || 'https://placehold.co/400x400?text=No+Image'}
              alt={product.name}
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Product labels */}
            {renderProductLabels()}
          </div>
        </Link>
        <div className="p-4">
          <h3 className="font-semibold text-lg truncate mt-1">
            <Link to={createProductUrl(store.slug, product.slug, product.id || '')}>{product.name}</Link>
          </h3>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-baseline gap-2">
              {product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price) ? (
                <>
                  <p className="font-bold text-red-600 text-xl">
                    {formatDisplayPrice(
                      Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
                      settings?.hide_currency_product ? '' : (settings?.currency_symbol || '$'),
                      store,
                      taxes,
                      selectedCountry
                    )}
                  </p>
                  <p className="text-gray-500 line-through text-sm">
                    {formatDisplayPrice(
                      Math.max(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
                      settings?.hide_currency_product ? '' : (settings?.currency_symbol || '$'),
                      store,
                      taxes,
                      selectedCountry
                    )}
                  </p>
                </>
              ) : (
                <p className="font-bold text-xl text-gray-900">
                  {formatDisplayPrice(
                    parseFloat(product.price || 0),
                    settings?.hide_currency_product ? '' : (settings?.currency_symbol || '$'),
                    store,
                    taxes,
                    selectedCountry
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;