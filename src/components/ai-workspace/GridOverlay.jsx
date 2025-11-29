import React from 'react';
import { cn } from '@/lib/utils';

/**
 * GridOverlay - Visual 12-column grid overlay
 * Shows column boundaries during edit mode for better positioning feedback
 */

const GridOverlay = ({
  visible = false,
  showLabels = true,
  columns = 12,
  className
}) => {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none z-10',
        'grid gap-0',
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`
      }}
    >
      {Array.from({ length: columns }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'relative h-full',
            'border-l border-dashed border-blue-300/30 dark:border-blue-500/20',
            index === columns - 1 && 'border-r'
          )}
        >
          {/* Column number label */}
          {showLabels && (
            <div className={cn(
              'absolute top-0 left-1/2 -translate-x-1/2',
              'text-[10px] font-mono text-blue-400/50 dark:text-blue-500/40',
              'bg-white/80 dark:bg-gray-900/80 px-1 rounded-b'
            )}>
              {index + 1}
            </div>
          )}

          {/* Vertical grid line highlight on hover area */}
          <div className={cn(
            'absolute inset-y-0 left-0 w-full',
            'bg-blue-500/5 dark:bg-blue-400/5'
          )} />
        </div>
      ))}

      {/* Grid info label */}
      <div className={cn(
        'absolute bottom-2 right-2',
        'text-[10px] font-mono text-blue-400/60 dark:text-blue-500/50',
        'bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded shadow-sm'
      )}>
        12-column grid
      </div>
    </div>
  );
};

/**
 * GridOverlayCompact - Minimal version without labels
 */
export const GridOverlayCompact = ({
  visible = false,
  columns = 12,
  className
}) => {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none',
        'grid gap-0',
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`
      }}
    >
      {Array.from({ length: columns }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-full',
            'border-l border-dashed border-gray-200/50 dark:border-gray-700/50',
            index === columns - 1 && 'border-r'
          )}
        />
      ))}
    </div>
  );
};

/**
 * GridSnapIndicator - Shows where a slot will snap during resize/drag
 */
export const GridSnapIndicator = ({
  startColumn,
  endColumn,
  visible = false
}) => {
  if (!visible) return null;

  const spanColumns = endColumn - startColumn + 1;

  return (
    <div
      className={cn(
        'absolute inset-y-0 pointer-events-none z-20',
        'bg-blue-500/20 border-2 border-blue-500 border-dashed rounded'
      )}
      style={{
        gridColumn: `${startColumn} / span ${spanColumns}`,
      }}
    >
      <div className={cn(
        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'text-sm font-bold text-blue-600 dark:text-blue-400',
        'bg-white dark:bg-gray-800 px-2 py-1 rounded shadow'
      )}>
        {spanColumns}/12
      </div>
    </div>
  );
};

export default GridOverlay;
