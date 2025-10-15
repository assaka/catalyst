import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createProductUrl } from '@/utils/urlUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProductLabelComponent from '@/components/storefront/ProductLabel';
import { formatPriceWithTax, safeNumber, getPriceDisplay } from '@/utils/priceUtils';
import cartService from '@/services/cartService';
import { ShoppingCart } from 'lucide-react';
import { getPrimaryImageUrl } from '@/utils/imageUtils';
import { getStockLabel, getStockLabelStyle } from '@/utils/stockLabelUtils';
import { getProductName, getCurrentLanguage } from '@/utils/translationUtils';
import { useTranslation } from '@/contexts/TranslationContext';

/**
 * ProductItemCard - Reusable product card component
 * Can be used in ProductCard, CategorySlotRenderer, and other components
 */
const ProductItemCard = ({
  product,
  settings = {},
  store,
  productLabels = [],
  className = "",
  viewMode = 'grid',
  slotConfig = {},
  onAddToCartStateChange = null,
  isAddingToCart = false,
  isEditorMode = false,
  onElementClick = null
}) => {
  const { t } = useTranslation();

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
    productName: productNameSlot = {},
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

  // Get translated product name
  const translatedProductName = getProductName(product, getCurrentLanguage()) || product.name;

  // Merge configurations (card-specific takes precedence)
  const templateConfig = { ...productTemplate, ...product_card_template };
  const imageConfig = { ...productImage, ...product_card_image };
  const nameConfig = { ...productNameSlot, ...product_card_name };
  const priceConfig = { ...productPrice, ...product_card_price };
  const comparePriceConfig = { ...productComparePrice, ...product_card_compare_price };
  const addToCartConfig = { ...productAddToCart, ...product_card_add_to_cart };

  // Product label logic - unified across all components
  const renderProductLabels = () => {
    // Filter labels that match the product conditions
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
            const hasComparePrice = product.compare_price && safeNumber(product.compare_price) > 0;
            const pricesAreDifferent = hasComparePrice && safeNumber(product.compare_price) !== safeNumber(product.price);
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
              const matches = productAttributeValue === conditionValue;
              return matches;
            }
            return false;
          });
          if (!attributeMatch) {
            shouldShow = false;
          } else {
          }
        }
      } else {
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
            message: `${translatedProductName} ${t('common.added_to_cart', 'added to cart successfully!')}`
          }
        }));
      } else {
        console.error('❌ Failed to add to cart:', result.error);

        // Show error flash message
        window.dispatchEvent(new CustomEvent('showFlashMessage', {
          detail: {
            type: 'error',
            message: `${t('common.failed_to_add', 'Failed to add')} ${translatedProductName} ${t('common.to_cart', 'to cart')}. ${t('common.please_try_again', 'Please try again')}.`
          }
        }));
      }
    } catch (error) {
      console.error("❌ Failed to add to cart", error);

      // Show error flash message for catch block
      window.dispatchEvent(new CustomEvent('showFlashMessage', {
        detail: {
          type: 'error',
          message: `${t('common.error_adding', 'Error adding')} ${translatedProductName} ${t('common.to_cart', 'to cart')}. ${t('common.please_try_again', 'Please try again')}.`
        }
      }));
    } finally {
      // Always reset the loading state after 2 seconds to prevent permanent lock
      setTimeout(() => {
        setAddingToCart(false);
      }, 2000);
    }
  };

  // Handle slot clicks in editor mode
  const handleSlotClick = (e, slotId) => {
    if (isEditorMode && onElementClick) {
      e.preventDefault();
      e.stopPropagation();
      onElementClick(slotId, e.currentTarget);
    }
  };

  return (
    <Card
      className={templateConfig.className || `group overflow-hidden ${className} ${viewMode === 'list' ? 'flex' : ''}`}
      style={templateConfig.styles || {}}
      data-product-card={isEditorMode ? 'editable' : undefined}
      data-slot-id={isEditorMode ? 'product_card_template' : undefined}
      onClick={isEditorMode ? (e) => handleSlotClick(e, 'product_card_template') : undefined}
    >
      <CardContent className="p-0">
        <Link to={createProductUrl(store.slug, product.slug)} onClick={isEditorMode ? (e) => e.preventDefault() : undefined}>
          <div
            className={imageConfig.parentClassName || "relative"}
            data-slot-id={isEditorMode ? 'product_card_image' : undefined}
            onClick={isEditorMode ? (e) => handleSlotClick(e, 'product_card_image') : undefined}
          >
            <img
              src={getPrimaryImageUrl(product.images) || '/placeholder-product.jpg'}
              alt={translatedProductName}
              className={imageConfig.className || `w-full ${viewMode === 'list' ? 'h-32' : 'h-48'} object-cover transition-transform duration-300 group-hover:scale-105`}
              style={imageConfig.styles || {}}
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
            onClick={isEditorMode ? (e) => handleSlotClick(e, 'product_card_name') : undefined}
          >
            <Link to={createProductUrl(store.slug, product.slug)} onClick={isEditorMode ? (e) => e.preventDefault() : undefined}>{translatedProductName}</Link>
          </h3>

          {viewMode === 'list' && product.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="space-y-3 mt-4">
            {/* Stock label - uses centralized utility */}
            {(() => {
              const stockLabelInfo = getStockLabel(product, settings);
              const stockLabelStyle = getStockLabelStyle(product, settings);

              if (!stockLabelInfo) return null;

              return (
                <div className="mb-2">
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={stockLabelStyle}
                  >
                    {stockLabelInfo.text}
                  </span>
                </div>
              );
            })()}

            {/* Price display */}
            <div
              className="flex items-baseline gap-2"
              data-slot-id={isEditorMode ? 'product_card_price_container' : undefined}
              onClick={isEditorMode ? (e) => handleSlotClick(e, 'product_card_price_container') : undefined}
            >
              {(() => {
                const priceInfo = getPriceDisplay(product);

                if (priceInfo.hasComparePrice) {
                  return (
                    <>
                      <p
                        className={priceConfig.className || "font-bold text-red-600 text-xl"}
                        style={priceConfig.styles || {}}
                        data-slot-id={isEditorMode ? 'product_card_price' : undefined}
                        onClick={isEditorMode ? (e) => handleSlotClick(e, 'product_card_price') : undefined}
                      >
                        {settings?.hide_currency_product ? '' : formatPriceWithTax(priceInfo.displayPrice)}
                      </p>
                      <p
                        className={comparePriceConfig.className || "text-gray-500 line-through text-sm"}
                        style={comparePriceConfig.styles || {}}
                        data-slot-id={isEditorMode ? 'product_card_compare_price' : undefined}
                        onClick={isEditorMode ? (e) => handleSlotClick(e, 'product_card_compare_price') : undefined}
                      >
                        {settings?.hide_currency_product ? '' : formatPriceWithTax(priceInfo.originalPrice)}
                      </p>
                    </>
                  );
                }

                return (
                  <p
                    className={priceConfig.className || "font-bold text-xl text-gray-900"}
                    style={priceConfig.styles || {}}
                    data-slot-id={isEditorMode ? 'product_card_price' : undefined}
                    onClick={isEditorMode ? (e) => handleSlotClick(e, 'product_card_price') : undefined}
                  >
                    {settings?.hide_currency_product ? '' : formatPriceWithTax(priceInfo.displayPrice)}
                  </p>
                );
              })()}
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={isEditorMode ? (e) => handleSlotClick(e, 'product_card_add_to_cart') : handleAddToCart}
              disabled={addingToCart && !isEditorMode}
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
              {addingToCart ? t('common.adding', 'Adding...') : (addToCartConfig.content || t('product.add_to_cart', 'Add to Cart'))}
            </Button>

            {/* Stock status for list view */}
            {viewMode === 'list' && (() => {
              const stockLabelInfo = getStockLabel(product, settings);
              const stockLabelStyle = getStockLabelStyle(product, settings);

              if (!stockLabelInfo) return null;

              return (
                <div className="mt-2">
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={stockLabelStyle}
                  >
                    {stockLabelInfo.text}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductItemCard;