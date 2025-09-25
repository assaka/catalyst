/**
 * UnifiedSlotRenderer - Single renderer for both editor and storefront contexts
 *
 * Features:
 * - Type-based rendering: text, button, image, component, container, grid, flex
 * - Context-aware: knows whether it's in editor or storefront mode
 * - Component registration system for complex components
 * - Single source of truth for both editor and storefront
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SlotManager } from '@/utils/slotUtils';
import { filterSlotsByViewMode, sortSlotsByGridCoordinates } from '@/hooks/useSlotConfiguration';
import EditorInteractionWrapper from '@/components/editor/EditorInteractionWrapper';
import { ResizeWrapper } from '@/components/ui/resize-element-wrapper';

// Import unified components to register them
import './UnifiedSlotComponents';

/**
 * Component Registry Interface
 * All slot components must implement this interface
 */
export const createSlotComponent = (config) => ({
  name: config.name,
  renderEditor: config.renderEditor || config.render,
  renderStorefront: config.renderStorefront || config.render,
  metadata: config.metadata || {}
});

/**
 * Default Component Registry
 * Components register themselves here for use in both contexts
 */
export const ComponentRegistry = new Map();

/**
 * Register a unified slot component
 */
export const registerSlotComponent = (name, component) => {
  ComponentRegistry.set(name, component);
};

/**
 * UnifiedSlotRenderer - Handles both editor and storefront rendering
 */
export function UnifiedSlotRenderer({
  slots,
  parentId = null,
  viewMode = 'default',
  context = 'storefront', // 'editor' | 'storefront'
  productContext = {},

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

  // Get child slots for current parent
  let childSlots = SlotManager.getChildSlots(slots, parentId);

  // Filter slots by view mode
  const filteredSlots = filterSlotsByViewMode(childSlots, viewMode);

  // Sort slots by grid coordinates for proper rendering order
  const sortedSlots = sortSlotsByGridCoordinates(filteredSlots);

  /**
   * Render basic slot content based on type
   */
  const renderBasicSlot = (slot) => {
    const { id, type, content, className, styles } = slot;

    // Text Element
    if (type === 'text') {
      const textContent = content || '[Text placeholder]';
      return (
        <div className={className} style={styles}>
          {context === 'storefront' ? (
            <span dangerouslySetInnerHTML={{ __html: textContent }} />
          ) : (
            <span>{textContent}</span>
          )}
        </div>
      );
    }

    // Button Element
    if (type === 'button') {
      const buttonContent = content || 'Button';

      if (context === 'storefront') {
        // Storefront: Full functionality
        return (
          <Button
            className={className}
            style={styles}
            onClick={() => {
              // Handle different button actions based on slot id or configuration
              if (id === 'add_to_cart_button') {
                productContext.handleAddToCart?.();
              } else if (id === 'wishlist_button') {
                productContext.handleWishlistToggle?.();
              }
              // Add more button handlers as needed
            }}
            disabled={id === 'add_to_cart_button' && !productContext.canAddToCart}
          >
            {buttonContent}
          </Button>
        );
      } else {
        // Editor: Visual preview only
        return (
          <button className={className} style={styles}>
            {buttonContent}
          </button>
        );
      }
    }

    // Image Element
    if (type === 'image') {
      let imageSrc = content;

      // Handle product-specific images
      if (id === 'product_image' && productContext.product) {
        imageSrc = getProductImageUrl(productContext.product, productContext.activeImageIndex || 0);
      }

      // Fallback image
      if (!imageSrc || imageSrc === 'product-main-image') {
        imageSrc = context === 'storefront' ?
          getProductImageUrl(productContext.product) :
          'https://placehold.co/400x400?text=Product+Image';
      }

      return (
        <img
          src={imageSrc}
          alt={productContext.product?.name || 'Image'}
          className={className}
          style={styles}
        />
      );
    }

    // Container, Grid, Flex Elements
    if (type === 'container' || type === 'grid' || type === 'flex') {
      const containerClass = type === 'grid' ? 'grid grid-cols-12 gap-2' :
                            type === 'flex' ? 'flex' : '';

      return (
        <div className={`${containerClass} ${className || ''}`} style={styles}>
          <UnifiedSlotRenderer
            slots={slots}
            parentId={id}
            viewMode={viewMode}
            context={context}
            productContext={productContext}
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
      const componentName = content || slot.metadata?.component;

      if (componentName && ComponentRegistry.has(componentName)) {
        const component = ComponentRegistry.get(componentName);

        // Choose appropriate render method based on context
        const renderMethod = context === 'editor' ? component.renderEditor : component.renderStorefront;

        return renderMethod({
          slot,
          productContext,
          categoryData,
          cartData,
          context,
          className,
          styles
        });
      }

      // Fallback for unregistered components
      return (
        <div className={className} style={styles}>
          {componentName ? `[${componentName} component]` : '[Unknown component]'}
        </div>
      );
    }

    // Default fallback
    return (
      <div className={className} style={styles}>
        {content || `[${type} slot]`}
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
      return (
        <div
          key={slot.id}
          className={colSpanClass}
          style={{
            ...(gridColumn ? { gridColumn } : {}),
            ...slot.containerStyles
          }}
        >
          {slotContent}
        </div>
      );
    }

    // Editor: Full editor wrapper with drag/drop, resize, etc.
    const isSelected = selectedElementId === slot.id;

    return (
      <div
        key={slot.id}
        className={colSpanClass}
        style={{
          ...(gridColumn ? { gridColumn } : {}),
          ...slot.containerStyles
        }}
      >
        <EditorInteractionWrapper
          slot={slot}
          mode={mode}
          showBorders={showBorders}
          currentDragInfo={currentDragInfo}
          setCurrentDragInfo={setCurrentDragInfo}
          onElementClick={onElementClick}
          onSlotDrop={onSlotDrop}
          onSlotDelete={onSlotDelete}
          isSelected={isSelected}
        >
          <ResizeWrapper
            slot={slot}
            mode={mode}
            onGridResize={onGridResize}
            onSlotHeightResize={onSlotHeightResize}
            onResizeStart={onResizeStart}
            onResizeEnd={onResizeEnd}
            setPageConfig={setPageConfig}
            saveConfiguration={saveConfiguration}
          >
            {slotContent}
          </ResizeWrapper>
        </EditorInteractionWrapper>
      </div>
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