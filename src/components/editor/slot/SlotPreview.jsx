import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Code } from 'lucide-react';

/**
 * Generic SlotPreview component for displaying slot content across different page editors
 * Focused on preview/display functionality rather than advanced editing interactions.
 * For advanced editing with drag-and-drop and resizing, use ParentSlot + MicroSlot components.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.majorSlots - Array of major slot IDs to render
 * @param {Object} props.microSlotDefinitions - Slot definitions mapping
 * @param {Object} props.microSlotOrders - Micro-slot ordering for each major slot
 * @param {Object} props.microSlotSpans - Micro-slot span configurations
 * @param {Object} props.slotContent - Content for each slot
 * @param {Object} props.elementClasses - CSS classes for each slot
 * @param {Object} props.elementStyles - Inline styles for each slot
 * @param {string} props.mode - Current mode ('edit', 'preview', or 'view')
 * @param {Function} props.onEditSlot - Callback for editing a major slot (optional)
 * @param {Function} props.onEditMicroSlot - Callback for editing a micro-slot (optional)
 * @param {Function} props.onMajorDragStart - Callback for drag start on major slots (optional)
 * @param {Function} props.onMajorDragEnd - Callback for drag end on major slots (optional)
 * @param {string} props.activeDragSlot - Currently dragging slot ID (optional)
 * @param {string} props.pageType - Page type for styling context (optional)
 */
export default function SlotPreview({
  majorSlots = [],
  microSlotDefinitions = {},
  microSlotOrders = {},
  microSlotSpans = {},
  slotContent = {},
  elementClasses = {},
  elementStyles = {},
  mode = 'view',
  onEditSlot,
  onEditMicroSlot,
  onMajorDragStart,
  onMajorDragEnd,
  activeDragSlot,
  pageType = 'generic'
}) {
  if (!majorSlots || majorSlots.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No slots configured for this page.</p>
        {mode === 'edit' && (
          <p className="text-sm mt-2">Use the editor controls to add slots.</p>
        )}
      </div>
    );
  }

  return (
    <div className={`slot-preview space-y-6 ${pageType}-slots`}>
      {majorSlots.map((slotId) => {
        const slotDefinition = microSlotDefinitions[slotId];
        
        // Handle missing slot definitions
        if (!slotDefinition) {
          return (
            <div key={slotId} className="p-4 border border-red-300 bg-red-50 rounded">
              <p className="text-red-600">Missing slot definition: {slotId}</p>
              {mode === 'edit' && (
                <p className="text-xs text-red-500 mt-1">
                  Check {pageType} microSlotDefinitions configuration
                </p>
              )}
            </div>
          );
        }

        return (
          <div 
            key={slotId} 
            className={`border rounded-lg p-4 bg-white shadow-sm transition-all duration-200 ${
              activeDragSlot === slotId ? 'opacity-50 scale-95' : ''
            } ${mode === 'edit' ? 'hover:shadow-md border-dashed border-gray-300' : 'border-gray-200'}
            ${mode === 'preview' ? 'border-blue-200 bg-blue-50/30' : ''}
            `}
            // Drag functionality only for basic reordering - advanced editing should use ParentSlot
            draggable={mode === 'edit'}
            onDragStart={(e) => {
              if (mode === 'edit' && onMajorDragStart) {
                onMajorDragStart(e, slotId);
              }
            }}
            onDragEnd={(e) => {
              if (mode === 'edit' && onMajorDragEnd) {
                onMajorDragEnd(e, slotId);
              }
            }}
            onDragOver={(e) => {
              if (mode === 'edit') {
                e.preventDefault();
              }
            }}
            onDrop={(e) => {
              if (mode === 'edit') {
                e.preventDefault();
              }
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">
                {slotDefinition.name || slotId}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  mode === 'preview' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {slotDefinition.type || 'layout'}
                </span>
                {mode === 'preview' && (
                  <span className="text-xs text-blue-600 font-medium">
                    Preview Mode
                  </span>
                )}
                {mode === 'edit' && onEditSlot && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditSlot(slotId, {
                      slotId,
                      microSlots: microSlotOrders[slotId] || [],
                      spans: microSlotSpans[slotId] || {}
                    })}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
            
            {slotDefinition.description && (
              <p className="text-sm text-gray-600 mb-3">{slotDefinition.description}</p>
            )}

            {/* Render micro-slots within this major slot */}
            <div className="space-y-2">
              {(microSlotOrders[slotId] || slotDefinition.microSlots || []).map((microSlotId) => {
                const microSlotKey = `${slotId}.${microSlotId}`;
                const content = slotContent[microSlotKey] || '';
                const className = elementClasses[microSlotKey] || '';
                const styles = elementStyles[microSlotKey] || {};
                
                return (
                  <div key={microSlotId} className={`border rounded p-3 transition-all duration-200 ${
                    mode === 'preview' 
                      ? 'border-blue-200 bg-blue-50/50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${
                        mode === 'preview' ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        {microSlotId}
                      </span>
                      {mode === 'edit' && onEditMicroSlot && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditMicroSlot(microSlotKey, content)}
                          title="Edit micro-slot content"
                        >
                          <Code className="w-3 h-3" />
                        </Button>
                      )}
                      {mode === 'preview' && (
                        <span className="text-xs text-blue-500 opacity-75">
                          Preview
                        </span>
                      )}
                    </div>
                    
                    {/* Content preview - cleaner in preview mode */}
                    <div 
                      className={`p-2 bg-white border rounded text-sm transition-all duration-200 ${className} ${
                        mode === 'preview' ? 'border-blue-200' : 'border-gray-200'
                      }`}
                      style={styles}
                    >
                      {content ? (
                        mode === 'preview' ? (
                          // In preview mode, show full content without truncation
                          <div dangerouslySetInnerHTML={{ __html: content }} />
                        ) : (
                          // In edit mode, show truncated content for easier scanning
                          <div dangerouslySetInnerHTML={{ 
                            __html: content.substring(0, 200) + (content.length > 200 ? '...' : '') 
                          }} />
                        )
                      ) : (
                        <span className={`italic ${
                          mode === 'preview' ? 'text-blue-400' : 'text-gray-400'
                        }`}>
                          {mode === 'preview' ? 'No content configured' : 'No content'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Show message if no micro-slots are defined */}
              {(!microSlotOrders[slotId] || microSlotOrders[slotId].length === 0) && 
               (!slotDefinition.microSlots || slotDefinition.microSlots.length === 0) && (
                <div className="text-center p-4 text-gray-500 text-sm">
                  No micro-slots configured for this slot
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}