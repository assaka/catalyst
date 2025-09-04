/**
 * Default Slot Components for ProductCard
 * These are the building blocks that replace the monolithic ProductCard
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { createProductUrl } from '@/utils/urlUtils';
import { formatDisplayPrice } from '@/utils/priceUtils';
import { getPrimaryImageUrl } from '@/utils/imageUtils';
import cartService from '@/services/cartService';
import ProductLabelComponent from '@/components/storefront/ProductLabel';

// Base wrapper for product cards
export const ProductCardContainer = ({ 
  children, 
  className = "", 
  product,
  store
}) => (
  <Card className={`group overflow-hidden ${className}`}>
    <CardContent className="p-0">
      {children}
    </CardContent>
  </Card>
);

// Product image slot
export const ProductCardImage = ({ 
  product, 
  store, 
  productLabels = [],
  className = "w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
}) => {
  if (!product || !store) return null;

  // Product label logic - matches existing ProductCard logic
  const renderProductLabels = () => {
    const matchingLabels = productLabels?.filter((label) => {
      let shouldShow = true;

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
      return sortedLabels[0];
    }).filter(Boolean);

    return labelsToShow.map(label => (
      <ProductLabelComponent
        key={label.id}
        label={label}
      />
    ));
  };

  return (
    <Link to={createProductUrl(store.slug, product.slug)}>
      <div className="relative">
        <img
          src={getPrimaryImageUrl(product.images) || 'https://placehold.co/400x400?text=No+Image'}
          alt={product.name}
          className={className}
        />
        {renderProductLabels()}
      </div>
    </Link>
  );
};

// Product name slot
export const ProductCardName = ({ 
  product, 
  store,
  className = "font-semibold text-lg truncate mt-1"
}) => {
  if (!product || !store) return null;

  return (
    <h3 className={className}>
      <Link to={createProductUrl(store.slug, product.slug)}>
        {product.name}
      </Link>
    </h3>
  );
};

// Product pricing slot
export const ProductCardPricing = ({ 
  product, 
  store, 
  settings,
  taxes,
  selectedCountry
}) => {
  if (!product || !store) return null;

  const currencySymbol = settings?.currency_symbol || '$';

  return (
    <div className="flex items-baseline gap-2">
      {product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price) ? (
        <>
          <p className="font-bold text-red-600 text-xl">
            {formatDisplayPrice(
              Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
              settings?.hide_currency_product ? '' : currencySymbol,
              store,
              taxes,
              selectedCountry
            )}
          </p>
          <p className="text-gray-500 line-through text-sm">
            {formatDisplayPrice(
              Math.max(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
              settings?.hide_currency_product ? '' : currencySymbol,
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
            settings?.hide_currency_product ? '' : currencySymbol,
            store,
            taxes,
            selectedCountry
          )}
        </p>
      )}
    </div>
  );
};

// Add to cart button slot
export const ProductCardAddToCart = ({ 
  product, 
  store, 
  settings,
  text = "Add to Cart",
  className = "w-full text-white border-0 hover:brightness-90 transition-all duration-200",
  size = "sm",
  onAddToCart
}) => {
  if (!product || !store) return null;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (!product || !product.id) {
        console.error('Invalid product for add to cart');
        return;
      }

      if (!store?.id) {
        console.error('Store ID is required for add to cart');
        return;
      }

      // Add to cart using cartService
      const result = await cartService.addItem(
        product.id, 
        1, // quantity
        product.price || 0,
        [], // selectedOptions 
        store.id
      );

      if (result.success !== false) {
        // Track add to cart event
        if (typeof window !== 'undefined' && window.catalyst?.trackAddToCart) {
          window.catalyst.trackAddToCart(product, 1);
        }
        
        // Dispatch cart updated event to refresh MiniCart
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        console.log('Successfully added to cart:', product.name);

        // Call custom onAddToCart if provided
        if (onAddToCart) {
          onAddToCart(product, result);
        }
      } else {
        console.error('Failed to add to cart:', result.error);
      }
    } catch (error) {
      console.error("Failed to add to cart", error);
    }
  };

  return (
    <Button 
      onClick={handleAddToCart}
      className={className}
      size={size}
      style={{ 
        backgroundColor: settings?.theme?.add_to_cart_button_color || '#3B82F6',
        color: 'white'
      }}
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      {text}
    </Button>
  );
};

// Complete product card actions section (pricing + button)
export const ProductCardActions = ({ children, className = "space-y-3 mt-4" }) => (
  <div className={className}>
    {children}
  </div>
);

// Product card content wrapper
export const ProductCardContent = ({ children, className = "p-4" }) => (
  <div className={className}>
    {children}
  </div>
);