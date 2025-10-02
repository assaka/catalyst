import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createProductUrl } from '@/utils/urlUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProductLabelComponent from '@/components/storefront/ProductLabel';
import { formatDisplayPrice } from '@/utils/priceUtils';
import cartService from '@/services/cartService';
import { ShoppingCart } from 'lucide-react';
import { getPrimaryImageUrl } from '@/utils/imageUtils';

/**
 * ProductItemCard - Reusable product card component
 * Can be used in ProductCard, CategorySlotRenderer, and other components
 */
const ProductItemCard = ({
  product,
  settings = {},
  store,
  taxes,
  selectedCountry,
  productLabels = [],
  className = "",
  viewMode = 'grid',
  slotConfig = {},
  onAddToCartStateChange = null,
  isAddingToCart = false,
  isEditorMode = false
}) => {
  // Local state for add to cart if not managed externally
  const [localIsAddingToCart, setLocalIsAddingToCart] = useState(false);

  // Use external state if provided, otherwise use local state
  const addingToCart = isAddingToCart || localIsAddingToCart;
  const setAddingToCart = onAddToCartStateChange || setLocalIsAddingToCart;

  if (!product || !store) return null;

  // Get slot configurations for styling - support both nested and flat structures
  const {
    productTemplate = {},
    productImage = {},
    productName = {},
    productPrice = {},
    productComparePrice = {},
    productAddToCart = {},
    // Also check for card-specific slots
    product_card_template = {},
    product_card_image = {},
    product_card_name = {},
    product_card_price = {},
    product_card_compare_price = {},
    product_card_add_to_cart = {}
  } = slotConfig;

  // Merge configurations (card-specific takes precedence)
  const templateConfig = { ...productTemplate, ...product_card_template };
  const imageConfig = { ...productImage, ...product_card_image };
  const nameConfig = { ...productName, ...product_card_name };
  const priceConfig = { ...productPrice, ...product_card_price };
  const comparePriceConfig = { ...productComparePrice, ...product_card_compare_price };
  const addToCartConfig = { ...productAddToCart, ...product_card_add_to_cart };

  // Product label logic - unified across all components
  const renderProductLabels = () => {
    console.log('🔍 renderProductLabels - All labels:', productLabels?.map(l => ({
      name: l.name,
      position: l.position,
      color: l.color,
      background_color: l.background_color,
      conditions: l.conditions
    })));

    // Filter labels that match the product conditions
    const matchingLabels = productLabels?.filter((label) => {
      console.log(`🔍 Evaluating label "${label.name}":`, {
        is_active: label.is_active,
        conditions: label.conditions,
        position: label.position
      });

      let shouldShow = true; // Assume true, prove false (AND logic)

      if (label.conditions && Object.keys(label.conditions).length > 0) {
        console.log(`  📋 Label "${label.name}" has conditions:`, label.conditions);
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
          console.log(`  🏷️ Label "${label.name}" checking attribute conditions:`, label.conditions.attribute_conditions);
          console.log(`  📦 Product attributes:`, product.attributes);

          const attributeMatch = label.conditions.attribute_conditions.every(cond => {
            if (product.attributes && product.attributes[cond.attribute_code]) {
              const productAttributeValue = String(product.attributes[cond.attribute_code]).toLowerCase();
              const conditionValue = String(cond.attribute_value).toLowerCase();
              const matches = productAttributeValue === conditionValue;
              console.log(`    ✓ Checking ${cond.attribute_code}: ${productAttributeValue} === ${conditionValue} = ${matches}`);
              return matches;
            }
            console.log(`    ✗ Attribute ${cond.attribute_code} not found on product`);
            return false;
          });
          if (!attributeMatch) {
            console.log(`  ❌ Label "${label.name}" failed attribute match`);
            shouldShow = false;
          } else {
            console.log(`  ✅ Label "${label.name}" passed attribute match`);
          }
        }
      } else {
        console.log(`  ✅ Label "${label.name}" has no conditions - showing on all products`);
      }

      console.log(`  🎯 Final decision for "${label.name}": ${shouldShow ? 'SHOW' : 'HIDE'}`);
      return shouldShow;
    }) || [];

    console.log('✅ Matching labels after filter:', matchingLabels.map(l => l.name));

    // Group labels by position and show one label per position
    const labelsByPosition = matchingLabels.reduce((acc, label) => {
      const position = label.position || 'top-right';
      if (!acc[position]) {
        acc[position] = [];
      }
      acc[position].push(label);
      return acc;
    }, {});

    console.log('📊 Labels grouped by position:', Object.entries(labelsByPosition).map(([pos, labels]) => ({
      position: pos,
      labels: labels.map(l => l.name)
    })));

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

    console.log('🎨 Final labels to show:', labelsToShow.map(l => ({
      name: l.name,
      position: l.position,
      color: l.color,
      background_color: l.background_color
    })));

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
    if (addingToCart) {
      return;
    }

    try {
      setAddingToCart(true);

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
        setAddingToCart(false);
      }, 2000);
    }
  };

  return (
    <Card
      className={templateConfig.className || `group overflow-hidden ${className} ${viewMode === 'list' ? 'flex' : ''}`}
      style={templateConfig.styles || {}}
      data-product-card={isEditorMode ? 'editable' : undefined}
    >
      <CardContent className="p-0">
        <Link to={createProductUrl(store.slug, product.slug)}>
          <div className={imageConfig.parentClassName || "relative"}>
            <img
              src={getPrimaryImageUrl(product.images) || '/placeholder-product.jpg'}
              alt={product.name}
              className={imageConfig.className || `w-full ${viewMode === 'list' ? 'h-32' : 'h-48'} object-cover transition-transform duration-300 group-hover:scale-105`}
              style={imageConfig.styles || {}}
              data-slot-id={isEditorMode ? 'product_card_image' : undefined}
            />
            {/* Product labels */}
            {renderProductLabels()}
          </div>
        </Link>
        <div className={viewMode === 'list' ? 'p-4 flex-1' : 'p-4'}>
          <h3
            className={nameConfig.className || "font-semibold text-lg truncate mt-1"}
            style={nameConfig.styles || {}}
            data-slot-id={isEditorMode ? 'product_card_name' : undefined}
          >
            <Link to={createProductUrl(store.slug, product.slug)}>{product.name}</Link>
          </h3>

          {viewMode === 'list' && product.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="space-y-3 mt-4">
            {/* Price display */}
            <div className="flex items-baseline gap-2" data-slot-id={isEditorMode ? 'product_card_price_container' : undefined}>
              {(() => {
                console.log('💰 Price Debug:', {
                  product_id: product.id,
                  product_name: product.name,
                  price: product.price,
                  compare_price: product.compare_price,
                  price_parsed: parseFloat(product.price || 0),
                  compare_price_parsed: parseFloat(product.compare_price || 0),
                  has_compare_price: !!product.compare_price,
                  compare_price_gt_zero: parseFloat(product.compare_price || 0) > 0,
                  prices_different: parseFloat(product.compare_price || 0) !== parseFloat(product.price || 0)
                });
              })()}
              {product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price) ? (
                <>
                  <p
                    className={priceConfig.className || "font-bold text-red-600 text-xl"}
                    style={priceConfig.styles || {}}
                    data-slot-id={isEditorMode ? 'product_card_price' : undefined}
                  >
                    {formatDisplayPrice(
                      Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
                      settings?.hide_currency_product ? '' : (settings?.currency_symbol || '$'),
                      store,
                      taxes,
                      selectedCountry
                    )}
                  </p>
                  <p
                    className={comparePriceConfig.className || "text-gray-500 line-through text-sm"}
                    style={comparePriceConfig.styles || {}}
                    data-slot-id={isEditorMode ? 'product_card_compare_price' : undefined}
                  >
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
                <p
                  className={priceConfig.className || "font-bold text-xl text-gray-900"}
                  style={priceConfig.styles || {}}
                  data-slot-id={isEditorMode ? 'product_card_price' : undefined}
                >
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

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className={addToCartConfig.className || "w-full text-white border-0 hover:brightness-90 transition-all duration-200"}
              size="sm"
              style={{
                backgroundColor: settings?.theme?.add_to_cart_button_color || '#3B82F6',
                color: 'white',
                ...addToCartConfig.styles
              }}
              data-slot-id={isEditorMode ? 'product_card_add_to_cart' : undefined}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {addingToCart ? 'Adding...' : (addToCartConfig.content || 'Add to Cart')}
            </Button>

            {/* Stock status for list view */}
            {viewMode === 'list' && (
              <div className="mt-2">
                {(() => {
                  // Calculate stock status based on actual stock fields
                  const isInStock = product.infinite_stock || product.stock_quantity > 0;
                  return (
                    <span className={`text-xs px-2 py-1 rounded ${
                      isInStock
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {isInStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductItemCard;