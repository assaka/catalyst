import React, { useState, useCallback, useRef, useEffect } from 'react';

/**
 * SmartResizeSystem - Enhanced resize with constraints and smooth feedback
 * 
 * CONSTRAINT HIERARCHY (Slot-First):
 * 1. Slot resize has priority (controls layout flow)
 * 2. Element adapts to fit within slot boundaries
 * 3. Element can "request" slot expansion when needed
 * 
 * BEHAVIORS:
 * - Slot shrinks → Element auto-shrinks to fit
 * - Element grows beyond slot → Slot auto-expands
 * - Smooth visual feedback with constraints
 */

// Enhanced Element Resize Handle with smart constraints
export const SmartElementResizeHandle = ({ 
  elementType,
  currentClasses,
  slotDimensions, // { width, height } of the slot container
  onElementResize,
  onSlotExpansionRequest, // Called when element needs more space
  onConstraintHit // Visual feedback for constraints
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [constraintState, setConstraintState] = useState('free'); // 'free', 'slot-limit', 'min-limit'
  const animationRef = useRef(null);

  // Don't show element resize for text elements
  if (!['icon', 'button', 'image'].includes(elementType)) {
    return null;
  }

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    const startPos = { x: e.clientX, y: e.clientY };
    const startSize = extractCurrentSize(currentClasses, elementType);
    const startSlotSize = slotDimensions || { width: 300, height: 100 };

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startPos.x;
      const deltaY = moveEvent.clientY - startPos.y;

      let newWidth = startSize.width + deltaX;
      let newHeight = startSize.height + deltaY;
      
      // Element-specific resize behavior
      const resizeResult = calculateElementResize(
        elementType, 
        { width: newWidth, height: newHeight }, 
        startSize,
        startSlotSize
      );

      setDimensions(resizeResult.dimensions);
      setConstraintState(resizeResult.constraintState);

      // Smooth update using RAF
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      animationRef.current = requestAnimationFrame(() => {
        // Apply element changes
        if (resizeResult.elementClasses) {
          onElementResize(resizeResult.elementClasses);
        }

        // Request slot expansion if needed
        if (resizeResult.needsSlotExpansion) {
          onSlotExpansionRequest && onSlotExpansionRequest(resizeResult.requestedSlotSize);
        }

        // Visual feedback for constraints
        if (resizeResult.constraintState !== 'free') {
          onConstraintHit && onConstraintHit(resizeResult.constraintState);
        }
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setConstraintState('free');
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [elementType, currentClasses, slotDimensions, onElementResize, onSlotExpansionRequest, onConstraintHit]);

  const getHandleStyle = () => {
    const position = getHandlePosition(elementType);
    
    const baseStyle = {
      position: 'absolute',
      width: '8px',
      height: '8px',
      border: '2px solid #ffffff',
      borderRadius: '50%',
      zIndex: 40,
      transition: isResizing ? 'none' : 'all 0.2s ease',
      transform: isResizing ? 'scale(1.3)' : 'scale(1)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    };

    // Color based on constraint state
    const backgroundColor = {
      'free': '#10b981',        // Green - free to resize
      'slot-limit': '#f59e0b',  // Orange - hitting slot boundary
      'min-limit': '#ef4444'    // Red - hitting minimum size
    }[constraintState] || '#10b981';

    const cursor = {
      'icon': 'se-resize',
      'button': 'e-resize', 
      'image': 'se-resize'
    }[elementType] || 'se-resize';

    return {
      ...baseStyle,
      background: backgroundColor,
      cursor,
      ...(position === 'right' ? {
        top: '50%',
        right: '-4px',
        transform: isResizing ? 'translateY(-50%) scale(1.3)' : 'translateY(-50%) scale(1)'
      } : {
        bottom: '-4px',
        right: '-4px'
      })
    };
  };

  return (
    <>
      <div
        style={getHandleStyle()}
        onMouseDown={handleMouseDown}
        title={getHandleTooltip(elementType, dimensions, constraintState)}
        className="opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
      />
      
      {/* Enhanced resize tooltip */}
      {isResizing && (
        <div
          style={{
            position: 'fixed',
            top: '60px',
            right: '10px',
            background: getTooltipColor(constraintState),
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            zIndex: 1001,
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <div>{getResizeDisplayText(elementType, dimensions)}</div>
          {constraintState !== 'free' && (
            <div style={{ fontSize: '10px', opacity: 0.9, marginTop: '2px' }}>
              {getConstraintMessage(constraintState)}
            </div>
          )}
        </div>
      )}
    </>
  );
};

// Calculate element-specific resize behavior
function calculateElementResize(elementType, newDimensions, startSize, slotSize) {
  const result = {
    dimensions: newDimensions,
    constraintState: 'free',
    elementClasses: null,
    needsSlotExpansion: false,
    requestedSlotSize: null
  };

  if (elementType === 'button') {
    // For buttons: resize font-size and padding instead of width
    const buttonResult = calculateButtonResize(newDimensions, startSize, slotSize);
    return { ...result, ...buttonResult };
  } else if (elementType === 'icon') {
    // For icons: proportional resize with constraints
    const iconResult = calculateIconResize(newDimensions, startSize, slotSize);
    return { ...result, ...iconResult };
  } else if (elementType === 'image') {
    // For images: similar to icons but different constraints
    const imageResult = calculateImageResize(newDimensions, startSize, slotSize);
    return { ...result, ...imageResult };
  }

  return result;
}

// Button-specific resize (font-size instead of width due to whitespace-nowrap)
function calculateButtonResize(newDimensions, startSize, slotSize) {
  const minFontSize = 12; // Minimum readable font size
  const maxFontSize = 24; // Maximum reasonable font size
  
  // Calculate font size based on width change
  const widthRatio = newDimensions.width / startSize.width;
  const baseFontSize = 16; // Base font size in pixels
  let newFontSize = Math.round(baseFontSize * widthRatio);
  
  // Apply font size constraints
  let constraintState = 'free';
  if (newFontSize < minFontSize) {
    newFontSize = minFontSize;
    constraintState = 'min-limit';
  } else if (newFontSize > maxFontSize) {
    newFontSize = maxFontSize;
    constraintState = 'slot-limit';
  }

  // Check if button would exceed slot boundaries
  const estimatedButtonWidth = newFontSize * 8; // Rough estimation
  let needsSlotExpansion = false;
  let requestedSlotSize = null;
  
  if (estimatedButtonWidth > slotSize.width * 0.9) {
    needsSlotExpansion = true;
    requestedSlotSize = { 
      width: Math.ceil(estimatedButtonWidth / slotSize.width) * slotSize.width,
      height: slotSize.height 
    };
    constraintState = 'slot-limit';
  }

  return {
    dimensions: { width: estimatedButtonWidth, height: newDimensions.height },
    constraintState,
    elementClasses: generateButtonClasses(newFontSize, newDimensions.height),
    needsSlotExpansion,
    requestedSlotSize
  };
}

// Icon-specific resize (proportional with slot awareness)
function calculateIconResize(newDimensions, startSize, slotSize) {
  // Maintain aspect ratio
  const aspectRatio = startSize.width / startSize.height;
  const avgChange = (newDimensions.width + newDimensions.height) / 2;
  const avgStart = (startSize.width + startSize.height) / 2;
  const scale = avgChange / avgStart;
  
  let newWidth = startSize.width * scale;
  let newHeight = startSize.height * scale;
  
  // Apply minimum constraints
  const minSize = 16;
  const maxSize = Math.min(slotSize.width * 0.8, slotSize.height * 0.8);
  
  let constraintState = 'free';
  if (newWidth < minSize || newHeight < minSize) {
    newWidth = Math.max(newWidth, minSize);
    newHeight = Math.max(newHeight, minSize);
    constraintState = 'min-limit';
  } else if (newWidth > maxSize || newHeight > maxSize) {
    const scaleDown = maxSize / Math.max(newWidth, newHeight);
    newWidth *= scaleDown;
    newHeight *= scaleDown;
    constraintState = 'slot-limit';
  }

  return {
    dimensions: { width: newWidth, height: newHeight },
    constraintState,
    elementClasses: generateIconClasses(newWidth, newHeight),
    needsSlotExpansion: false,
    requestedSlotSize: null
  };
}

// Image resize (similar to icon but different constraints)
function calculateImageResize(newDimensions, startSize, slotSize) {
  // Similar to icon but allow larger sizes and slot expansion
  const result = calculateIconResize(newDimensions, startSize, slotSize);
  
  // Images can request slot expansion more liberally
  if (newDimensions.width > slotSize.width * 0.7 || newDimensions.height > slotSize.height * 0.7) {
    result.needsSlotExpansion = true;
    result.requestedSlotSize = {
      width: Math.ceil(newDimensions.width / 50) * 50, // Round to grid units
      height: Math.ceil(newDimensions.height / 25) * 25
    };
    result.constraintState = 'slot-limit';
  }
  
  return result;
}

// Generate Tailwind classes for different elements
function generateButtonClasses(fontSize, height) {
  const fontClass = `text-[${fontSize}px]`;
  const heightClass = getTailwindSizeClass('h', height);
  return `${heightClass} ${fontClass} px-4`;
}

function generateIconClasses(width, height) {
  const widthClass = getTailwindSizeClass('w', width);
  const heightClass = getTailwindSizeClass('h', height);
  return `${widthClass} ${heightClass}`;
}

function generateImageClasses(width, height) {
  return generateIconClasses(width, height); // Same as icons for now
}

// Utility functions
function extractCurrentSize(classes, elementType) {
  const widthMatch = classes.match(/w-(\d+)/);
  const heightMatch = classes.match(/h-(\d+)/);
  
  const defaults = {
    icon: { width: 64, height: 64 },
    button: { width: 120, height: 40 },
    image: { width: 100, height: 100 }
  };
  
  return {
    width: widthMatch ? parseInt(widthMatch[1]) * 4 : defaults[elementType]?.width || 64,
    height: heightMatch ? parseInt(heightMatch[1]) * 4 : defaults[elementType]?.height || 64
  };
}

function getTailwindSizeClass(prefix, pixels) {
  const sizes = [
    { px: 16, class: '4' }, { px: 20, class: '5' }, { px: 24, class: '6' },
    { px: 28, class: '7' }, { px: 32, class: '8' }, { px: 36, class: '9' },
    { px: 40, class: '10' }, { px: 44, class: '11' }, { px: 48, class: '12' },
    { px: 56, class: '14' }, { px: 64, class: '16' }, { px: 80, class: '20' },
    { px: 96, class: '24' }, { px: 112, class: '28' }, { px: 128, class: '32' }
  ];

  const closest = sizes.reduce((prev, curr) => 
    Math.abs(curr.px - pixels) < Math.abs(prev.px - pixels) ? curr : prev
  );

  return `${prefix}-${closest.class}`;
}

function getHandlePosition(elementType) {
  switch (elementType) {
    case 'icon': return 'bottom-right';
    case 'button': return 'right';
    case 'image': return 'bottom-right';
    default: return 'bottom-right';
  }
}

function getHandleTooltip(elementType, dimensions, constraintState) {
  const sizeText = `${Math.round(dimensions.width)}×${Math.round(dimensions.height)}px`;
  const constraintText = {
    'free': '',
    'slot-limit': ' (slot boundary)',
    'min-limit': ' (minimum size)'
  }[constraintState];
  
  return `Resize ${elementType}: ${sizeText}${constraintText}`;
}

function getTooltipColor(constraintState) {
  return {
    'free': 'rgba(16, 185, 129, 0.95)',
    'slot-limit': 'rgba(245, 158, 11, 0.95)',
    'min-limit': 'rgba(239, 68, 68, 0.95)'
  }[constraintState] || 'rgba(16, 185, 129, 0.95)';
}

function getResizeDisplayText(elementType, dimensions) {
  if (elementType === 'button') {
    const fontSize = Math.round(dimensions.width / 8); // Rough estimation
    return `Font: ${fontSize}px, Height: ${Math.round(dimensions.height)}px`;
  }
  return `${elementType}: ${Math.round(dimensions.width)}×${Math.round(dimensions.height)}px`;
}

function getConstraintMessage(constraintState) {
  return {
    'slot-limit': 'Requesting slot expansion',
    'min-limit': 'Minimum size reached'
  }[constraintState] || '';
}

// Smart Microslot Handle that responds to element expansion requests
export const SmartMicroslotHandle = ({
  slotId,
  parentSlot,
  microSlotSpans,
  onMicroslotResize,
  elementConstraints // Information about elements in this slot
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [constraintState, setConstraintState] = useState('free');
  const animationRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    const startPos = { x: e.clientX, y: e.clientY };
    const startSpans = { 
      col: microSlotSpans?.col || 12, 
      row: microSlotSpans?.row || 1 
    };

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startPos.x;
      const deltaY = moveEvent.clientY - startPos.y;

      const colDelta = Math.round(deltaX / 50);
      const rowDelta = Math.round(deltaY / 25);

      let newCol = startSpans.col + colDelta;
      let newRow = startSpans.row + rowDelta;
      
      // Apply grid constraints
      const gridResult = applyGridConstraints(newCol, newRow, startSpans);
      newCol = gridResult.col;
      newRow = gridResult.row;
      
      // Check element constraints
      const elementResult = checkElementConstraints(
        { col: newCol, row: newRow }, 
        elementConstraints
      );
      
      setConstraintState(elementResult.constraintState);
      
      // Smooth update using RAF
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      animationRef.current = requestAnimationFrame(() => {
        if (elementResult.shouldResize) {
          onMicroslotResize(slotId, parentSlot, { col: newCol, row: newRow });
        }
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setConstraintState('free');
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [slotId, parentSlot, microSlotSpans, onMicroslotResize, elementConstraints]);

  const getHandleStyle = () => {
    const backgroundColor = {
      'free': '#3b82f6',           // Blue - free to resize
      'element-conflict': '#f59e0b', // Orange - would squeeze elements
      'grid-limit': '#ef4444'       // Red - grid boundary
    }[constraintState] || '#3b82f6';

    return {
      position: 'absolute',
      bottom: '0',
      right: '0',
      width: '12px',
      height: '12px',
      background: backgroundColor,
      border: '2px solid #ffffff',
      borderRadius: '50%',
      cursor: 'se-resize',
      zIndex: 30,
      transition: isResizing ? 'none' : 'all 0.2s ease',
      transform: isResizing ? 'translate(50%, 50%) scale(1.2)' : 'translate(50%, 50%) scale(1)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    };
  };

  return (
    <>
      <div
        style={getHandleStyle()}
        onMouseDown={handleMouseDown}
        title={getMicroslotTooltip(microSlotSpans, constraintState)}
        className="opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
      />
      
      {isResizing && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: getTooltipColor(constraintState),
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            zIndex: 1000,
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <div>Grid: {microSlotSpans?.col || 12}×{microSlotSpans?.row || 1}</div>
          {constraintState !== 'free' && (
            <div style={{ fontSize: '10px', opacity: 0.9, marginTop: '2px' }}>
              {getMicroslotConstraintMessage(constraintState)}
            </div>
          )}
        </div>
      )}
    </>
  );
};

// Wrapper component that combines smart microslot and element resize
export const SmartResizeWrapper = ({
  children,
  slotId,
  parentSlot,
  microSlotSpans,
  onMicroslotResize,
  elementType,
  currentClasses,
  onElementResize,
  mode = 'edit'
}) => {
  const [slotDimensions, setSlotDimensions] = useState({ width: 300, height: 100 });
  const [elementConstraints, setElementConstraints] = useState(null);
  const containerRef = useRef(null);

  // Measure slot dimensions
  useEffect(() => {
    if (containerRef.current && mode === 'edit') {
      const rect = containerRef.current.getBoundingClientRect();
      setSlotDimensions({ width: rect.width, height: rect.height });
    }
  }, [microSlotSpans, mode]);

  // Handle element expansion requests
  const handleSlotExpansionRequest = useCallback((requestedSize) => {
    // Convert pixel dimensions to grid spans
    const currentWidth = slotDimensions.width;
    const currentCols = microSlotSpans?.col || 12;
    const pixelsPerCol = currentWidth / currentCols;
    
    const newCols = Math.ceil(requestedSize.width / pixelsPerCol);
    const clampedCols = Math.min(12, Math.max(currentCols, newCols));
    
    if (clampedCols !== currentCols) {
      console.log(`🔄 Element requesting slot expansion: ${currentCols} → ${clampedCols} cols`);
      onMicroslotResize(slotId, parentSlot, { 
        col: clampedCols, 
        row: microSlotSpans?.row || 1 
      });
    }
  }, [slotDimensions, microSlotSpans, slotId, parentSlot, onMicroslotResize]);

  const handleConstraintHit = useCallback((constraintType) => {
    // Visual feedback for constraint hits
    console.log(`⚠️ Constraint hit: ${constraintType} for ${slotId}`);
  }, [slotId]);

  if (mode !== 'edit') {
    return children;
  }

  return (
    <div ref={containerRef} className="relative group">
      {children}
      
      {/* Smart microslot handle (blue) */}
      <SmartMicroslotHandle
        slotId={slotId}
        parentSlot={parentSlot}
        microSlotSpans={microSlotSpans}
        onMicroslotResize={onMicroslotResize}
        elementConstraints={elementConstraints}
      />
      
      {/* Smart element handle (green) - only for resizable elements */}
      {['icon', 'button', 'image'].includes(elementType) && (
        <SmartElementResizeHandle
          elementType={elementType}
          currentClasses={currentClasses}
          slotDimensions={slotDimensions}
          onElementResize={onElementResize}
          onSlotExpansionRequest={handleSlotExpansionRequest}
          onConstraintHit={handleConstraintHit}
        />
      )}
    </div>
  );
};

// Constraint checking functions
function applyGridConstraints(col, row, startSpans) {
  const newCol = Math.min(12, Math.max(1, col));
  const newRow = Math.min(4, Math.max(1, row));
  
  return { col: newCol, row: newRow };
}

function checkElementConstraints(newSpans, elementConstraints) {
  // Check if new slot size would conflict with elements
  // This is where we'd implement element size checking
  
  return {
    shouldResize: true,
    constraintState: 'free' // 'free', 'element-conflict', 'grid-limit'
  };
}

function getMicroslotTooltip(microSlotSpans, constraintState) {
  const gridText = `${microSlotSpans?.col || 12} cols × ${microSlotSpans?.row || 1} rows`;
  const constraintText = {
    'free': '',
    'element-conflict': ' (would squeeze elements)',
    'grid-limit': ' (grid boundary)'
  }[constraintState];
  
  return `Resize slot: ${gridText}${constraintText}`;
}

function getMicroslotConstraintMessage(constraintState) {
  return {
    'element-conflict': 'Elements need more space',
    'grid-limit': 'Grid boundary reached'
  }[constraintState] || '';
}

export default SmartElementResizeHandle;