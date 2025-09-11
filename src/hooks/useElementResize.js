import { useEffect, useRef } from 'react';
import { useExternalResizeContext } from '@/components/ui/external-resize-provider';

/**
 * Hook for elements to register themselves for external resizing
 * Usage: const elementRef = useElementResize(slotId, config)
 */
export const useElementResize = (slotId, config = {}) => {
  const elementRef = useRef(null);
  const { registerElement, unregisterElement } = useExternalResizeContext();

  useEffect(() => {
    if (elementRef.current && slotId) {
      registerElement(slotId, elementRef.current, {
        elementType: 'text',
        minWidth: 150,
        maxWidth: 800,
        minHeight: 24,
        maxHeight: 200,
        ...config
      });

      return () => {
        unregisterElement(slotId);
      };
    }
  }, [slotId, config, registerElement, unregisterElement]);

  return elementRef;
};