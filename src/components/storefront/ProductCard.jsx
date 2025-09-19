import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { createProductUrl } from '@/utils/urlUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/components/storefront/StoreProvider';
import ProductLabelComponent from '@/components/storefront/ProductLabel';
import { formatDisplayPrice } from '@/utils/priceUtils';
import cartService from '@/services/cartService';
import { ShoppingCart } from 'lucide-react';
import { getPrimaryImageUrl } from '@/utils/imageUtils';

const ProductCard = ({ product, settings, className = "" }) => {
  const { productLabels, store, taxes, selectedCountry } = useStore();

  // Prevent duplicate add to cart operations
  const [isAddingToCart, setIsAddingToCart] = useState(false);

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

  const handleAddToCart = async (e) => {
    e.preventDefault(); // Prevent navigation when clicking the button
    e.stopPropagation();

    // Prevent multiple rapid additions
    if (isAddingToCart) {
      console.log('⏳ Add to cart already in progress, ignoring duplicate request for:', product.name);
      return;
    }

    try {
      setIsAddingToCart(true);
      console.log('🛒 Starting add to cart for:', product.name);

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

        // Dispatch cart update events strategically
        const eventDetail = {
          action: 'add_from_product_card',
          productId: product.id,
          productName: product.name,
          quantity: 1,
          timestamp: Date.now()
        };

        // Primary cartUpdated event (immediate)
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: eventDetail }));
        console.log('🛒 Dispatched immediate cartUpdated event:', product.name);

        // Backup refreshMiniCart event after short delay (in case cartUpdated fails)
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('refreshMiniCart', {
            detail: { ...eventDetail, source: 'ProductCard_backup' }
          }));
          console.log('🛒 Dispatched backup refreshMiniCart event:', product.name);
        }, 200);

        console.log('✅ Successfully added to cart:', product.name);

        // Show flash message
        window.dispatchEvent(new CustomEvent('showFlashMessage', {
          detail: {
            type: 'success',
            message: `${product.name} added to cart successfully!`
          }
        }));
      } else {
        console.error('❌ Failed to add to cart:', result.error);

        // Show error flash message
        window.dispatchEvent(new CustomEvent('showFlashMessage', {
          detail: {
            type: 'error',
            message: `Failed to add ${product.name} to cart. Please try again.`
          }
        }));
      }
    } catch (error) {
      console.error("❌ Failed to add to cart", error);

      // Show error flash message for catch block
      window.dispatchEvent(new CustomEvent('showFlashMessage', {
        detail: {
          type: 'error',
          message: `Error adding ${product.name} to cart. Please try again.`
        }
      }));
    } finally {
      // Always reset the loading state after 2 seconds to prevent permanent lock
      setTimeout(() => {
        setIsAddingToCart(false);
        console.log('🔓 Add to cart lock released for:', product.name);
      }, 2000);
    }
  };

  return (
    <Card className={`group overflow-hidden ${className}`}>
      <CardContent className="p-0">
        <Link to={createProductUrl(store.slug, product.slug)}>
          <div className="relative">
            <img
              src={getPrimaryImageUrl(product.images) || 'https://placehold.co/400x400?text=No+Image'}
              alt={product.name}
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Product labels */}
            {renderProductLabels()}
          </div>
        </Link>
        <div className="p-4">
          <h3 className="font-semibold text-lg truncate mt-1">
            <Link to={createProductUrl(store.slug, product.slug)}>{product.name}</Link>
          </h3>
          <div className="space-y-3 mt-4">
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
            <Button 
              onClick={handleAddToCart}
              className="w-full text-white border-0 hover:brightness-90 transition-all duration-200"
              size="sm"
              style={{ 
                backgroundColor: settings?.theme?.add_to_cart_button_color || '#3B82F6',
                color: 'white'
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;