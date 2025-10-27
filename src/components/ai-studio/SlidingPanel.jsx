import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { AI_STUDIO_SIZES } from '@/contexts/AIStudioContext';

/**
 * SlidingPanel - Animated sliding panel with three states
 * States: collapsed, partial (50%), fullscreen (100%)
 */
const SlidingPanel = ({
  isOpen,
  size = AI_STUDIO_SIZES.PARTIAL,
  position = 'right',
  onClose,
  children,
  className
}) => {
  const panelRef = useRef(null);

  // Handle click outside to close (only in partial mode)
  useEffect(() => {
    if (!isOpen || size === AI_STUDIO_SIZES.FULLSCREEN) return;

    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    // Add delay to prevent immediate close on open
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, size, onClose]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (isOpen && size === AI_STUDIO_SIZES.FULLSCREEN) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, size]);

  if (!isOpen && size === AI_STUDIO_SIZES.COLLAPSED) {
    return null;
  }

  // Calculate dimensions based on position and size
  const getDimensions = () => {
    if (!isOpen) {
      return {
        width: position === 'right' || position === 'left' ? '0%' : '100%',
        height: position === 'top' || position === 'bottom' ? '0%' : '100%'
      };
    }

    switch (size) {
      case AI_STUDIO_SIZES.COLLAPSED:
        return { width: '0%', height: '0%' };
      case AI_STUDIO_SIZES.PARTIAL:
        return position === 'right' || position === 'left'
          ? { width: '50%', height: '100%' }
          : { width: '100%', height: '50%' };
      case AI_STUDIO_SIZES.FULLSCREEN:
        return { width: '100%', height: '100%' };
      default:
        return { width: '50%', height: '100%' };
    }
  };

  const getPositionClasses = () => {
    const positions = {
      right: 'right-0 top-0',
      left: 'left-0 top-0',
      top: 'top-0 left-0',
      bottom: 'bottom-0 left-0'
    };
    return positions[position] || positions.right;
  };

  const getShadowDirection = () => {
    const shadows = {
      right: 'shadow-[-10px_0_30px_rgba(0,0,0,0.15)]',
      left: 'shadow-[10px_0_30px_rgba(0,0,0,0.15)]',
      top: 'shadow-[0_10px_30px_rgba(0,0,0,0.15)]',
      bottom: 'shadow-[0_-10px_30px_rgba(0,0,0,0.15)]'
    };
    return shadows[position] || shadows.right;
  };

  const dimensions = getDimensions();

  return (
    <>
      {/* Backdrop overlay (only for partial mode) */}
      {isOpen && size === AI_STUDIO_SIZES.PARTIAL && (
        <div
          className={cn(
            'fixed inset-0 bg-black/20 dark:bg-black/40 z-[999]',
            'transition-opacity duration-300'
          )}
          style={{
            opacity: isOpen ? 1 : 0
          }}
        />
      )}

      {/* Sliding Panel */}
      <div
        ref={panelRef}
        className={cn(
          'fixed z-[1000]',
          'bg-white dark:bg-gray-900',
          'transition-all duration-300 ease-in-out',
          getPositionClasses(),
          isOpen ? getShadowDirection() : '',
          size === AI_STUDIO_SIZES.FULLSCREEN && 'border-0',
          size === AI_STUDIO_SIZES.PARTIAL && position === 'right' && 'border-l',
          size === AI_STUDIO_SIZES.PARTIAL && position === 'left' && 'border-r',
          size === AI_STUDIO_SIZES.PARTIAL && position === 'top' && 'border-b',
          size === AI_STUDIO_SIZES.PARTIAL && position === 'bottom' && 'border-t',
          'border-gray-200 dark:border-gray-700',
          className
        )}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          transform: !isOpen ?
            (position === 'right' ? 'translateX(100%)' :
             position === 'left' ? 'translateX(-100%)' :
             position === 'top' ? 'translateY(-100%)' :
             'translateY(100%)') :
            'translate(0, 0)'
        }}
      >
        {children}
      </div>
    </>
  );
};

export default SlidingPanel;
