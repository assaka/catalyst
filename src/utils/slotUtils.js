/**
 * Utility functions for managing hierarchical slot structure using parentId relationships
 */

// Slot Manager for parentId-based hierarchy
export class SlotManager {
  static generateSlotId(type = 'slot') {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  static getRootSlots(slots) {
    return Object.values(slots)
      .filter(slot => slot.parentId === null)
      .sort((a, b) => (a.position?.row || 0) - (b.position?.row || 0));
  }
  
  static getChildSlots(slots, parentId) {
    const allSlots = Object.values(slots);
    console.log(`🔍 SlotManager.getChildSlots - parentId: ${parentId}, total slots: ${allSlots.length}`);

    const childSlots = allSlots.filter(slot => {
      const isChild = slot.parentId === parentId;
      if (slot.id.includes('products') || slot.id.includes('cms')) {
        console.log(`🎯 SlotManager checking ${slot.id}: parentId=${slot.parentId}, target=${parentId}, isChild=${isChild}, row=${slot.position?.row}`);
      }
      return isChild;
    });

    console.log(`🔍 SlotManager.getChildSlots result for parentId ${parentId}:`, childSlots.map(s => ({ id: s.id, row: s.position?.row })));

    // Sort by position.row, fallback to 0
    const sorted = childSlots.sort((a, b) => {
      const aRow = a.position?.row || 0;
      const bRow = b.position?.row || 0;
      if (parentId === 'products_container' || childSlots.some(s => s.id.includes('products'))) {
        console.log(`🔄 Sorting ${a.id} (row ${aRow}) vs ${b.id} (row ${bRow})`);
      }
      return aRow - bRow;
    });

    if (parentId === 'products_container') {
      console.log(`📊 Final sorted order for products_container:`, sorted.map(s => ({ id: s.id, row: s.position?.row })));
    }

    return sorted;
  }
  
  static moveSlot(slots, slotId, newParentId, newPosition) {
    const slot = slots[slotId];
    if (!slot) return slots;
    
    // Simply update the slot's parent and position
    slot.parentId = newParentId;
    slot.position = newPosition;
    slot.metadata = slot.metadata || {};
    slot.metadata.lastModified = new Date().toISOString();
    
    return { ...slots };
  }
  
  static createSlot(type, parentId = null, position = { col: 1, row: 0 }) {
    return {
      id: this.generateSlotId(type),
      type,
      content: '',
      parentId,
      position,
      className: '',
      styles: {},
      metadata: {
        name: `New ${type}`,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };
  }
  
  static deleteSlot(slots, slotId) {
    const newSlots = { ...slots };
    
    // Recursively delete children using parentId relationships
    const deleteRecursive = (id) => {
      const childSlots = this.getChildSlots(newSlots, id);
      childSlots.forEach(child => deleteRecursive(child.id));
      delete newSlots[id];
    };
    
    deleteRecursive(slotId);
    return newSlots;
  }
  
  static renderSlotHierarchy(slots, parentId = null, level = 0) {
    const childSlots = this.getChildSlots(slots, parentId);
    return childSlots.map(slot => ({
      ...slot,
      level,
      children: this.renderSlotHierarchy(slots, slot.id, level + 1)
    }));
  }
}

export default SlotManager;