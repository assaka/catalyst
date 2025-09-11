/**
 * Unified Save Manager for Editor Changes
 * Handles all types of changes with a single debouncing mechanism
 */

class SaveManager {
  constructor() {
    this.pendingChanges = new Map(); // slotId -> change data
    this.saveTimeout = null;
    this.saveCallback = null;
    this.debounceDelay = 1000; // 1 second
    this.isEnabled = true;
  }

  // Set the save callback function
  setSaveCallback(callback) {
    this.saveCallback = callback;
    console.log('💾 Save callback registered');
  }

  // Enable/disable saving (useful for bulk operations)
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled && this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }

  // Record a change and schedule save
  recordChange(slotId, changeType, changeData) {
    if (!this.isEnabled) return;

    console.log('🔄 Recording change:', { slotId, changeType, changeData, timestamp: Date.now() });

    // Store the change (overwrites previous change for same slot)
    this.pendingChanges.set(slotId, {
      type: changeType,
      data: changeData,
      timestamp: Date.now()
    });

    // Reset debounce timer
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Schedule save
    this.saveTimeout = setTimeout(() => {
      this.executeSave();
    }, this.debounceDelay);

    console.log(`⏰ Scheduled save in ${this.debounceDelay}ms (${this.pendingChanges.size} changes pending)`);
  }

  // Execute the actual save
  async executeSave() {
    if (!this.saveCallback || this.pendingChanges.size === 0) {
      console.log('❌ Cannot save: no callback or no changes');
      return;
    }

    const changesToSave = new Map(this.pendingChanges);
    this.pendingChanges.clear();
    this.saveTimeout = null;

    console.log('💾 Executing save for changes:', Array.from(changesToSave.entries()));

    try {
      await this.saveCallback(changesToSave);
      console.log('✅ Save completed successfully');
    } catch (error) {
      console.error('❌ Save failed:', error);
      // Could re-add failed changes back to pending if needed
    }
  }

  // Force immediate save (skip debouncing)
  async forceSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    await this.executeSave();
  }

  // Clear all pending changes without saving
  clearPending() {
    this.pendingChanges.clear();
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    console.log('🗑️ Cleared all pending changes');
  }

  // Get pending changes (for debugging)
  getPendingChanges() {
    return Array.from(this.pendingChanges.entries());
  }
}

// Export singleton instance
export const saveManager = new SaveManager();

// Change types constants
export const CHANGE_TYPES = {
  TEXT_CONTENT: 'text_content',
  ELEMENT_STYLES: 'element_styles', 
  ELEMENT_CLASSES: 'element_classes',
  PARENT_CLASSES: 'parent_classes',
  SLOT_RESIZE: 'slot_resize',
  ELEMENT_RESIZE: 'element_resize',
  SLOT_POSITION: 'slot_position'
};

export default SaveManager;