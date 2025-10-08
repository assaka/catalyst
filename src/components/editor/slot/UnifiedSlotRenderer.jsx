/**
 * UnifiedSlotRenderer - Single renderer for both editor and storefront contexts
 *
 * Features:
 * - Type-based rendering: text, button, image, component, container, grid, flex
 * - Context-aware: knows whether it's in editor or storefront mode
 * - Component registration system for complex components
 * - Single source of truth for both editor and storefront
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResizeWrapper } from '@/components/ui/resize-element-wrapper';
import { SlotManager } from '@/utils/slotUtils';
import { filterSlotsByViewMode, sortSlotsByGridCoordinates } from '@/hooks/useSlotConfiguration';
// @deprecated - EditorInteractionWrapper is not used in UnifiedSlotRenderer (dead import, can be removed)
// import EditorInteractionWrapper from '@/components/editor/EditorInteractionWrapper';
import { GridColumn } from '@/components/editor/slot/SlotComponents';
import { processVariables, generateDemoData } from '@/utils/variableProcessor';
import { executeScript, executeHandler } from '@/utils/scriptHandler';
import { ComponentRegistry } from './SlotComponentRegistry';
import { createProductUrl } from '@/utils/urlUtils';
import cartService from '@/services/cartService';
import { headerConfig } from '@/components/editor/slot/configs/header-config';
import { CmsBlock } from '@/api/entities';
import { useStore } from '@/components/storefront/StoreProvider';

// Import component registry to ensure all components are registered
import '@/components/editor/slot/UnifiedSlotComponents';

// Re-export registry functions for backward compatibility
export { createSlotComponent, ComponentRegistry, registerSlotComponent } from './SlotComponentRegistry';

// CMS Block Slot Component
const CmsBlockSlot = ({ slot, context, className, styles }) => {
  const [cmsContent, setCmsContent] = useState('');
  const [loading, setLoading] = useState(true);
  const { store } = useStore();

  useEffect(() => {
    const loadCmsBlock = async () => {
      if (!slot.cmsBlockPosition || !store?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch CMS blocks for this store and placement
        const blocks = await CmsBlock.filter({
          store_id: store.id,
          placement: slot.cmsBlockPosition,
          is_active: true
        });

        if (blocks && blocks.length > 0) {
          // Use the first active block for this position
          setCmsContent(blocks[0].content || '');
        }
      } catch (error) {
        console.error('Error loading CMS block:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCmsBlock();
  }, [slot.cmsBlockPosition, store?.id]);

  if (loading) {
    return context === 'editor' ? (
      <div className={`${className} p-4 border-2 border-dashed border-gray-300 rounded`} style={styles}>
        <p className="text-gray-500 text-sm">Loading CMS block...</p>
      </div>
    ) : null;
  }

  if (!cmsContent) {
    return context === 'editor' ? (
      <div className={`${className} p-4 border-2 border-dashed border-gray-300 rounded`} style={styles}>
        <p className="text-gray-500 text-sm">CMS Block: {slot.cmsBlockPosition}</p>
        <p className="text-gray-400 text-xs mt-1">No content assigned</p>
      </div>
    ) : null;
  }

  return (
    <div
      className={className}
      style={styles}
      dangerouslySetInnerHTML={{ __html: cmsContent }}
    />
  );
};

// Text Slot with Script Support Component
const TextSlotWithScript = ({ slot, processedContent, processedClassName, context, productData, variableContext }) => {
  const { id, styles } = slot;
  const elementRef = useRef(null);
  const cleanupRef = useRef(null);

  // Execute script after render (only in storefront)
  useEffect(() => {
    if (context !== 'storefront' || !slot.script) {
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    const scriptContext = {
      element,
      slotData: slot,
      productData,
      variableContext
    };

    // Execute named handler if script is a string reference
    if (typeof slot.script === 'string' && !slot.script.includes('(')) {
      cleanupRef.current = executeHandler(slot.script, scriptContext);
    } else {
      // Execute raw JavaScript code
      cleanupRef.current = executeScript(slot.script, scriptContext);
    }

    // Cleanup on unmount
    return () => {
      if (typeof cleanupRef.current === 'function') {
        cleanupRef.current();
      }
    };
  }, [slot.script, context, productData, variableContext]);

  // Don't show placeholder for intentionally empty content (like conditional price displays)
  let textContent = processedContent;

  // Special handling for price-related slots
  const isPriceSlot = ['product_price', 'product_card_price', 'original_price', 'compare_price'].includes(slot.id);

  // Slots that should remain empty when there's no content (conditional slots)
  const conditionalSlots = ['product_labels', 'product_card_compare_price', 'compare_price'];

  // Check if slot has conditionalDisplay metadata
  const hasConditionalDisplay = slot.metadata?.conditionalDisplay;

  if (context === 'editor' && !processedContent) {
    if (isPriceSlot && !conditionalSlots.includes(slot.id)) {
      // Show example price in editor for main price slots only (not compare prices)
      if (slot.id === 'product_price' || slot.id === 'product_card_price') {
        textContent = '<span data-main-price class="main-price">$99.99</span>';
      } else if (slot.id === 'original_price') {
        textContent = '<span data-original-price class="original-price">$129.99</span>';
      }
    } else if (slot.id === 'product_labels') {
      // Show example labels in editor
      textContent = '<span class="inline-block bg-red-600 text-white text-xs px-2 py-1 rounded mr-2">Sale</span><span class="inline-block bg-red-600 text-white text-xs px-2 py-1 rounded mr-2">New</span>';
    }
    // For conditional slots or slots with conditionalDisplay, don't show any placeholder
  }

  // Skip rendering entirely if empty (no placeholder text)
  if (!textContent) {
    return null;
  }

  // Check if metadata specifies an HTML tag
  const HtmlTag = slot.metadata?.htmlTag || 'div';
  const htmlAttributes = slot.metadata?.htmlAttributes || {};

  // Merge className with htmlAttributes.class if both exist, and add whitespace-normal
  const { class: htmlClass, ...otherHtmlAttributes } = htmlAttributes;
  const mergedClassName = htmlClass
    ? `${processedClassName} ${htmlClass} whitespace-normal`.trim()
    : `${processedClassName} whitespace-normal`.trim();

  return React.createElement(
    HtmlTag,
    {
      ref: elementRef,
      className: mergedClassName,
      style: styles,
      dangerouslySetInnerHTML: { __html: textContent },
      ...otherHtmlAttributes
    }
  );
};

/**
 * UnifiedSlotRenderer - Handles both editor and storefront rendering
 */
export function UnifiedSlotRenderer({
  slots,
  parentId = null,
  viewMode = 'default', // Page/cart state (emptyCart, withProducts, etc.) - for slot visibility
  viewportMode = 'desktop', // Responsive viewport (desktop, tablet, mobile) - for colSpan calculation
  context = 'storefront', // 'editor' | 'storefront'
  productData = {},

  // Editor-specific props
  mode = 'edit',
  showBorders = false,
  currentDragInfo,
  setCurrentDragInfo,
  onElementClick,
  onGridResize,
  onSlotHeightResize,
  onSlotDrop,
  onSlotDelete,
  onResizeStart,
  onResizeEnd,
  selectedElementId = null,
  setPageConfig,
  saveConfiguration,

  // Additional contexts for different page types
  categoryData = null,
  cartData = null,
  headerContext = null,

  // Config for renderCondition support
  slotConfig = null
}) {
  // Get child slots for current parent
  let childSlots = SlotManager.getChildSlots(slots, parentId);

  // Filter slots by view mode
  const filteredSlots = filterSlotsByViewMode(childSlots, viewMode);

  // Apply renderCondition filtering from the static config (not runtime config)
  // This is necessary because functions can't be serialized to JSON
  const conditionFilteredSlots = filteredSlots.filter(slot => {
    // Check if this is a header slot by looking at the imported headerConfig
    const configSlot = headerConfig?.slots?.[slot.id];

    if (configSlot?.renderCondition && typeof configSlot.renderCondition === 'function') {
      // Use headerContext for header slots
      const contextToUse = headerContext || categoryData || cartData || {};
      const shouldRender = configSlot.renderCondition(contextToUse);
      return shouldRender;
    }

    // No renderCondition = always render
    return true;
  });

  // Sort slots by grid coordinates for proper rendering order
  const sortedSlots = sortSlotsByGridCoordinates(conditionFilteredSlots);

  // SIMPLIFIED: Use same data structure for both editor and storefront
  // Get filter option styles from slots for both editor and storefront
  const filterOptionStyles = slots?.filter_option_styles?.styles || {
    optionTextColor: '#374151',
    optionHoverColor: '#1F2937',
    optionCountColor: '#9CA3AF',
    checkboxColor: '#3B82F6',
    activeFilterBgColor: '#DBEAFE',
    activeFilterTextColor: '#1E40AF'
  };

  // Get attribute label styles (also used for Price label)
  const attributeLabelStyles = slots?.attribute_filter_label?.styles || {
    color: '#374151',
    fontSize: '1rem',
    fontWeight: '600'
  };

  // Get active filter styles
  const activeFilterStyles = slots?.active_filter_styles?.styles || {
    titleColor: '#374151',
    titleFontSize: '0.875rem',
    titleFontWeight: '600',
    backgroundColor: '#DBEAFE',
    textColor: '#1E40AF',
    clearAllColor: '#DC2626'
  };

  // Format products for category templates (same format as CategorySlotRenderer)
  const currencySymbol = categoryData?.settings?.currency_symbol || productData?.settings?.currency_symbol || '$';
  const formattedProducts = (categoryData?.products || []).map(product => {
    const price = parseFloat(product.price || 0);
    const comparePrice = parseFloat(product.compare_price || 0);
    const hasValidComparePrice = comparePrice > 0 && comparePrice !== price;

    const lowestPrice = hasValidComparePrice ? Math.min(price, comparePrice) : price;
    const highestPrice = hasValidComparePrice ? Math.max(price, comparePrice) : price;

    return {
      ...product,
      // Formatted prices for template
      price_formatted: hasValidComparePrice ? `${currencySymbol}${comparePrice.toFixed(2)}` : `${currencySymbol}${price.toFixed(2)}`,
      compare_price_formatted: hasValidComparePrice ? `${currencySymbol}${price.toFixed(2)}` : '',
      lowest_price_formatted: `${currencySymbol}${lowestPrice.toFixed(2)}`,
      highest_price_formatted: `${currencySymbol}${highestPrice.toFixed(2)}`,
      formatted_price: `${currencySymbol}${price.toFixed(2)}`,
      formatted_compare_price: hasValidComparePrice ? `${currencySymbol}${comparePrice.toFixed(2)}` : null,
      image_url: product.images?.[0] || product.image_url || product.image || '',
      url: product.url || '#',
      in_stock: product.infinite_stock || product.stock_quantity > 0,
      labels: []
    };
  });

  const variableContext = {
    product: productData.product || (context === 'editor' ? generateDemoData('product', {}).product : null),
    products: formattedProducts, // Use formatted products for category templates
    category: categoryData?.category || categoryData,
    cart: cartData,
    settings: productData.settings || categoryData?.settings || {},
    productLabels: productData.productLabels || categoryData?.productLabels,
    // Category-specific data
    filters: categoryData?.filters || {},
    filterOptionStyles: filterOptionStyles,
    attributeLabelStyles: attributeLabelStyles,
    activeFilterStyles: activeFilterStyles,
    filterableAttributes: categoryData?.filterableAttributes || [],
    pagination: categoryData?.pagination || {},
    // Demo active filters for editor
    activeFilters: context === 'editor' ? [
      { label: 'Brand', value: 'Nike', type: 'attribute', attributeCode: 'brand' },
      { label: 'Color', value: 'Blue', type: 'attribute', attributeCode: 'color' }
    ] : (categoryData?.activeFilters || [])
  };


  /**
   * Wrap element with ResizeWrapper for editor mode
   */
  const wrapWithResize = (element, slot, minWidth = 20, minHeight = 16) => {
    if (context !== 'editor' || mode !== 'edit') {
      return element;
    }

    const isDisabled = slot.metadata?.disableResize || false;

    return (
      <ResizeWrapper
        minWidth={minWidth}
        minHeight={minHeight}
        disabled={isDisabled}
        hideBorder={selectedElementId === slot.id}
        onResize={(newSize) => {
          if (!setPageConfig || !saveConfiguration) return;

          setPageConfig(prevConfig => {
            const updatedSlots = { ...prevConfig?.slots };

            // CRITICAL: Create slot if it doesn't exist (for template slots not yet in config)
            if (!updatedSlots[slot.id]) {
              updatedSlots[slot.id] = {
                id: slot.id,
                type: slot.type || 'text',
                content: slot.content || '',
                className: slot.className || '',
                styles: {},
                parentId: slot.parentId,
                metadata: {
                  ...(slot.metadata || {})
                }
              };
            }

            // Save width for all elements when user manually resizes
            const newStyles = {
              ...updatedSlots[slot.id].styles,
              width: `${newSize.width}${newSize.widthUnit || 'px'}`,
              height: newSize.height !== 'auto' ? `${newSize.height}${newSize.heightUnit || 'px'}` : 'auto'
            };

            updatedSlots[slot.id] = {
              ...updatedSlots[slot.id],
              styles: newStyles
            };

            const updatedConfig = { ...prevConfig, slots: updatedSlots };

            setTimeout(() => {
              saveConfiguration(updatedConfig);
            }, 500);

            return updatedConfig;
          });
        }}
      >
        {element}
      </ResizeWrapper>
    );
  };

  /**
   * Render basic slot content based on type
   */
  const renderBasicSlot = (slot) => {
    const { id, type, content, className, styles, metadata } = slot;

    // Process variables in content and className
    const processedContent = processVariables(content, variableContext);
    let processedClassName = processVariables(className, variableContext);

    // Handle viewport-aware responsive classes in editor mode
    // Convert Tailwind breakpoint classes (sm:, md:, lg:) to viewport-based visibility
    let shouldSkipDueToViewport = false;
    if (context === 'editor' && processedClassName) {
      // Handle md:hidden (hidden on medium screens and up - mobile/tablet show, desktop hide)
      if (processedClassName.includes('md:hidden')) {
        if (viewportMode === 'mobile') {
          // Remove md:hidden and make visible in mobile viewport
          processedClassName = processedClassName.replace(/\bmd:hidden\b/g, '').trim();
        } else {
          // In tablet/desktop viewport, skip rendering entirely
          shouldSkipDueToViewport = true;
        }
      }

      // sm:hidden means "hidden on small screens and up" (mobile should show, desktop should hide)
      if (processedClassName.includes('sm:hidden')) {
        if (viewportMode === 'mobile') {
          // Remove sm:hidden and make visible in mobile viewport
          processedClassName = processedClassName.replace(/\bsm:hidden\b/g, '').trim();
        } else {
          // In tablet/desktop viewport, skip rendering entirely
          shouldSkipDueToViewport = true;
        }
      }

      // hidden md:flex means "hidden on mobile, flex on medium screens and up"
      if (processedClassName.includes('hidden') && processedClassName.includes('md:flex')) {
        if (viewportMode === 'mobile') {
          // Skip rendering in mobile viewport
          shouldSkipDueToViewport = true;
        } else {
          // In tablet/desktop viewport, remove hidden and apply flex
          processedClassName = processedClassName.replace(/\bhidden\b/g, '').replace(/\bmd:flex\b/g, 'flex').trim();
        }
      }

      // hidden sm:flex means "hidden on mobile, flex on small screens and up"
      if (processedClassName.includes('hidden') && processedClassName.includes('sm:flex')) {
        if (viewportMode === 'mobile') {
          // Skip rendering in mobile viewport
          shouldSkipDueToViewport = true;
        } else {
          // In tablet/desktop viewport, remove hidden and apply flex
          processedClassName = processedClassName.replace(/\bhidden\b/g, '').replace(/\bsm:flex\b/g, 'flex').trim();
        }
      }

      // Clean up multiple spaces
      processedClassName = processedClassName.replace(/\s+/g, ' ').trim();
    }

    // Skip rendering if viewport doesn't match responsive classes
    if (shouldSkipDueToViewport) {
      return null;
    }

    // Process variables in styles (e.g., {{settings.theme.add_to_cart_button_color}})
    const processedStyles = {};
    if (styles) {
      Object.entries(styles).forEach(([key, value]) => {
        if (typeof value === 'string') {
          processedStyles[key] = processVariables(value, variableContext);
        } else {
          processedStyles[key] = value;
        }
      });
    }


    // HTML Element (raw HTML content)
    if (type === 'html') {
      // Skip rendering entirely if empty
      if (!processedContent) {
        return null;
      }

      // If context is storefront and slot has a script, use the script-enabled version
      if (context === 'storefront' && slot.script) {
        return (
          <TextSlotWithScript
            slot={slot}
            processedContent={processedContent}
            processedClassName={processedClassName}
            context={context}
            productData={productData}
            variableContext={variableContext}
          />
        );
      }

      const htmlElement = (
        <div
          className={processedClassName}
          style={processedStyles}
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      );
      // Don't wrap absolute positioned elements with ResizeWrapper as it interferes with positioning
      const isAbsolutePositioned = processedClassName?.includes('absolute') || processedStyles?.position === 'absolute';
      // Don't wrap gallery container to prevent width constraints
      const isGalleryContainer = id === 'product_gallery_container';
      if (context === 'editor' && !isAbsolutePositioned && !isGalleryContainer) {
        return wrapWithResize(htmlElement, slot, 20, 16);
      }
      return htmlElement;
    }

    // Text Element
    if (type === 'text') {

      if (context === 'editor' && mode === 'edit') {
        const hasWFit = className?.includes('w-fit');
        // Check if metadata specifies an HTML tag (h1, h2, p, etc.)
        const HtmlTag = metadata?.htmlTag || 'span';
        const htmlAttributes = metadata?.htmlAttributes || {};

        // Merge className with htmlAttributes.class if both exist, and add whitespace-normal
        const { class: htmlClass, ...otherHtmlAttributes } = htmlAttributes;
        const mergedClassName = htmlClass
          ? `${processedClassName} ${htmlClass} whitespace-normal`.trim()
          : `${processedClassName} whitespace-normal`.trim();

        // Remove width from styles for text elements - let them be fit-content
        const { width, ...stylesWithoutWidth } = processedStyles || {};

        // Check if slot is conditional (exact match or starts with pattern for instances)
        const conditionalSlotPatterns = ['product_labels', 'product_card_compare_price', 'compare_price'];
        // Skip rendering entirely if empty (no content at all)
        if (!processedContent) {
          return null;
        }

        const textElement = React.createElement(
          HtmlTag,
          {
            className: mergedClassName,
            style: {
              ...stylesWithoutWidth, // Use styles without width
              cursor: 'pointer',
              display: 'inline-block',
              width: 'fit-content' // Always fit-content for text
            },
            onClick: (e) => {
              e.stopPropagation();
              if (!currentDragInfo && onElementClick) {
                onElementClick(id, e.currentTarget);
              }
            },
            'data-slot-id': id,
            'data-editable': 'true',
            dangerouslySetInnerHTML: {
              __html: processedContent
            },
            ...otherHtmlAttributes
          }
        );
        return wrapWithResize(textElement, slot, 20, 16);
      } else {
        // Storefront mode - check if this is a product name that should link to product
        const isProductCardName = id === 'product_card_name' || id === 'product_name';
        const product = productData?.product || productData;
        const store = categoryData?.store || productData?.store;

        if (isProductCardName && product?.slug && store?.slug) {
          const productUrl = createProductUrl(store.slug, product.slug);
          const HtmlTag = metadata?.htmlTag || 'div';

          return (
            <Link to={productUrl} className="block">
              <HtmlTag
                className={processedClassName}
                style={processedStyles}
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />
            </Link>
          );
        }

        return (
          <TextSlotWithScript
            slot={slot}
            processedContent={processedContent}
            processedClassName={processedClassName}
            context={context}
            productData={productData}
            variableContext={variableContext}
          />
        );
      }
    }

    // Button Element
    if (type === 'button') {
      const buttonContent = processedContent || 'Button';

      // Check if button content contains HTML
      const isHtmlContent = buttonContent.includes('<') && buttonContent.includes('>');

      if (context === 'storefront') {
        // Storefront: Full functionality
        const handleButtonClick = async (e) => {
          e.preventDefault();
          e.stopPropagation();

          // Handle different button actions based on slot id
          if (id === 'product_card_add_to_cart' || id === 'add_to_cart_button' || id === 'product_add_to_cart') {
            // Add to cart logic
            const product = productData?.product || productData;
            const store = categoryData?.store || productData?.store;

            if (!product?.id || !store?.id) {
              console.error('Missing product or store data for add to cart');
              return;
            }

            try {
              const result = await cartService.addItem(
                product.id,
                1,
                product.price || 0,
                [],
                store.id
              );

              if (result.success !== false) {
                // Track add to cart event
                if (typeof window !== 'undefined' && window.catalyst?.trackAddToCart) {
                  window.catalyst.trackAddToCart(product, 1);
                }

                // Show success message
                window.dispatchEvent(new CustomEvent('showFlashMessage', {
                  detail: {
                    type: 'success',
                    message: `${product.name} added to cart successfully!`
                  }
                }));
              }
            } catch (error) {
              console.error('Failed to add to cart:', error);
              window.dispatchEvent(new CustomEvent('showFlashMessage', {
                detail: {
                  type: 'error',
                  message: `Failed to add to cart. Please try again.`
                }
              }));
            }
          } else if (id === 'wishlist_button') {
            productData.handleWishlistToggle?.();
          }
        };

        return (
          <Button
            className={processedClassName}
            style={processedStyles}
            onClick={handleButtonClick}
            disabled={id === 'add_to_cart_button' && !productData.canAddToCart}
          >
            {isHtmlContent ? (
              <span dangerouslySetInnerHTML={{ __html: buttonContent }} />
            ) : (
              buttonContent
            )}
          </Button>
        );
      } else {
        // Editor: Visual preview only
        const buttonElement = (
          <button
            className={processedClassName}
            style={processedStyles}
            data-slot-id={id}
            data-editable="true"
            onClick={(e) => {
              e.stopPropagation();
              if (onElementClick) {
                onElementClick(id, e.currentTarget);
              }
            }}
          >
            {isHtmlContent ? (
              <span dangerouslySetInnerHTML={{ __html: buttonContent }} />
            ) : (
              buttonContent
            )}
          </button>
        );
        return wrapWithResize(buttonElement, slot, 50, 20);
      }
    }

    // Image Element
    if (type === 'image') {
      let imageSrc = processedContent || content;

      // Handle product-specific images
      if (id === 'product_image' && productData.product) {
        imageSrc = getProductImageUrl(productData.product, productData.activeImageIndex || 0);
      }

      // Fallback image for empty, placeholder, or unprocessed template variables
      if (!imageSrc || imageSrc === 'product-main-image') {
        imageSrc = context === 'storefront' ?
          getProductImageUrl(productData.product) :
          'https://placehold.co/400x400?text=Product+Image';
      }
      // Check for unprocessed template variables in both editor and storefront
      else if (imageSrc.includes('{{') || imageSrc.includes('}}')) {
        imageSrc = context === 'storefront' ?
          getProductImageUrl(productData.product) :
          'https://placehold.co/400x400?text=Product+Image';
      }

      // Remove width from styles for images - let them be full width
      const { width, ...stylesWithoutWidth } = processedStyles || {};

      // Check if this is a product card image that should link to product
      const isProductCardImage = id === 'product_card_image' || id === 'product_image';
      const product = productData?.product || productData;
      const store = categoryData?.store || productData?.store;

      if (context === 'storefront' && isProductCardImage && product?.slug && store?.slug) {
        const productUrl = createProductUrl(store.slug, product.slug);

        return (
          <Link to={productUrl} className="block">
            <img
              src={imageSrc}
              alt={variableContext.product?.name || 'Image'}
              className={processedClassName}
              style={{ ...stylesWithoutWidth, width: '100%' }}
            />
          </Link>
        );
      }

      const imageElement = (
        <img
          src={imageSrc}
          alt={variableContext.product?.name || 'Image'}
          className={processedClassName}
          style={{ ...stylesWithoutWidth, width: '100%' }} // Force full width
        />
      );
      return wrapWithResize(imageElement, slot, 50, 50);
    }

    // CMS Block Element
    if (type === 'cms') {
      return <CmsBlockSlot slot={slot} context={context} className={processedClassName} styles={processedStyles} />;
    }

    // Container, Grid, Flex Elements
    if (type === 'container' || type === 'grid' || type === 'flex') {
      // Check if this container has any children
      const childSlots = SlotManager.getChildSlots(slots, id);
      const filteredChildren = filterSlotsByViewMode(childSlots, viewMode);

      // Skip rendering empty containers (no children)
      if (filteredChildren.length === 0) {
        return null;
      }

      // Use custom className from config if provided, otherwise use default
      let containerClass = '';

      if (processedClassName) {
        // If className is provided in config, use it as-is
        containerClass = processedClassName;
      } else {
        // Fallback to default classes if no className provided
        containerClass = type === 'grid' ? 'grid grid-cols-12 gap-2' :
                        type === 'flex' ? 'flex flex-wrap gap-2' : '';
      }

      return (
        <div className={containerClass} style={processedStyles}>
          <UnifiedSlotRenderer
            slots={slots}
            parentId={id}
            viewMode={viewMode}
            viewportMode={viewportMode}
            context={context}
            productData={productData}
            mode={mode}
            showBorders={showBorders}
            currentDragInfo={currentDragInfo}
            setCurrentDragInfo={setCurrentDragInfo}
            onElementClick={onElementClick}
            onGridResize={onGridResize}
            onSlotHeightResize={onSlotHeightResize}
            onSlotDrop={onSlotDrop}
            onSlotDelete={onSlotDelete}
            onResizeStart={onResizeStart}
            onResizeEnd={onResizeEnd}
            selectedElementId={selectedElementId}
            setPageConfig={setPageConfig}
            saveConfiguration={saveConfiguration}
            categoryData={categoryData}
            cartData={cartData}
            headerContext={headerContext}
          />
        </div>
      );
    }

    // Component Element
    if (type === 'component') {
      const componentName = slot.component || slot.metadata?.component;

      if (componentName && ComponentRegistry.has(componentName)) {
        const component = ComponentRegistry.get(componentName);

        // Use unified render method - backward compatibility removed
        const renderMethod = component.render;

        if (!renderMethod) {
          throw new Error(`Component ${componentName} must implement a unified 'render' method. Separate renderEditor/renderStorefront methods are no longer supported.`);
        }

        return renderMethod({
          slot,
          productContext: productData,
          categoryContext: categoryData,
          cartContext: cartData,
          headerContext: headerContext,
          context,
          className: processedClassName,
          styles: processedStyles,
          variableContext,
          allSlots: slots,
          onElementClick,
          setPageConfig,
          saveConfiguration,
          // Pass grid editing props for nested components
          onGridResize,
          onSlotDrop,
          onSlotDelete,
          onSlotHeightResize,
          onResizeStart,
          onResizeEnd,
          currentDragInfo,
          setCurrentDragInfo,
          selectedElementId,
          showBorders,
          mode,
          viewMode // Pass viewMode to components
        });
      }

      // Fallback for unregistered components
      return (
        <div className={processedClassName} style={processedStyles}>
          {componentName ? `[${componentName} component]` : '[Unknown component]'}
        </div>
      );
    }

    // Hide style_config slots - they don't render visually
    if (type === 'style_config') {
      return null;
    }

    // Default fallback
    return (
      <div className={processedClassName} style={processedStyles}>
        {processedContent || `[${type} slot]`}
      </div>
    );
  };

  /**
   * Wrap slot content with editor functionality if needed
   */
  const wrapSlotForEditor = (slot, slotContent, colSpanClass, gridColumn) => {
    // If slot content is null or undefined (e.g., empty slots, style_config slots), don't render anything
    if (slotContent === null || slotContent === undefined) {
      return null;
    }

    // Check if slotContent is an empty React element (false or empty string)
    if (slotContent === false || slotContent === '') {
      return null;
    }

    // Check if slot has absolute positioning - if so, return it directly without any wrapper
    const isAbsolutePositioned = slot.className?.includes('absolute') || slot.styles?.position === 'absolute';

    if (isAbsolutePositioned) {
      // For absolutely positioned elements, return directly without any grid wrapper
      return <React.Fragment key={slot.id}>{slotContent}</React.Fragment>;
    }

    // Check if colSpan is empty object and skip wrapper
    const isEmptyColSpan = typeof slot.colSpan === 'object' &&
                           slot.colSpan !== null &&
                           Object.keys(slot.colSpan).length === 0;

    if (isEmptyColSpan) {
      return <React.Fragment key={slot.id}>{slotContent}</React.Fragment>;
    }

    // Use same layout structure for both editor and storefront
    const processedParentClassName = processVariables(slot.parentClassName || '', variableContext);

    const layoutWrapper = (
      <div
        key={slot.id}
        className={`${colSpanClass} ${processedParentClassName}`}
        style={{
          ...(gridColumn ? { gridColumn } : {}),
          ...slot.containerStyles
        }}
      >
        {slotContent}
      </div>
    );

    // In editor, add editing functionality as overlay without changing layout
    if (context === 'editor') {

      // For normal elements, wrap with editor functionality
      let colSpanValue = 12;
      let useTailwindClass = false;

      if (typeof slot.colSpan === 'number') {
        colSpanValue = slot.colSpan;
      } else if (typeof slot.colSpan === 'string') {
        // Direct string colSpan like 'col-span-12 md:col-span-6'
        useTailwindClass = true;
        colSpanValue = 12;
      } else if (typeof slot.colSpan === 'object' && slot.colSpan !== null) {
        const viewModeValue = slot.colSpan[viewMode];
        if (typeof viewModeValue === 'number') {
          colSpanValue = viewModeValue;
        } else if (typeof viewModeValue === 'string') {
          useTailwindClass = true;
          colSpanValue = 12;
        } else {
          colSpanValue = 12;
        }
      }

      return (
        <GridColumn
          key={`${slot.id}-${viewportMode}`}
          colSpan={colSpanValue}
          colSpanClass={colSpanClass}
          useTailwindClass={useTailwindClass}
          rowSpan={1}
          height={slot.styles?.height}
          slotId={slot.id}
          slot={slot}
          onGridResize={onGridResize}
          onSlotHeightResize={onSlotHeightResize}
          onResizeStart={onResizeStart}
          onResizeEnd={onResizeEnd}
          onSlotDrop={onSlotDrop}
          onSlotDelete={onSlotDelete}
          onElementClick={onElementClick}
          mode={mode}
          viewMode={viewMode}
          showBorders={showBorders}
          currentDragInfo={currentDragInfo}
          setCurrentDragInfo={setCurrentDragInfo}
          selectedElementId={selectedElementId}
          slots={slots}
          isNested={parentId !== null}
          productData={productData}
          preserveLayout={true}
        >
          {layoutWrapper}
        </GridColumn>
      );
    }

    return layoutWrapper;
  };

  // Filter mobile search and menu based on state (storefront behavior)
  const finalSlots = sortedSlots.filter((slot) => {
    // Check if permanent mobile search is enabled from store settings
    const showPermanentMobile = headerContext?.settings?.show_permanent_search || false;

    // In storefront context, hide mobile_search_bar unless mobileSearchOpen OR showPermanentMobile
    if (context === 'storefront' && slot.id === 'mobile_search_bar' && !headerContext?.mobileSearchOpen && !showPermanentMobile) {
      return false;
    }
    // In storefront context, hide mobile_menu unless mobileMenuOpen
    if (context === 'storefront' && slot.id === 'mobile_menu' && !headerContext?.mobileMenuOpen) {
      return false;
    }
    return true;
  });

  return (
    <>
      {finalSlots.map((slot) => {
        // Handle colSpan configuration
        let colSpanClass = 'col-span-12';
        let gridColumn = 'span 12 / span 12';

        if (slot.colSpan === undefined || slot.colSpan === null) {
          // No colSpan defined - default to full width
          colSpanClass = 'col-span-12';
          gridColumn = 'span 12 / span 12';
        } else if (typeof slot.colSpan === 'number') {
          colSpanClass = `col-span-${slot.colSpan}`;
          gridColumn = `span ${slot.colSpan} / span ${slot.colSpan}`;
        } else if (typeof slot.colSpan === 'string') {
          // Handle responsive colSpan strings like 'col-span-12 md:col-span-6'
          colSpanClass = slot.colSpan;
          gridColumn = null;
        } else if (typeof slot.colSpan === 'object' && slot.colSpan !== null) {
          const viewModeValue = slot.colSpan[viewMode];

          if (typeof viewModeValue === 'number') {
            colSpanClass = `col-span-${viewModeValue}`;
            gridColumn = `span ${viewModeValue} / span ${viewModeValue}`;
          } else if (typeof viewModeValue === 'string') {
            colSpanClass = viewModeValue;
            gridColumn = null;
          }
        }

        // Render slot content
        const slotContent = renderBasicSlot(slot);

        // Skip rendering if slot content is null or undefined (empty slots)
        if (slotContent === null || slotContent === undefined) {
          return null;
        }

        // Wrap with appropriate container
        return wrapSlotForEditor(slot, slotContent, colSpanClass, gridColumn);
      })}
    </>
  );
}

/**
 * Helper function to get product image URL
 */
function getProductImageUrl(product, imageIndex = 0) {
  if (!product || !product.images || !product.images[imageIndex]) {
    return 'https://placehold.co/600x600?text=No+Image';
  }

  const image = product.images[imageIndex];

  if (typeof image === 'string') {
    return image;
  }

  if (typeof image === 'object' && image !== null) {
    const url = image.url || image.src || image.path || image.image_url || image.uri || image.file_url;
    if (typeof url === 'string') {
      return url;
    }
  }

  return 'https://placehold.co/600x600?text=No+Image';
}

export default UnifiedSlotRenderer;