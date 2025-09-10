/**
 * Generic Slot Rendering Utilities
 * Extracted from CartSlotsEditor.jsx to be reusable across all page editors
 */

import React from 'react';
import SimpleInlineEdit from '@/components/editor/slot/SimpleInlineEdit';

/**
 * Generic function to render parent slots with their micro-slots
 */
export function renderParentSlot({
  slotId,
  slotName,
  microSlotOrder = [],
  microSlotDefinitions,
  microSlotSpans,
  slotContent,
  customSlots,
  elementClasses,
  elementStyles,
  componentSizes,
  mode = 'edit',
  onEdit,
  onDelete,
  onMicroSlotReorder,
  onTextChange,
  onClassChange,
  onSizeChange,
  onSpanChange,
  MicroSlotComponent,
  ParentSlotComponent,
  renderMicroSlotContent
}) {
  const microSlots = microSlotOrder || microSlotDefinitions[slotId]?.microSlots || [];
  const spans = microSlotSpans[slotId] || microSlotDefinitions[slotId]?.defaultSpans || {};

  return (
    <ParentSlotComponent
      key={slotId}
      id={slotId}
      name={slotName || microSlotDefinitions[slotId]?.name || slotId}
      microSlotOrder={microSlots}
      onMicroSlotReorder={onMicroSlotReorder}
      onEdit={onEdit}
      mode={mode}
      elementClasses={elementClasses}
      elementStyles={elementStyles}
      gridCols={microSlotDefinitions[slotId]?.gridCols || 12}
    >
      {microSlots.map(microSlotId => {
        const fullSlotId = `${slotId}.${microSlotId}`;
        const slotSpan = spans[fullSlotId] || { col: 12, row: 1 };
        const customSlot = customSlots[fullSlotId];
        const isCustomSlot = microSlotId.startsWith('custom_');

        return (
          <MicroSlotComponent
            key={fullSlotId}
            id={fullSlotId}
            colSpan={slotSpan.col}
            rowSpan={slotSpan.row}
            isDraggable={true}
            mode={mode}
            onEdit={onEdit}
            onDelete={isCustomSlot ? onDelete : undefined}
            onSpanChange={onSpanChange}
            elementClasses={elementClasses}
            elementStyles={elementStyles}
            componentSizes={componentSizes}
            onSizeChange={onSizeChange}
            microSlotSpans={microSlotSpans}
          >
            {renderMicroSlotContent ? renderMicroSlotContent({
              slotId: fullSlotId,
              microSlotId,
              content: slotContent[fullSlotId] || customSlot?.content || '',
              customSlot,
              mode,
              onTextChange,
              onClassChange,
              onSizeChange,
              componentSizes,
              elementClasses,
              elementStyles
            }) : (
              <div className="text-gray-400 text-sm p-2">
                {slotContent[fullSlotId] || customSlot?.content || `Slot: ${microSlotId}`}
              </div>
            )}
          </MicroSlotComponent>
        );
      })}
    </ParentSlotComponent>
  );
}

/**
 * Generic function to render micro-slot content with inline editing
 */
export function renderInlineEditableContent({
  slotId,
  content = '',
  mode = 'edit',
  onTextChange,
  onClassChange,
  elementClasses = {},
  className = '',
  placeholder = 'Click to edit...'
}) {
  const currentClasses = elementClasses[slotId] || className;

  return (
    <SimpleInlineEdit
      text={content}
      className={currentClasses}
      onChange={(newText) => onTextChange && onTextChange(slotId, newText)}
      slotId={slotId}
      onClassChange={onClassChange}
      mode={mode}
    />
  );
}

/**
 * Generic function to render resizable components (icons, buttons)
 */
export function renderResizableComponent({
  slotId,
  content,
  componentSizes = {},
  onSizeChange,
  mode = 'edit',
  minSize = 16,
  maxSize = 256,
  step = 4,
  className = '',
  style = {}
}) {
  const currentSize = componentSizes[slotId] || 24;
  
  const handleMouseDown = (e) => {
    if (mode !== 'edit') return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = currentSize;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const delta = Math.max(deltaX, deltaY);
      const newSize = Math.min(maxSize, Math.max(minSize, startSize + delta));
      
      if (onSizeChange) {
        onSizeChange(slotId, newSize);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`inline-block ${mode === 'edit' ? 'cursor-nw-resize' : ''} ${className}`}
      style={{
        width: `${currentSize}px`,
        height: `${currentSize}px`,
        ...style
      }}
      onMouseDown={handleMouseDown}
      title={mode === 'edit' ? 'Click and drag to resize' : ''}
    >
      {content}
    </div>
  );
}

/**
 * Generic function to render styled content with class management
 */
export function renderStyledContent({
  slotId,
  content,
  elementStyles = {},
  elementClasses = {},
  defaultClassName = '',
  mode = 'edit',
  tag: Tag = 'div'
}) {
  const styles = elementStyles[slotId] || {};
  const classes = elementClasses[slotId] || defaultClassName;

  // Convert styles object to inline style string for HTML content
  const styleStr = Object.entries(styles)
    .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
    .join('; ');

  // If content contains HTML, render it safely
  if (content && (content.includes('<') || content.includes('&'))) {
    // For HTML content, apply styles through style attribute
    const styledContent = styleStr 
      ? content.replace(/style="[^"]*"/, `style="${styleStr}"`) || content.replace(/^(<[^>]+)/, `$1 style="${styleStr}"`)
      : content;

    return (
      <Tag
        className={classes}
        dangerouslySetInnerHTML={{ __html: styledContent }}
      />
    );
  }

  // For plain text content
  return (
    <Tag
      className={classes}
      style={styles}
    >
      {content}
    </Tag>
  );
}

/**
 * Generic function to render slot content with mode switching
 */
export function renderSlotContent({
  slotId,
  content = '',
  mode = 'edit',
  onTextChange,
  onClassChange,
  elementClasses = {},
  elementStyles = {},
  componentSizes = {},
  onSizeChange,
  customSlot = null,
  isResizable = false,
  defaultClassName = '',
  placeholder = 'Click to edit...'
}) {
  // Handle custom slots
  if (customSlot) {
    const customContent = customSlot.content || content;
    
    if (customSlot.type === 'component' || customSlot.type === 'html') {
      return renderStyledContent({
        slotId,
        content: customContent,
        elementStyles,
        elementClasses,
        defaultClassName,
        mode
      });
    }
  }

  // Handle resizable components
  if (isResizable && (componentSizes[slotId] || onSizeChange)) {
    return renderResizableComponent({
      slotId,
      content: renderStyledContent({
        slotId,
        content,
        elementStyles,
        elementClasses,
        defaultClassName,
        mode,
        tag: 'span'
      }),
      componentSizes,
      onSizeChange,
      mode
    });
  }

  // Handle regular editable content
  if (mode === 'edit' && onTextChange) {
    return renderInlineEditableContent({
      slotId,
      content,
      mode,
      onTextChange,
      onClassChange,
      elementClasses,
      className: defaultClassName,
      placeholder
    });
  }

  // Handle static content (preview mode)
  return renderStyledContent({
    slotId,
    content,
    elementStyles,
    elementClasses,
    defaultClassName,
    mode
  });
}

/**
 * Generate slot content with fallback values
 */
export function generateSlotContentWithDefaults({
  slotId,
  slotContent,
  slotTemplates = {},
  customSlots = {},
  fallback = ''
}) {
  // Try custom slot content first
  const customSlot = customSlots[slotId];
  if (customSlot?.content) {
    return customSlot.content;
  }

  // Try slot content
  if (slotContent[slotId] !== undefined) {
    return slotContent[slotId];
  }

  // Try templates
  if (slotTemplates[slotId]) {
    return slotTemplates[slotId];
  }

  // Use fallback
  return fallback || `Slot: ${slotId.split('.').pop()}`;
}

/**
 * Generic function to create view mode renderers
 */
export function createViewModeRenderer({
  pageType = 'generic',
  microSlotDefinitions,
  slotTemplates = {}
}) {
  return function renderViewMode({
    viewMode,
    majorSlots,
    microSlotOrders,
    microSlotSpans,
    slotContent,
    customSlots,
    elementClasses,
    elementStyles,
    componentSizes,
    mode = 'edit',
    onEdit,
    onDelete,
    onMicroSlotReorder,
    onTextChange,
    onClassChange,
    onSizeChange,
    onSpanChange,
    MicroSlotComponent,
    ParentSlotComponent
  }) {
    // Filter major slots based on view mode
    const slotsToRender = majorSlots.filter(slotId => {
      // Add view mode specific filtering logic here
      if (viewMode === 'empty' && slotId === 'cartItem') return false;
      if (viewMode === 'withProducts' && slotId === 'emptyCart') return false;
      return true;
    });

    return slotsToRender.map(slotId => {
      return renderParentSlot({
        slotId,
        slotName: microSlotDefinitions[slotId]?.name || slotId,
        microSlotOrder: microSlotOrders[slotId],
        microSlotDefinitions,
        microSlotSpans,
        slotContent,
        customSlots,
        elementClasses,
        elementStyles,
        componentSizes,
        mode,
        onEdit,
        onDelete,
        onMicroSlotReorder,
        onTextChange,
        onClassChange,
        onSizeChange,
        onSpanChange,
        MicroSlotComponent,
        ParentSlotComponent,
        renderMicroSlotContent: ({ slotId: fullSlotId, microSlotId, content, customSlot, mode: renderMode }) => {
          return renderSlotContent({
            slotId: fullSlotId,
            content: content || generateSlotContentWithDefaults({
              slotId: fullSlotId,
              slotContent,
              slotTemplates,
              customSlots,
              fallback: `${pageType} ${microSlotId}`
            }),
            mode: renderMode,
            onTextChange,
            onClassChange,
            elementClasses,
            elementStyles,
            componentSizes,
            onSizeChange,
            customSlot,
            isResizable: ['icon', 'button', 'image'].some(type => 
              microSlotId.toLowerCase().includes(type)
            )
          });
        }
      });
    });
  };
}