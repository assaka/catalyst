// Simple style manager that avoids React state issues
class SimpleStyleManager {
  constructor() {
    this.changes = new Map();
    this.saveTimeout = null;
    this.databaseSaveCallback = null; // Will be set by the parent component
  }

  // Set the database save callback from parent component
  setDatabaseSaveCallback(callback) {
    this.databaseSaveCallback = callback;
  }

  // Apply style directly to DOM element
  applyStyle(element, property, value) {
    try {
      if (!element) {
        console.warn('❌ No element provided to applyStyle');
        return false;
      }

      // For button slots (type: 'button'), apply styles to the actual button element, not the wrapper
      let targetElement = element;
      if (element.hasAttribute('data-slot-id')) {
        // Check for button element (for slots with type: 'button')
        const button = element.querySelector('button');
        // Also check for text elements (span with data-editable)
        const textElement = element.querySelector('span[data-editable="true"]');
        // Also check for input elements
        const inputElement = element.querySelector('input');

        if (button) {
          targetElement = button;
          console.log(`🎨 Applying style to button element instead of wrapper`);
        } else if (textElement) {
          targetElement = textElement;
          console.log(`🎨 Applying style to text element instead of wrapper`);
        } else if (inputElement) {
          targetElement = inputElement;
          console.log(`🎨 Applying style to input element instead of wrapper`);
        }
        // For other types (image, container, etc.), keep using the wrapper element
      }

      // Direct DOM manipulation
      if (property.startsWith('class_')) {
        // Handle class-based changes (Tailwind)
        const actualProperty = property.replace('class_', '');
        this.updateClassName(targetElement, actualProperty, value);
      } else {
        // Handle inline style changes
        targetElement.style[property] = value;
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
        // Remove existing font size classes only (not alignment classes)
        const fontSizeClasses = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl', 'text-9xl'];
        newClasses = newClasses.filter(cls => !fontSizeClasses.includes(cls));
        newClasses.push(`text-${value}`);
        break;
      case 'fontWeight':
        // Remove existing font-weight classes to avoid conflicts
        const fontWeightClasses = ['font-thin', 'font-extralight', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black'];
        newClasses = newClasses.filter(cls => !fontWeightClasses.includes(cls));
        
        if (value === 'bold') {
          // Check if bold was already present (simple toggle check)
          const wasBold = currentClasses.includes('font-bold') || currentClasses.includes('font-semibold');
          if (wasBold) {
              newClasses.push('font-normal'); // Explicitly set normal weight
          } else {
            newClasses.push('font-bold');
          }
        } else {
          newClasses.push('font-normal');
        }
        break;
      case 'fontStyle':
        if (value === 'italic') {
          // Toggle behavior: if already italic, remove it; if not italic, add it
          if (newClasses.includes('italic')) {
            newClasses = newClasses.filter(cls => cls !== 'italic');
          } else {
            newClasses.push('italic');
            console.log('🔄 Toggled ON italic');
          }
        } else {
          newClasses = newClasses.filter(cls => cls !== 'italic');
        }
        break;
      // textAlign is now handled by EditorSidebar and applied to parent element
    }

    const oldClassName = element.className;
    const newClassName = newClasses.join(' ');
    element.className = newClassName;
    
    console.log('🎨 Class update:', {
      element: element.tagName + (element.id ? `#${element.id}` : ''),
      oldClassName,
      newClassName,
      property,
      value
    });
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
    }, 1000);
  }

  // Persist changes to both localStorage and database
  persistChanges() {
    try {
      // Convert changes to database format
      const databaseUpdates = {};
      
      this.changes.forEach((changes, elementId) => {
        // Get the current element to read its latest className and styles
        const element = document.querySelector(`[data-slot-id="${elementId}"]`) || 
                       document.getElementById(elementId);
        
        if (element) {
          // Collect inline styles from the element
          const styles = {};
          const elementStyle = element.style;
          
          // Get all inline styles using getPropertyValue for reliability
          const styleProperties = [];
          for (let i = 0; i < elementStyle.length; i++) {
            styleProperties.push(elementStyle[i]);
          }
          
          styleProperties.forEach(property => {
            const value = elementStyle.getPropertyValue(property);
            if (value && value.trim() !== '') {
              styles[property] = value;
            }
          });
          
          console.log('💾 Collected styles for', elementId, ':', styles, 'from element style length:', elementStyle.length);
          
          // Save both className and actual inline styles
          databaseUpdates[elementId] = {
            className: element.className,
            styles: styles,
            metadata: {
              lastModified: new Date().toISOString()
            }
          };
        }
      });
      
      // Save to localStorage for backup
      localStorage.setItem('editor_style_changes', JSON.stringify(databaseUpdates));
      
      // Save to database if callback is available
      if (this.databaseSaveCallback && Object.keys(databaseUpdates).length > 0) {
        console.log('💾 STYLE PERSISTENCE - Saving to database:', databaseUpdates);
        this.databaseSaveCallback(databaseUpdates);
      } else {
        console.log('💾 STYLE PERSISTENCE - Persisted to localStorage only:', databaseUpdates);
        console.log('💾 STYLE PERSISTENCE - Database callback available?', !!this.databaseSaveCallback);
      }
      
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

    console.log('🔄 SimpleStyleManager - Applying saved changes:', {
      savedChangesCount: Object.keys(saved).length,
      changes: saved
    });

    Object.entries(saved).forEach(([elementId, changes]) => {
      const element = document.querySelector(`[data-slot-id="${elementId}"]`) ||
                     document.getElementById(elementId);

      console.log(`🔍 SimpleStyleManager - Looking for element ${elementId}:`, {
        found: !!element,
        changes: changes,
        hasStyles: changes.styles && Object.keys(changes.styles).length > 0
      });

      if (element && changes) {
        // Apply styles from the saved configuration
        if (changes.styles && typeof changes.styles === 'object') {
          Object.entries(changes.styles).forEach(([property, value]) => {
            if (value && value !== '' && property !== 'lastModified') {
              try {
                element.style[property] = value;
                console.log(`✅ SimpleStyleManager - Applied ${property}: ${value} to ${elementId}`);
              } catch (error) {
                console.warn(`❌ SimpleStyleManager - Failed to apply ${property}: ${value}`, error);
              }
            }
          });
        }

        // Apply className if available
        if (changes.className && changes.className !== element.className) {
          element.className = changes.className;
          console.log(`✅ SimpleStyleManager - Applied className: ${changes.className} to ${elementId}`);
        }
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