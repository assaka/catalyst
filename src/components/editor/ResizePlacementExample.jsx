import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ElementWithResize, MicroslotContainer } from './slot/DualResizeSystem';

/**
 * ResizePlacementExample - Visual example of handle placement
 * 
 * CLEAR HIERARCHY:
 * 
 * 1. MICROSLOT LEVEL (Blue Handle - Bottom Right of Grid Container)
 *    ┌─────────────────────────────────┐
 *    │  Grid Container (12 cols)       │
 *    │                                 │
 *    │  [Element Content Here]         │
 *    │                                 │
 *    │                              🔵 │ ← Blue: Grid resize
 *    └─────────────────────────────────┘
 *    
 * 2. ELEMENT LEVEL (Green Handle - Directly On Element)
 *    ┌─────────────────────────────────┐
 *    │  Grid Container                 │
 *    │                                 │
 *    │     ┌─────────┐🟢               │ ← Green: On element edge
 *    │     │  Icon   │                 │
 *    │     └─────────┘                 │
 *    │                              🔵 │ ← Blue: Grid resize
 *    └─────────────────────────────────┘
 */

const ResizePlacementExample = () => {
  const handleMicroslotResize = (slotId, parentSlot, spans) => {
    console.log('Microslot resize:', { slotId, parentSlot, spans });
  };

  const handleElementResize = (newClasses) => {
    console.log('Element resize:', newClasses);
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50">
      <h2 className="text-2xl font-bold mb-6">Resize Handle Placement Examples</h2>

      {/* Example 1: Icon with dual resize */}
      <div className="border-2 border-dashed border-blue-300 p-6 bg-white">
        <h3 className="text-lg font-semibold mb-4">Icon Element</h3>
        <div className="grid grid-cols-12 gap-2">
          <MicroslotContainer
            slotId="emptyCart.icon"
            parentSlot="emptyCart"
            microSlotSpans={{ col: 6, row: 1 }}
            onMicroslotResize={handleMicroslotResize}
            mode="edit"
          >
            <div className="col-span-6 p-4 border border-gray-200 bg-gray-50 flex justify-center items-center">
              <ElementWithResize
                elementType="icon"
                currentClasses="w-16 h-16 text-gray-400"
                onElementResize={handleElementResize}
                mode="edit"
              >
                <ShoppingCart className="w-16 h-16 text-gray-400" />
              </ElementWithResize>
            </div>
          </MicroslotContainer>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          • Blue handle: Resize grid container (6 of 12 columns)
          <br />
          • Green handle: Resize icon size (64×64px) - directly on icon
        </div>
      </div>

      {/* Example 2: Button with dual resize */}
      <div className="border-2 border-dashed border-blue-300 p-6 bg-white">
        <h3 className="text-lg font-semibold mb-4">Button Element</h3>
        <div className="grid grid-cols-12 gap-2">
          <MicroslotContainer
            slotId="emptyCart.button"
            parentSlot="emptyCart"
            microSlotSpans={{ col: 8, row: 1 }}
            onMicroslotResize={handleMicroslotResize}
            mode="edit"
          >
            <div className="col-span-8 p-4 border border-gray-200 bg-gray-50 flex justify-center items-center">
              <ElementWithResize
                elementType="button"
                currentClasses="bg-blue-600 hover:bg-blue-700 h-10 px-4"
                onElementResize={handleElementResize}
                mode="edit"
              >
                <Button className="bg-blue-600 hover:bg-blue-700 h-10 px-4">
                  Continue Shopping
                </Button>
              </ElementWithResize>
            </div>
          </MicroslotContainer>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          • Blue handle: Resize grid container (8 of 12 columns)
          <br />
          • Green handle: Resize button dimensions - directly on button
        </div>
      </div>

      {/* Example 3: Text element (no element resize) */}
      <div className="border-2 border-dashed border-blue-300 p-6 bg-white">
        <h3 className="text-lg font-semibold mb-4">Text Element</h3>
        <div className="grid grid-cols-12 gap-2">
          <MicroslotContainer
            slotId="emptyCart.title"
            parentSlot="emptyCart"
            microSlotSpans={{ col: 12, row: 1 }}
            onMicroslotResize={handleMicroslotResize}
            mode="edit"
          >
            <div className="col-span-12 p-4 border border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">Your cart is empty</h2>
            </div>
          </MicroslotContainer>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          • Blue handle only: Resize grid container (12 of 12 columns)
          <br />
          • No element resize: Text uses container width
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Handle Legend</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 border border-white rounded-full"></div>
            <span>Blue Handle: Microslot grid positioning (affects layout flow)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 border border-white rounded-full"></div>
            <span>Green Handle: Element dimensions (affects content size)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResizePlacementExample;