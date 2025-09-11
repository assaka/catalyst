import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing element selection in the editor
 * Handles click events, selection highlighting, and property updates
 */
export const useElementSelection = () => {
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);

  // Add selection highlight styles
  const addSelectionStyles = useCallback((element) => {
    if (!element) return;
    
    element.style.outline = '2px solid #0066ff';
    element.style.outlineOffset = '2px';
    element.classList.add('editor-selected');
  }, []);

  // Remove selection highlight styles
  const removeSelectionStyles = useCallback((element) => {
    if (!element) return;
    
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.classList.remove('editor-selected');
  }, []);

  // Select an element
  const selectElement = useCallback((element, event) => {
    if (event) {
      event.stopPropagation();
    }

    // Clear previous selection
    if (selectedElement) {
      removeSelectionStyles(selectedElement);
    }

    if (element && element !== selectedElement) {
      setSelectedElement(element);
      addSelectionStyles(element);
      
      // Update selection box position
      const rect = element.getBoundingClientRect();
      setSelectionBox({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      });
    } else {
      setSelectedElement(null);
      setSelectionBox(null);
    }
  }, [selectedElement, addSelectionStyles, removeSelectionStyles]);

  // Clear selection
  const clearSelection = useCallback(() => {
    if (selectedElement) {
      removeSelectionStyles(selectedElement);
      setSelectedElement(null);
      setSelectionBox(null);
    }
  }, [selectedElement, removeSelectionStyles]);

  // Update element properties
  const updateElementProperty = useCallback((element, property, value) => {
    if (!element) return;

    switch (property) {
      case 'width':
        element.style.width = value ? `${value}px` : '';
        break;
      case 'height':
        element.style.height = value ? `${value}px` : '';
        break;
      case 'fontSize':
        element.style.fontSize = value;
        break;
      case 'fontWeight':
        element.style.fontWeight = value;
        break;
      case 'fontStyle':
        element.style.fontStyle = value;
        break;
      case 'textAlign':
        element.style.textAlign = value;
        break;
      case 'color':
        element.style.color = value;
        break;
      case 'backgroundColor':
        element.style.backgroundColor = value;
        break;
      case 'padding':
        element.style.padding = value;
        break;
      case 'margin':
        element.style.margin = value;
        break;
      default:
        element.style[property] = value;
    }

    // Update selection box position if element size changed
    if (property === 'width' || property === 'height' || property === 'padding' || property === 'margin') {
      const rect = element.getBoundingClientRect();
      setSelectionBox({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      });
    }
  }, []);

  // Handle click events on selectable elements
  const handleElementClick = useCallback((event) => {
    const target = event.target;
    
    // Check if element has data-editable attribute or is within an editable context
    const isEditable = (element) => {
      // Direct editable attribute
      if (element.hasAttribute('data-editable')) return true;
      
      // Has a slot ID
      if (element.hasAttribute('data-slot-id')) return true;
      
      // Parent has editable marker
      const parent = element.closest('[data-editable], [data-slot-id]');
      if (parent) return true;
      
      // Is within an editable section
      if (element.closest('.editable-section')) return true;
      
      return false;
    };
    
    if (isEditable(target) && !target.closest('.editor-sidebar')) {
      selectElement(target, event);
    } else if (!target.closest('.editor-sidebar')) {
      clearSelection();
    }
  }, [selectElement, clearSelection]);

  // Set up global click listeners
  useEffect(() => {
    document.addEventListener('click', handleElementClick);
    
    return () => {
      document.removeEventListener('click', handleElementClick);
    };
  }, [handleElementClick]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (selectedElement) {
        removeSelectionStyles(selectedElement);
      }
    };
  }, [selectedElement, removeSelectionStyles]);

  return {
    selectedElement,
    selectionBox,
    selectElement,
    clearSelection,
    updateElementProperty
  };
};