/**
 * UnifiedSlotRenderer - Single renderer for both editor and storefront contexts
 *
 * Features:
 * - Type-based rendering: text, button, image, component, container, grid, flex
 * - Context-aware: knows whether it's in editor or storefront mode
 * - Component registration system for complex components
 * - Single source of truth for both editor and storefront
 */

import React, { useEffect, useRef } from 'react';
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
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import { ComponentRegistry } from './SlotComponentRegistry';

// Import component registry to ensure all components are registered
import '@/components/editor/slot/UnifiedSlotComponents';

// Re-export registry functions for backward compatibility
export { createSlotComponent, ComponentRegistry, registerSlotComponent } from './SlotComponentRegistry';

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
  const isPriceSlot = ['product_price', 'original_price', 'compare_price'].includes(slot.id);

  // Slots that should remain empty when there's no content (conditional slots)
  const conditionalSlots = ['product_labels'];

  if (context === 'editor' && !processedContent) {
    if (isPriceSlot) {
      // Show example price in editor for price slots
      if (slot.id === 'product_price') {
        textContent = '<span data-main-price class="main-price">$99.99</span>';
      } else if (slot.id === 'original_price') {
        textContent = '<span data-original-price class="original-price">$129.99</span>';
      }
    } else if (slot.id === 'product_labels') {
      // Show example labels in editor
      textContent = '<span class="inline-block bg-red-600 text-white text-xs px-2 py-1 rounded mr-2">Sale</span><span class="inline-block bg-red-600 text-white text-xs px-2 py-1 rounded mr-2">New</span>';
    } else {
      textContent = '[Text placeholder]';
    }
  } else if (!processedContent && !conditionalSlots.includes(slot.id)) {
    textContent = '[Text placeholder]';
  }

  // Check if metadata specifies an HTML tag
  const HtmlTag = slot.metadata?.htmlTag || 'div';
  const htmlAttributes = slot.metadata?.htmlAttributes || {};

  // Merge className with htmlAttributes.class if both exist
  const { class: htmlClass, ...otherHtmlAttributes } = htmlAttributes;
  const mergedClassName = htmlClass
    ? `${processedClassName} ${htmlClass}`.trim()
    : processedClassName;

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
  headerContext = null
}) {
  // Get child slots for current parent
  let childSlots = SlotManager.getChildSlots(slots, parentId);

  // Filter slots by view mode
  const filteredSlots = filterSlotsByViewMode(childSlots, viewMode);


  // Sort slots by grid coordinates for proper rendering order
  const sortedSlots = sortSlotsByGridCoordinates(filteredSlots);

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

    // Debug logging for product card slots
    if (slot.id?.includes('product_') && context === 'editor') {
      console.log(`🔧 ResizeWrapper for ${slot.id}:`, {
        isDisabled,
        disableResize: slot.metadata?.disableResize,
        metadata: slot.metadata,
        hasSetPageConfig: !!setPageConfig,
        hasSaveConfiguration: !!saveConfiguration,
        minWidth,
        minHeight
      });
    }

    return (
      <ResizeWrapper
        minWidth={minWidth}
        minHeight={minHeight}
        disabled={isDisabled}
        hideBorder={selectedElementId === slot.id}
        onResize={(newSize) => {
          if (!setPageConfig || !saveConfiguration) return;

          console.log(`📐 Resize: ${slot.id}`, {
            width: `${newSize.width}${newSize.widthUnit || 'px'}`,
            height: newSize.height !== 'auto' ? `${newSize.height}${newSize.heightUnit || 'px'}` : 'auto'
          });

          setPageConfig(prevConfig => {
            const updatedSlots = { ...prevConfig?.slots };

            // CRITICAL: Create slot if it doesn't exist (for template slots not yet in config)
            if (!updatedSlots[slot.id]) {
              console.log(`🆕 Creating new slot for resize: ${slot.id}`);
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

    if (id === 'product_sku') {
      console.log('renderBasicSlot - product_sku:', { type, className, content: content?.substring(0, 50) });
    }

    // Process variables in content and className
    const processedContent = processVariables(content, variableContext);
    const processedClassName = processVariables(className, variableContext);


    // HTML Element (raw HTML content)
    if (type === 'html') {
      const htmlElement = (
        <div
          className={processedClassName}
          style={styles}
          dangerouslySetInnerHTML={{ __html: processedContent || '[HTML placeholder]' }}
        />
      );
      // Don't wrap absolute positioned elements with ResizeWrapper as it interferes with positioning
      const isAbsolutePositioned = processedClassName?.includes('absolute') || styles?.position === 'absolute';
      // Don't wrap gallery container to prevent width constraints
      const isGalleryContainer = id === 'product_gallery_container';
      if (context === 'editor' && !isAbsolutePositioned && !isGalleryContainer) {
        return wrapWithResize(htmlElement, slot, 20, 16);
      }
      return htmlElement;
    }

    // Text Element
    if (type === 'text') {
      if (id === 'product_sku') {
        console.log('SKU rendering:', {
          context,
          className,
          processedClassName,
          content: content?.substring(0, 50),
          processedContent: processedContent?.substring(0, 100),
          metadata,
          variableContext: variableContext?.product?.sku
        });
      }

      if (context === 'editor' && mode === 'edit') {
        const hasWFit = className?.includes('w-fit');
        // Check if metadata specifies an HTML tag (h1, h2, p, etc.)
        const HtmlTag = metadata?.htmlTag || 'span';
        const htmlAttributes = metadata?.htmlAttributes || {};

        // Merge className with htmlAttributes.class if both exist
        const { class: htmlClass, ...otherHtmlAttributes } = htmlAttributes;
        const mergedClassName = htmlClass
          ? `${processedClassName} ${htmlClass}`.trim()
          : processedClassName;

        const textElement = React.createElement(
          HtmlTag,
          {
            className: mergedClassName,
            style: {
              ...styles,
              cursor: 'pointer',
              display: 'inline-block',
              width: hasWFit ? 'fit-content' : (styles?.width || 'auto')
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
              __html: processedContent || '[Text placeholder]'
            },
            ...otherHtmlAttributes
          }
        );
        return wrapWithResize(textElement, slot, 20, 16);
      } else {
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
        return (
          <Button
            className={processedClassName}
            style={styles}
            onClick={() => {
              // Handle different button actions based on slot id or configuration
              if (id === 'add_to_cart_button') {
                productData.handleAddToCart?.();
              } else if (id === 'wishlist_button') {
                productData.handleWishlistToggle?.();
              }
              // Add more button handlers as needed
            }}
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
            style={styles}
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

      // Fallback image
      if (!imageSrc || imageSrc === 'product-main-image') {
        imageSrc = context === 'storefront' ?
          getProductImageUrl(productData.product) :
          'https://placehold.co/400x400?text=Product+Image';
      }

      const imageElement = (
        <img
          src={imageSrc}
          alt={variableContext.product?.name || 'Image'}
          className={processedClassName}
          style={styles}
        />
      );
      return wrapWithResize(imageElement, slot, 50, 50);
    }

    // Container, Grid, Flex Elements
    if (type === 'container' || type === 'grid' || type === 'flex') {
      // Use custom className from config if provided, otherwise use default
      let containerClass = '';

      if (processedClassName) {
        // If className is provided in config, use it as-is
        containerClass = processedClassName;
      } else {
        // Fallback to default classes if no className provided
        containerClass = type === 'grid' ? 'grid grid-cols-12 gap-2' :
                        type === 'flex' ? 'flex' : '';
      }

      return (
        <div className={containerClass} style={styles}>
          <UnifiedSlotRenderer
            slots={slots}
            parentId={id}
            viewMode={viewMode}
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


      // Special handling for CmsBlockRenderer
      if (componentName === 'CmsBlockRenderer') {
        const position = slot.metadata?.props?.position || 'default';


        return (
          <div className={processedClassName} style={styles}>
            <CmsBlockRenderer position={position} />
          </div>
        );
      }

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
          styles,
          variableContext,
          allSlots: slots,
          onElementClick,
          setPageConfig,
          saveConfiguration
        });
      }

      // Fallback for unregistered components
      return (
        <div className={processedClassName} style={styles}>
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
      <div className={processedClassName} style={styles}>
        {processedContent || `[${type} slot]`}
      </div>
    );
  };

  /**
   * Wrap slot content with editor functionality if needed
   */
  const wrapSlotForEditor = (slot, slotContent, colSpanClass, gridColumn) => {
    // If slot content is null (e.g., style_config slots), don't render anything
    if (slotContent === null) {
      return null;
    }

    // Check if slot has absolute positioning - if so, return it directly without any wrapper
    const isAbsolutePositioned = slot.className?.includes('absolute') || slot.styles?.position === 'absolute';

    // Debug product labels wrapper
    if (slot.id === 'product_labels') {
      console.log('🏷️ PRODUCT LABELS WRAPPER:', {
        slotId: slot.id,
        className: slot.className,
        styles: slot.styles,
        isAbsolutePositioned,
        context,
        willSkipWrapper: isAbsolutePositioned
      });
    }

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

  return (
    <>
      {sortedSlots.map((slot) => {
        // Handle colSpan configuration
        let colSpanClass = 'col-span-12';
        let gridColumn = 'span 12 / span 12';

        if (typeof slot.colSpan === 'number') {
          colSpanClass = `col-span-${slot.colSpan}`;
          gridColumn = `span ${slot.colSpan} / span ${slot.colSpan}`;
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