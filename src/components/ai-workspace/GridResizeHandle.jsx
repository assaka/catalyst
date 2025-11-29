import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * GridResizeHandle - Snap-to-grid resize handle
 * Allows resizing slots in 1/12 column increments
 */

const GridResizeHandle = ({
  slotId,
  currentColSpan = 12,
  minColSpan = 1,
  maxColSpan = 12,
  onResize,
  onResizeEnd,
  containerRef,
  disabled = false
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [previewColSpan, setPreviewColSpan] = useState(currentColSpan);
  const startXRef = useRef(0);
  const startColSpanRef = useRef(currentColSpan);
  const columnWidthRef = useRef(0);

  // Calculate column width based on container
  const calculateColumnWidth = useCallback(() => {
    if (containerRef?.current) {
      const containerWidth = containerRef.current.offsetWidth;
      return containerWidth / 12;
    }
    // Fallback: estimate based on common container widths
    return 80; // ~960px / 12
  }, [containerRef]);

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((e) => {
    if (disabled) return;

    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    startXRef.current = e.clientX;
    startColSpanRef.current = currentColSpan;
    columnWidthRef.current = calculateColumnWidth();

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Prevent text selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }, [disabled, currentColSpan, calculateColumnWidth]);

  // Handle mouse move during resize
  const handleMouseMove = useCallback((e) => {
    if (!isResizing && !startXRef.current) return;

    const deltaX = e.clientX - startXRef.current;
    const columnWidth = columnWidthRef.current;

    // Calculate how many columns to change
    const columnDelta = Math.round(deltaX / columnWidth);
    let newColSpan = startColSpanRef.current + columnDelta;

    // Clamp to min/max
    newColSpan = Math.max(minColSpan, Math.min(maxColSpan, newColSpan));

    setPreviewColSpan(newColSpan);

    // Call onResize for live preview
    if (onResize && newColSpan !== currentColSpan) {
      onResize(slotId, newColSpan);
    }
  }, [isResizing, minColSpan, maxColSpan, currentColSpan, onResize, slotId]);

  // Handle mouse up to end resize
  const handleMouseUp = useCallback((e) => {
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // Reset cursor
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    setIsResizing(false);

    // Call onResizeEnd with final value
    if (onResizeEnd && previewColSpan !== startColSpanRef.current) {
      onResizeEnd(slotId, previewColSpan);
    }

    // Reset refs
    startXRef.current = 0;
  }, [handleMouseMove, onResizeEnd, slotId, previewColSpan]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Update preview when current value changes externally
  useEffect(() => {
    if (!isResizing) {
      setPreviewColSpan(currentColSpan);
    }
  }, [currentColSpan, isResizing]);

  if (disabled) return null;

  return (
    <>
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          'absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-20',
          'group-hover:bg-blue-500/20 hover:bg-blue-500/40',
          'transition-colors',
          isResizing && 'bg-blue-500/40'
        )}
        title="Drag to resize (snaps to columns)"
      >
        {/* Visual indicator */}
        <div className={cn(
          'absolute right-0 top-1/2 -translate-y-1/2',
          'w-1 h-8 rounded-full',
          'bg-gray-300 dark:bg-gray-600',
          'group-hover:bg-blue-500 transition-colors',
          isResizing && 'bg-blue-500'
        )} />
      </div>

      {/* Column span preview tooltip during resize */}
      {isResizing && (
        <div className={cn(
          'fixed z-50 px-2 py-1 rounded text-xs font-mono',
          'bg-gray-900 text-white shadow-lg',
          'pointer-events-none'
        )}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
        >
          {previewColSpan}/12 columns
        </div>
      )}
    </>
  );
};

export default GridResizeHandle;
