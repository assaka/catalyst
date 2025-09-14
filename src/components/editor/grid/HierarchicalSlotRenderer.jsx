import React from 'react';
import { Image } from 'lucide-react';
import { ResizeWrapper } from '@/components/ui/resize-element-wrapper';
import { SlotManager } from '@/utils/slotUtils';
import GridColumn from './GridColumn';
import EditableElement from './EditableElement';

const HierarchicalSlotRenderer = ({
  slots,
  parentId = null,
  mode,
  viewMode = 'empty',
  showBorders = true,
  currentDragInfo,
  setCurrentDragInfo,
  onElementClick,
  onGridResize,
  onSlotHeightResize,
  onSlotDrop,
  onResizeStart,
  onResizeEnd,
  selectedElementId = null,
  onSlotStyleUpdate // Generic callback for updating slot styles
}) => {
  const childSlots = SlotManager.getChildSlots(slots, parentId);

  // Filter slots based on their viewMode property from config
  const filteredSlots = childSlots.filter(slot => {
    // If slot doesn't have viewMode defined, show it always
    if (!slot.viewMode || !Array.isArray(slot.viewMode) || slot.viewMode.length === 0) {
      return true;
    }

    // Show slot only if current viewMode is in its viewMode array
    const shouldShow = slot.viewMode.includes(viewMode);
    return shouldShow;
  });

  return filteredSlots.map(slot => {
    // Calculate dynamic colSpan based on viewMode for specific slots
    let colSpan = slot.colSpan || 12;

    const rowSpan = slot.rowSpan || 1;
    const height = slot.styles?.minHeight ? parseInt(slot.styles.minHeight) : undefined;

    return (
      <GridColumn
        key={slot.id}
        colSpan={colSpan}
        rowSpan={rowSpan}
        height={height}
        slotId={slot.id}
        slot={slot}
        currentDragInfo={currentDragInfo}
        setCurrentDragInfo={setCurrentDragInfo}
        onGridResize={onGridResize}
        onSlotHeightResize={onSlotHeightResize}
        onSlotDrop={onSlotDrop}
        onResizeStart={onResizeStart}
        onResizeEnd={onResizeEnd}
        mode={mode}
        showBorders={showBorders}
      >
        <div className={slot.parentClassName || ''}>
          {/* Text rendering with ResizeWrapper for corner handle resizing */}
          {slot.type === 'text' && (
            <>
              {mode === 'edit' ? (
                <ResizeWrapper
                  minWidth={20}
                  minHeight={16}
                >
                  <div
                    className="w-full h-full flex items-start"
                  >
                    <span
                      className={slot.className}
                      style={{
                        ...slot.styles,  // Apply all styles (including colors) to the span element
                        cursor: 'pointer',
                        // Ensure italic is applied as inline style if class includes 'italic'
                        ...(slot.className?.includes('italic') && { fontStyle: 'italic' }),
                        // Make text fill the resized container
                        display: 'inline-block',
                        width: '100%'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onElementClick(slot.id, e.currentTarget);
                      }}
                      data-slot-id={slot.id}
                      data-editable="true"
                      dangerouslySetInnerHTML={{
                        __html: String(slot.content || `Text: ${slot.id}`)
                      }}
                    />
                  </div>
                </ResizeWrapper>
              ) : (
                <span
                  className={slot.className}
                  style={{
                    ...slot.styles,
                    // Ensure italic is applied as inline style if class includes 'italic'
                    ...(slot.className?.includes('italic') && { fontStyle: 'italic' })
                  }}
                  dangerouslySetInnerHTML={{
                    __html: String(slot.content || `Text: ${slot.id}`)
                  }}
                />
              )}
            </>
          )}

          {/* Use EditableElement for other types that need the full wrapper structure */}
          {slot.type !== 'text' && (
            <EditableElement
              slotId={slot.id}
              mode={mode}
              onClick={onElementClick}
              className={''}  // Parent div should only have layout/structure classes, not text styling
              style={['button', 'input'].includes(slot.type) ? {} : (slot.styles || {})}  // Don't apply styles to ResizeWrapper for buttons and inputs
              canResize={!['container', 'grid', 'flex'].includes(slot.type)}
              draggable={false}  // Dragging is handled at GridColumn level
              selectedElementId={selectedElementId}
              onElementResize={slot.type === 'button' ? (newSize) => {
                // For buttons, update the slot styles using the generic callback
                if (onSlotStyleUpdate) {
                  const newStyles = {
                    width: `${newSize.width}${newSize.widthUnit || 'px'}`,
                    height: newSize.height !== 'auto' ? `${newSize.height}${newSize.heightUnit || 'px'}` : 'auto'
                  };
                  onSlotStyleUpdate(slot.id, newStyles);
                }
              } : undefined}
            >
          {slot.type === 'button' && (
            <button
              className={`${slot.className}`}
              style={{
                ...slot.styles,  // Apply all styles to the button element directly
                width: '100%',   // Fill ResizeWrapper container
                height: '100%',  // Fill ResizeWrapper container
                minWidth: 'auto',
                minHeight: 'auto'
              }}
              dangerouslySetInnerHTML={{
                __html: String(slot.content || `Button: ${slot.id}`)
              }}
            />
          )}
          {slot.type === 'input' && (
            <input
              className={`w-full h-full ${slot.className}`}
              style={{
                ...slot.styles,  // Apply all styles (including colors) to the input element
                minWidth: 'auto',
                minHeight: 'auto'
              }}
              placeholder={String(slot.content || '')}
              type="text"
            />
          )}
          {slot.type === 'image' && (
            <>
              {slot.content ? (
                <img
                  src={slot.content}
                  alt={slot.metadata?.alt || slot.metadata?.fileName || 'Slot image'}
                  className="w-full h-full object-contain"
                  style={{
                    // Don't override container dimensions - let ResizeWrapper control size
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-gray-100 border-2 border-dashed border-gray-300 rounded w-full h-full">
                  <Image className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">No image selected</span>
                </div>
              )}
            </>
          )}
          {(slot.type === 'container' || slot.type === 'grid' || slot.type === 'flex') && (
            <div
              className={`w-full h-full grid grid-cols-12 gap-2 ${slot.className}`}
              style={{
                ...slot.styles,
                minHeight: mode === 'edit' ? '80px' : slot.styles?.minHeight, // Minimum height for drop zones in edit mode
              }}
            >
              <HierarchicalSlotRenderer
                slots={slots}
                parentId={slot.id}
                mode={mode}
                viewMode={viewMode}
                showBorders={showBorders}
                currentDragInfo={currentDragInfo}
                setCurrentDragInfo={setCurrentDragInfo}
                onElementClick={onElementClick}
                onGridResize={onGridResize}
                onSlotHeightResize={onSlotHeightResize}
                onSlotDrop={onSlotDrop}
                onResizeStart={onResizeStart}
                onResizeEnd={onResizeEnd}
                selectedElementId={selectedElementId}
                onSlotStyleUpdate={onSlotStyleUpdate}
              />
            </div>
          )}
            </EditableElement>
          )}
        </div>
      </GridColumn>
    );
  });
};

export default HierarchicalSlotRenderer;