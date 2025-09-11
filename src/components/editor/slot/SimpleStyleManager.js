// Simple style manager that avoids React state issues
class SimpleStyleManager {
  constructor() {
    this.changes = new Map();
    this.saveTimeout = null;
  }

  // Apply style directly to DOM element
  applyStyle(element, property, value) {
    try {
      if (!element) return false;
      
      // Direct DOM manipulation
      if (property.startsWith('class_')) {
        // Handle class-based changes (Tailwind)
        const actualProperty = property.replace('class_', '');
        this.updateClassName(element, actualProperty, value);
      } else {
        // Handle inline style changes
        element.style[property] = value;
      }
      
      // Track the change for persistence
      const elementId = element.getAttribute('data-slot-id') || element.id;
      if (elementId) {
        this.trackChange(elementId, property, value);
      }
      
      return true;
    } catch (error) {
      console.warn(`Failed to apply ${property}: ${value}`, error);
      return false;
    }
  }

  // Handle class-based styling (Tailwind)
  updateClassName(element, property, value) {
    const currentClasses = element.className.split(' ').filter(Boolean);
    let newClasses = [...currentClasses];

    switch (property) {
      case 'fontSize':
        // Remove existing font size classes
        newClasses = newClasses.filter(cls => !cls.startsWith('text-'));
        newClasses.push(`text-${value}`);
        break;
      case 'fontWeight':
        if (value === 'bold') {
          if (!newClasses.includes('font-bold')) {
            newClasses.push('font-bold');
          }
        } else {
          newClasses = newClasses.filter(cls => cls !== 'font-bold');
        }
        break;
      case 'fontStyle':
        if (value === 'italic') {
          if (!newClasses.includes('italic')) {
            newClasses.push('italic');
          }
        } else {
          newClasses = newClasses.filter(cls => cls !== 'italic');
        }
        break;
      case 'textAlign':
        // Remove existing text align classes
        newClasses = newClasses.filter(cls => !cls.startsWith('text-left') && !cls.startsWith('text-center') && !cls.startsWith('text-right'));
        newClasses.push(`text-${value}`);
        break;
    }

    element.className = newClasses.join(' ');
  }

  // Track changes for persistence
  trackChange(elementId, property, value) {
    if (!this.changes.has(elementId)) {
      this.changes.set(elementId, {});
    }
    
    const elementChanges = this.changes.get(elementId);
    elementChanges[property] = value;
    elementChanges.lastModified = Date.now();

    // Debounced save
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.persistChanges();
    }, 500);
  }

  // Simple persistence to localStorage
  persistChanges() {
    try {
      const serializedChanges = {};
      this.changes.forEach((changes, elementId) => {
        serializedChanges[elementId] = changes;
      });
      
      localStorage.setItem('editor_style_changes', JSON.stringify(serializedChanges));
      console.log('💾 Persisted style changes:', serializedChanges);
    } catch (error) {
      console.warn('Failed to persist changes:', error);
    }
  }

  // Load changes from localStorage
  loadChanges() {
    try {
      const saved = localStorage.getItem('editor_style_changes');
      if (saved) {
        const changes = JSON.parse(saved);
        Object.entries(changes).forEach(([elementId, elementChanges]) => {
          this.changes.set(elementId, elementChanges);
        });
        return changes;
      }
    } catch (error) {
      console.warn('Failed to load changes:', error);
    }
    return {};
  }

  // Apply saved changes to DOM
  applySavedChanges() {
    const saved = this.loadChanges();
    
    Object.entries(saved).forEach(([elementId, changes]) => {
      const element = document.querySelector(`[data-slot-id="${elementId}"]`) || 
                     document.getElementById(elementId);
      
      if (element && changes) {
        Object.entries(changes).forEach(([property, value]) => {
          if (property !== 'lastModified') {
            this.applyStyle(element, property, value);
          }
        });
      }
    });
  }

  // Clear all changes
  clearChanges() {
    this.changes.clear();
    localStorage.removeItem('editor_style_changes');
  }
}

// Export singleton instance
export const styleManager = new SimpleStyleManager();