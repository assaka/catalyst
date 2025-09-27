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
import { SlotManager } from '@/utils/slotUtils';
import { filterSlotsByViewMode, sortSlotsByGridCoordinates } from '@/hooks/useSlotConfiguration';
import EditorInteractionWrapper from '@/components/editor/EditorInteractionWrapper';
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

  return (
    <div ref={elementRef} className={processedClassName} style={styles}>
      <span dangerouslySetInnerHTML={{ __html: textContent }} />
    </div>
  );
};

/**
 * UnifiedSlotRenderer - Handles both editor and storefront rendering
 */
export function UnifiedSlotRenderer({
  slots,
  parentId = null,
  viewMode = 'default',
  context = 'storefront', // 'editor' | 'storefront'
  productData = {},

  // Editor-specific props
  mode = 'view',
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
  cartData = null
}) {
  console.log('🚀 UNIFIED SLOT RENDERER CALLED!', { parentId, viewMode, context, totalSlots: Object.keys(slots || {}).length });

  // Get child slots for current parent
  let childSlots = SlotManager.getChildSlots(slots, parentId);

  // Debug logging for important parent containers
  if (parentId === null || parentId === 'page_header' || parentId === 'filters_container' || parentId === 'products_container' || parentId === 'sorting_controls') {
    console.log(`🔎 UNIFIED SLOT RENDERER - parentId: ${parentId}`, {
      totalSlots: Object.keys(slots || {}).length,
      childSlots: childSlots.map(s => ({ id: s.id, type: s.type, viewMode: s.viewMode })),
      parentId: parentId,
      viewMode: viewMode,
      context: context
    });
  }

  // Filter slots by view mode
  const filteredSlots = filterSlotsByViewMode(childSlots, viewMode);

  // Sort slots by grid coordinates for proper rendering order
  const sortedSlots = sortSlotsByGridCoordinates(filteredSlots);

  // Prepare context for variable processing (shared by all rendering functions)
  const variableContext = context === 'editor' ?
    generateDemoData('product', productData.settings || {}) :
    {
      product: productData.product,
      category: categoryData,
      cart: cartData,
      settings: productData.settings
    };

  /**
   * Render basic slot content based on type
   */
  const renderBasicSlot = (slot) => {
    const { id, type, content, className, styles } = slot;

    // Check if this is a price-related slot
    const isPriceSlot = ['product_price', 'original_price', 'compare_price'].includes(id);

    // Process variables in content and className
    const processedContent = processVariables(content, variableContext);
    const processedClassName = processVariables(className, variableContext);

    // Debug log for text slots and gallery slots
    if (type === 'text' && context === 'editor') {
      console.log('📋 RENDER TEXT SLOT:', {
        slotId: id,
        originalClassName: className,
        processedClassName: processedClassName,
        styles: styles
      });
    }

    // Debug log for gallery-related slots
    if ((id === 'thumbnail_gallery' || id === 'gallery_container' || id === 'main_image') && context === 'editor') {
      console.log('🖼️ RENDER GALLERY SLOT:', {
        slotId: id,
        type: type,
        originalClassName: className,
        processedClassName: processedClassName,
        styles: styles
      });
    }

    // Text Element
    if (type === 'text') {
      return <TextSlotWithScript
        slot={slot}
        processedContent={processedContent}
        processedClassName={processedClassName}
        context={context}
        productData={productData}
        variableContext={variableContext}
      />;
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
        return (
          <button className={processedClassName} style={styles}>
            {isHtmlContent ? (
              <span dangerouslySetInnerHTML={{ __html: buttonContent }} />
            ) : (
              buttonContent
            )}
          </button>
        );
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

      return (
        <img
          src={imageSrc}
          alt={variableContext.product?.name || 'Image'}
          className={processedClassName}
          style={styles}
        />
      );
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
          />
        </div>
      );
    }

    // Component Element
    if (type === 'component') {
      const componentName = processedContent || content || slot.component || slot.metadata?.component;


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

        // Choose appropriate render method based on context
        const renderMethod = context === 'editor' ? component.renderEditor : component.renderStorefront;

        return renderMethod({
          slot,
          productContext: productData,
          categoryContext: categoryData,
          cartContext: cartData,
          context,
          className: processedClassName,
          styles,
          variableContext
        });
      }

      // Fallback for unregistered components
      return (
        <div className={processedClassName} style={styles}>
          {componentName ? `[${componentName} component]` : '[Unknown component]'}
        </div>
      );
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
    if (context !== 'editor') {
      // Storefront: Check if colSpan is empty object and skip wrapper
      const isEmptyColSpan = typeof slot.colSpan === 'object' &&
                             slot.colSpan !== null &&
                             Object.keys(slot.colSpan).length === 0;

      if (isEmptyColSpan) {
        return <React.Fragment key={slot.id}>{slotContent}</React.Fragment>;
      }

      // Normal wrapper for storefront
      const processedParentClassName = processVariables(slot.parentClassName || '', variableContext);

      return (
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
    }

    // Editor: Use GridColumn for full functionality
    const colSpanValue = typeof slot.colSpan === 'number' ? slot.colSpan :
      (typeof slot.colSpan === 'object' && slot.colSpan !== null) ?
        (slot.colSpan[viewMode] || 12) : 12;

    return (
      <GridColumn
        key={slot.id}
        colSpan={colSpanValue}
        colSpanClass={colSpanClass}
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
      >
        {slotContent}
      </GridColumn>
    );
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