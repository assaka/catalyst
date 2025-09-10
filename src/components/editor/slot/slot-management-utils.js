/**
 * Generic Slot Management Utilities
 * Extracted from CartSlotsEditor.jsx to be reusable across all page editors
 */

/**
 * Handle editing a micro-slot (show code editor)
 */
export function handleEditMicroSlot({
  slotId,
  microSlotDefinitions,
  microSlotOrders,
  microSlotSpans,
  slotContent,
  slotTemplates = {},
  setEditingComponent,
  setTempCode
}) {
  // Check if this is a parent slot (doesn't contain a dot)
  const isParentSlot = !slotId.includes('.');
  
  if (isParentSlot) {
    // For parent slots, show the configuration JSON
    const parentConfig = {
      id: slotId,
      name: microSlotDefinitions[slotId]?.name || slotId,
      microSlots: microSlotOrders[slotId] || [],
      spans: microSlotSpans[slotId] || {},
      gridCols: microSlotDefinitions[slotId]?.gridCols || 12,
      slots: {}
    };
    
    // Include all slot content for this parent
    const parentSlotPrefix = `${slotId}.`;
    Object.keys(slotContent).forEach(key => {
      if (key.startsWith(parentSlotPrefix)) {
        parentConfig.slots[key] = slotContent[key];
      }
    });
    
    // Convert to formatted JSON
    const jsonContent = JSON.stringify(parentConfig, null, 2);
    setEditingComponent(slotId);
    setTempCode(jsonContent);
  } else {
    // For micro slots, get content from unified slotContent storage
    const content = slotContent[slotId] || slotTemplates[slotId] || '';
    setEditingComponent(slotId);
    setTempCode(content);
  }
}

/**
 * Handle saving code from Monaco editor
 */
export function handleSaveCode({
  editingComponent,
  tempCode,
  microSlotDefinitions,
  setSlotContent,
  setMicroSlotOrders,
  setMicroSlotSpans,
  setCustomSlots,
  setEditingComponent,
  setTempCode,
  onSave
}) {
  if (!editingComponent) return;
  
  console.log('🔧 Saving Monaco editor content:', { 
    editingComponent, 
    codeLength: tempCode?.length 
  });
  
  const isParentSlot = !editingComponent.includes('.');
  
  if (isParentSlot) {
    try {
      // Parse JSON for parent slot configuration
      const parentConfig = JSON.parse(tempCode);
      
      // Update microSlotOrders
      if (parentConfig.microSlots) {
        setMicroSlotOrders(prev => ({
          ...prev,
          [editingComponent]: parentConfig.microSlots
        }));
      }
      
      // Update microSlotSpans
      if (parentConfig.spans) {
        setMicroSlotSpans(prev => ({
          ...prev,
          [editingComponent]: parentConfig.spans
        }));
      }
      
      // Update slot content for all child slots
      if (parentConfig.slots) {
        setSlotContent(prev => ({
          ...prev,
          ...parentConfig.slots
        }));
      }
      
      console.log('✅ Parent slot configuration updated successfully');
    } catch (error) {
      console.error('❌ Failed to parse parent slot JSON:', error);
      alert('Invalid JSON format. Please check your syntax.');
      return; // Don't close editor on error
    }
  } else {
    // For micro slots, save content directly
    setSlotContent(prev => ({
      ...prev,
      [editingComponent]: tempCode
    }));
    
    // Check if this is a custom slot and update custom slots too
    const isCustomSlot = editingComponent.includes('.custom_');
    if (isCustomSlot) {
      setCustomSlots(prev => ({
        ...prev,
        [editingComponent]: {
          ...(prev[editingComponent] || {}),
          content: tempCode,
          metadata: {
            ...(prev[editingComponent]?.metadata || {}),
            lastModified: new Date().toISOString()
          }
        }
      }));
    }
    
    console.log('✅ Micro slot content updated successfully');
  }
  
  // Close editor
  setEditingComponent(null);
  setTempCode('');
  
  // Auto-save after code change
  if (onSave) {
    setTimeout(onSave, 100);
  }
}

/**
 * Handle deleting a custom slot
 */
export function handleDeleteCustomSlot({
  slotId,
  setMicroSlotOrders,
  setMicroSlotSpans,
  setCustomSlots,
  setSlotContent,
  setElementClasses,
  setElementStyles,
  onSave
}) {
  console.log('handleDeleteCustomSlot called with:', slotId);
  
  // Check if this is a custom slot
  if (!slotId.includes('.custom_')) {
    console.log('Not a custom slot, returning');
    return;
  }
  
  // Determine the parent slot (e.g., 'header', 'emptyCart')
  const parentSlot = slotId.split('.')[0];
  const microSlotId = slotId.split('.').slice(1).join('.');
  
  console.log('Parent slot:', parentSlot, 'MicroSlot ID:', microSlotId);
  
  // Remove from micro slot orders
  setMicroSlotOrders(prev => {
    const updated = {
      ...prev,
      [parentSlot]: (prev[parentSlot] || []).filter(id => id !== microSlotId)
    };
    console.log('Updated microSlotOrders:', updated);
    return updated;
  });
  
  // Remove from micro slot spans
  setMicroSlotSpans(prev => {
    const updated = { ...prev };
    if (updated[parentSlot]) {
      delete updated[parentSlot][slotId];
    }
    return updated;
  });
  
  // Remove from custom slots
  setCustomSlots(prev => {
    const updated = { ...prev };
    delete updated[slotId];
    return updated;
  });
  
  // Remove from slot content
  setSlotContent(prev => {
    const updated = { ...prev };
    delete updated[slotId];
    return updated;
  });
  
  // Remove from element classes
  setElementClasses(prev => {
    const updated = { ...prev };
    delete updated[slotId];
    delete updated[`${slotId}-wrapper`]; // Also remove wrapper classes
    return updated;
  });
  
  // Remove from element styles
  setElementStyles(prev => {
    const updated = { ...prev };
    delete updated[slotId];
    return updated;
  });
  
  console.log('Slot deletion complete');
  
  // Auto-save after delete
  if (onSave) {
    setTimeout(onSave, 100);
  }
}

/**
 * Handle adding a new custom slot
 */
export function handleAddCustomSlot({
  newSlotName,
  newSlotContent,
  newSlotType = 'text',
  currentParentSlot = 'default',
  setCustomSlots,
  setMicroSlotOrders,
  setSlotContent,
  setNewSlotName,
  setNewSlotContent,
  setShowAddSlotDialog,
  setJustAddedCustomSlot,
  onSave
}) {
  if (!newSlotName.trim()) {
    alert('Please enter a slot name');
    return;
  }
  
  const parentSlot = currentParentSlot;
  const timestamp = Date.now();
  const microSlotId = `custom_${timestamp}`;
  const fullSlotId = `${parentSlot}.${microSlotId}`;
  const slotLabel = newSlotName.trim();
  
  const initialContent = newSlotContent.trim() || 
    (newSlotType === 'html' ? `<div>${slotLabel}</div>` : 
     newSlotType === 'component' ? `// ${slotLabel} component\nfunction ${slotLabel}() {\n  return <div>${slotLabel}</div>;\n}` :
     slotLabel);
  
  // Add to custom slots registry
  setCustomSlots(prev => ({
    ...prev,
    [fullSlotId]: {
      id: fullSlotId,
      parentSlot,
      type: newSlotType,
      label: slotLabel,
      content: initialContent,
      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    }
  }));
  
  // Add to micro-slot orders for the parent
  setMicroSlotOrders(prev => ({
    ...prev,
    [parentSlot]: [
      ...(prev[parentSlot] || []),
      microSlotId
    ]
  }));
  
  // Add initial content
  setSlotContent(prev => ({
    ...prev,
    [fullSlotId]: initialContent
  }));
  
  // Reset form
  setNewSlotName('');
  setNewSlotContent('');
  setShowAddSlotDialog(false);
  setJustAddedCustomSlot(true);
  
  console.log('✅ Custom slot added:', fullSlotId);
  
  // Auto-save after addition
  if (onSave) {
    setTimeout(onSave, 100);
  }
  
  return fullSlotId;
}

/**
 * Handle component size change (for icons, buttons, etc.)
 */
export function handleSizeChange({
  slotId,
  newSize,
  setComponentSizes,
  onSave
}) {
  setComponentSizes(prev => ({
    ...prev,
    [slotId]: newSize
  }));
  
  // Auto-save after size change
  if (onSave) {
    setTimeout(onSave, 100);
  }
}

/**
 * Handle major slot drag end (reorder top-level slots)
 */
export function handleMajorSlotDragEnd({
  event,
  majorSlots,
  setMajorSlots,
  onSave
}) {
  const { active, over } = event;
  
  if (!over || active.id === over.id) return;

  const oldIndex = majorSlots.indexOf(active.id);
  const newIndex = majorSlots.indexOf(over.id);
  
  if (oldIndex !== -1 && newIndex !== -1) {
    const newOrder = [...majorSlots];
    const [removed] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, removed);
    
    setMajorSlots(newOrder);
    console.log('🎯 Major slots reordered:', newOrder);
    
    // Auto-save after reorder
    if (onSave) {
      setTimeout(onSave, 100);
    }
  }
}

/**
 * Handle span change for micro-slots (resize)
 */
export function handleSpanChange({
  parentId,
  microSlotId,
  newSpans,
  setMicroSlotSpans,
  onSave
}) {
  setMicroSlotSpans(prev => {
    const updated = {
      ...prev,
      [parentId]: {
        ...(prev[parentId] || {}),
        [microSlotId]: newSpans
      }
    };
    
    console.log('🎯 Span changed:', { parentId, microSlotId, newSpans, updated });
    
    // Auto-save after span change
    if (onSave) {
      setTimeout(onSave, 100);
    }
    
    return updated;
  });
}

/**
 * Handle text content change
 */
export function handleTextChange({
  slotId,
  newText,
  setSlotContent,
  onSave
}) {
  setSlotContent(prev => {
    const updated = { ...prev, [slotId]: newText };
    
    // Auto-save after text change
    if (onSave) {
      setTimeout(() => onSave(), 500);
    }
    
    return updated;
  });
}

/**
 * Handle class/style changes
 */
export function handleClassChange({
  slotId,
  newClass,
  newStyles = null,
  setElementClasses,
  setElementStyles,
  onSave
}) {
  if (newClass !== undefined) {
    setElementClasses(prev => ({ ...prev, [slotId]: newClass }));
  }
  
  if (newStyles) {
    if (Array.isArray(newStyles)) {
      // newStyles is an array of style keys to clear
      setElementStyles(prev => {
        const updated = { ...prev };
        const currentStyles = updated[slotId] || {};
        newStyles.forEach(styleKey => {
          delete currentStyles[styleKey];
        });
        updated[slotId] = currentStyles;
        return updated;
      });
    } else {
      // newStyles is a style object to merge
      setElementStyles(prev => ({
        ...prev,
        [slotId]: { ...(prev[slotId] || {}), ...newStyles }
      }));
    }
  }
  
  // Auto-save after class/style change
  if (onSave) {
    setTimeout(onSave, 500);
  }
}

/**
 * Generic publish changes handler
 */
export async function handlePublishChanges({
  getDraftId,
  slotConfigurationService,
  setIsPublishing,
  setPublishSuccess,
  reloadDraft
}) {
  setIsPublishing(true);
  setPublishSuccess(null);
  
  try {
    console.log('📤 Publishing changes...');
    const response = await slotConfigurationService.publishDraft(getDraftId());
    
    if (response?.success) {
      console.log('✅ Changes published successfully');
      setPublishSuccess(true);
      
      // Reload draft after successful publish
      if (reloadDraft) {
        setTimeout(reloadDraft, 1000);
      }
    } else {
      throw new Error(response?.message || 'Failed to publish changes');
    }
  } catch (error) {
    console.error('❌ Error publishing changes:', error);
    setPublishSuccess(false);
  } finally {
    setIsPublishing(false);
  }
}