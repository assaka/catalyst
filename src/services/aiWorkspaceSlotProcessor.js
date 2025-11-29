/**
 * AIWorkspaceSlotProcessor - Service for processing AI slot commands
 * Parses AI responses, validates commands, and executes slot operations
 */

// Supported operations
export const SLOT_OPERATIONS = {
  ADD: 'add',
  MODIFY: 'modify',
  REMOVE: 'remove',
  MOVE: 'move',
  RESIZE: 'resize',
  REORDER: 'reorder'
};

// Slot types that can be created
export const SLOT_TYPES = {
  TEXT: 'text',
  BUTTON: 'button',
  IMAGE: 'image',
  CONTAINER: 'container',
  COMPONENT: 'component',
  HTML: 'html',
  GRID: 'grid',
  FLEX: 'flex'
};

/**
 * Command schema for AI slot operations
 * @typedef {Object} SlotCommand
 * @property {string} operation - One of SLOT_OPERATIONS
 * @property {string} pageType - Target page type
 * @property {Object} targetSlot - Target slot info
 * @property {string} targetSlot.id - Slot ID (for modify/remove/move)
 * @property {string} targetSlot.parentId - Parent container ID (for add)
 * @property {Object} payload - Operation-specific data
 */

class AIWorkspaceSlotProcessor {
  /**
   * Parse AI response to extract slot commands
   * Looks for JSON command blocks in the response
   * @param {string} response - AI response text
   * @returns {SlotCommand[]} Array of parsed commands
   */
  parseAIResponse(response) {
    const commands = [];

    // Try to find JSON command blocks in the response
    // Format: ```json { "operation": "add", ... } ```
    const jsonBlockRegex = /```json\s*([\s\S]*?)```/g;
    let match;

    while ((match = jsonBlockRegex.exec(response)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (this.isValidCommand(parsed)) {
          commands.push(parsed);
        }
      } catch (e) {
        console.warn('Failed to parse JSON block:', e);
      }
    }

    // Also try to find inline JSON objects (for simpler responses)
    // Look for { "operation": ... } patterns
    const inlineJsonRegex = /\{[^{}]*"operation"\s*:\s*"[^"]+(?:add|modify|remove|move|resize|reorder)"[^{}]*\}/g;
    while ((match = inlineJsonRegex.exec(response)) !== null) {
      try {
        const parsed = JSON.parse(match[0]);
        if (this.isValidCommand(parsed) && !commands.some(c => JSON.stringify(c) === JSON.stringify(parsed))) {
          commands.push(parsed);
        }
      } catch (e) {
        // Ignore parse errors for inline detection
      }
    }

    return commands;
  }

  /**
   * Validate a slot command structure
   * @param {Object} command - Command to validate
   * @returns {boolean} Whether command is valid
   */
  isValidCommand(command) {
    if (!command || typeof command !== 'object') return false;
    if (!command.operation || !Object.values(SLOT_OPERATIONS).includes(command.operation)) return false;

    // Operation-specific validation
    switch (command.operation) {
      case SLOT_OPERATIONS.ADD:
        return command.payload && command.payload.type;
      case SLOT_OPERATIONS.MODIFY:
        return command.targetSlot && command.targetSlot.id && command.payload;
      case SLOT_OPERATIONS.REMOVE:
        return command.targetSlot && command.targetSlot.id;
      case SLOT_OPERATIONS.MOVE:
        return command.targetSlot && command.targetSlot.id && command.payload;
      case SLOT_OPERATIONS.RESIZE:
        return command.targetSlot && command.targetSlot.id &&
               command.payload && (command.payload.colSpan !== undefined || command.payload.rowSpan !== undefined);
      case SLOT_OPERATIONS.REORDER:
        return command.targetSlot && command.targetSlot.id &&
               command.payload && command.payload.newIndex !== undefined;
      default:
        return false;
    }
  }

  /**
   * Validate command against current configuration
   * @param {SlotCommand} command - Command to validate
   * @param {Object} currentConfig - Current slot configuration
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateCommand(command, currentConfig) {
    const errors = [];
    const slots = currentConfig?.slots || {};

    // Check if target slot exists (for modify/remove/move/resize/reorder)
    if (command.operation !== SLOT_OPERATIONS.ADD) {
      if (!command.targetSlot?.id || !slots[command.targetSlot.id]) {
        errors.push(`Target slot '${command.targetSlot?.id}' not found`);
      }
    }

    // Check if parent exists (for add)
    if (command.operation === SLOT_OPERATIONS.ADD && command.targetSlot?.parentId) {
      if (!slots[command.targetSlot.parentId]) {
        errors.push(`Parent slot '${command.targetSlot.parentId}' not found`);
      }
    }

    // Validate colSpan range
    if (command.payload?.colSpan !== undefined) {
      if (command.payload.colSpan < 1 || command.payload.colSpan > 12) {
        errors.push(`colSpan must be between 1 and 12, got ${command.payload.colSpan}`);
      }
    }

    // Check protected slots
    const protectedSlots = ['main_layout', 'header_container', 'content_area', 'sidebar_area'];
    if (command.operation === SLOT_OPERATIONS.REMOVE && protectedSlots.includes(command.targetSlot?.id)) {
      errors.push(`Cannot remove protected slot '${command.targetSlot.id}'`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Execute a slot command using the provided handlers
   * @param {SlotCommand} command - Command to execute
   * @param {Object} currentSlots - Current slots object
   * @param {Object} handlers - Slot manipulation handlers
   * @returns {Object} Updated slots object
   */
  executeCommand(command, currentSlots, handlers) {
    const { createSlot, handleSlotDelete, handleClassChange, handleTextChange, handleSlotDrop, updateSlotConfig } = handlers;

    switch (command.operation) {
      case SLOT_OPERATIONS.ADD:
        return this._executeAdd(command, currentSlots, createSlot);

      case SLOT_OPERATIONS.MODIFY:
        return this._executeModify(command, currentSlots, handleClassChange, handleTextChange, updateSlotConfig);

      case SLOT_OPERATIONS.REMOVE:
        return handleSlotDelete(command.targetSlot.id, currentSlots);

      case SLOT_OPERATIONS.MOVE:
        return handleSlotDrop(
          command.targetSlot.id,
          command.payload.targetContainerId,
          command.payload.position || 'inside',
          currentSlots
        );

      case SLOT_OPERATIONS.RESIZE:
        return this._executeResize(command, currentSlots, updateSlotConfig);

      case SLOT_OPERATIONS.REORDER:
        return this._executeReorder(command, currentSlots, handleSlotDrop);

      default:
        console.warn('Unknown operation:', command.operation);
        return currentSlots;
    }
  }

  /**
   * Execute ADD operation
   */
  _executeAdd(command, currentSlots, createSlot) {
    const { payload, targetSlot } = command;

    const newSlots = createSlot(
      payload.type,
      payload.content || '',
      targetSlot?.parentId || null,
      {
        className: payload.className || '',
        styles: payload.styles || {},
        colSpan: payload.colSpan || 12,
        rowSpan: payload.rowSpan || 1,
        position: payload.position || { col: 1, row: 1 },
        metadata: payload.metadata || {}
      },
      currentSlots
    );

    return newSlots;
  }

  /**
   * Execute MODIFY operation
   */
  _executeModify(command, currentSlots, handleClassChange, handleTextChange, updateSlotConfig) {
    const { targetSlot, payload } = command;
    let updatedSlots = { ...currentSlots };

    // Update content if provided
    if (payload.content !== undefined) {
      updatedSlots = handleTextChange(targetSlot.id, payload.content, updatedSlots) || updatedSlots;
    }

    // Update className/styles if provided
    if (payload.className !== undefined || payload.styles !== undefined) {
      updatedSlots = handleClassChange(
        targetSlot.id,
        payload.className || updatedSlots[targetSlot.id]?.className,
        payload.styles || updatedSlots[targetSlot.id]?.styles,
        payload.metadata || null,
        false,
        updatedSlots
      ) || updatedSlots;
    }

    // Update other properties directly
    if (payload.colSpan !== undefined || payload.rowSpan !== undefined || payload.position !== undefined) {
      const slot = updatedSlots[targetSlot.id];
      if (slot) {
        updatedSlots = {
          ...updatedSlots,
          [targetSlot.id]: {
            ...slot,
            ...(payload.colSpan !== undefined && { colSpan: payload.colSpan }),
            ...(payload.rowSpan !== undefined && { rowSpan: payload.rowSpan }),
            ...(payload.position !== undefined && { position: payload.position })
          }
        };
      }
    }

    return updatedSlots;
  }

  /**
   * Execute RESIZE operation
   */
  _executeResize(command, currentSlots, updateSlotConfig) {
    const { targetSlot, payload } = command;
    const slot = currentSlots[targetSlot.id];

    if (!slot) return currentSlots;

    return {
      ...currentSlots,
      [targetSlot.id]: {
        ...slot,
        colSpan: payload.colSpan ?? slot.colSpan,
        rowSpan: payload.rowSpan ?? slot.rowSpan
      }
    };
  }

  /**
   * Execute REORDER operation
   */
  _executeReorder(command, currentSlots, handleSlotDrop) {
    const { targetSlot, payload } = command;
    const slot = currentSlots[targetSlot.id];

    if (!slot) return currentSlots;

    // Get siblings in the same parent
    const siblings = Object.values(currentSlots)
      .filter(s => s.parentId === slot.parentId)
      .sort((a, b) => (a.position?.row || 0) - (b.position?.row || 0));

    // Find the target sibling based on newIndex
    const targetSibling = siblings[payload.newIndex];
    if (targetSibling) {
      return handleSlotDrop(
        targetSlot.id,
        targetSibling.id,
        payload.newIndex > siblings.findIndex(s => s.id === targetSlot.id) ? 'after' : 'before',
        currentSlots
      );
    }

    return currentSlots;
  }

  /**
   * Generate AI-friendly context about the current page configuration
   * @param {string} pageType - Current page type
   * @param {Object} config - Current slot configuration
   * @returns {string} Context string for AI prompt
   */
  generateSlotContext(pageType, config) {
    const slots = config?.slots || {};
    const slotList = Object.values(slots);

    // Build a summary of the current layout
    const containerSlots = slotList.filter(s => s.type === 'container' || s.type === 'grid' || s.type === 'flex');
    const contentSlots = slotList.filter(s => ['text', 'button', 'image', 'component', 'html'].includes(s.type));

    let context = `Current ${pageType} page layout:\n`;
    context += `- Total slots: ${slotList.length}\n`;
    context += `- Containers: ${containerSlots.length}\n`;
    context += `- Content slots: ${contentSlots.length}\n\n`;

    // List main containers
    context += `Main containers:\n`;
    containerSlots.forEach(slot => {
      const children = slotList.filter(s => s.parentId === slot.id);
      context += `- ${slot.id} (${slot.type}): ${children.length} children, colSpan: ${slot.colSpan || 12}\n`;
    });

    // List content slots briefly
    context += `\nContent slots:\n`;
    contentSlots.slice(0, 10).forEach(slot => {
      const preview = slot.content ? slot.content.substring(0, 30) : '[no content]';
      context += `- ${slot.id} (${slot.type}): "${preview}..."\n`;
    });

    if (contentSlots.length > 10) {
      context += `... and ${contentSlots.length - 10} more\n`;
    }

    return context;
  }

  /**
   * Generate example commands for AI guidance
   * @param {string} operation - Operation type
   * @returns {string} Example command JSON
   */
  getExampleCommand(operation) {
    const examples = {
      [SLOT_OPERATIONS.ADD]: {
        operation: 'add',
        pageType: 'product',
        targetSlot: { parentId: 'main_layout' },
        payload: {
          type: 'text',
          content: 'New promotional banner',
          className: 'bg-blue-100 p-4 rounded text-center',
          colSpan: 12,
          position: { col: 1, row: 1 }
        }
      },
      [SLOT_OPERATIONS.MODIFY]: {
        operation: 'modify',
        pageType: 'product',
        targetSlot: { id: 'product_title' },
        payload: {
          className: 'text-3xl font-bold text-gray-900',
          styles: { color: '#1a1a1a' }
        }
      },
      [SLOT_OPERATIONS.REMOVE]: {
        operation: 'remove',
        pageType: 'product',
        targetSlot: { id: 'unwanted_slot' }
      },
      [SLOT_OPERATIONS.RESIZE]: {
        operation: 'resize',
        pageType: 'product',
        targetSlot: { id: 'sidebar' },
        payload: { colSpan: 4 }
      }
    };

    return JSON.stringify(examples[operation] || examples[SLOT_OPERATIONS.ADD], null, 2);
  }
}

// Export singleton instance
const aiWorkspaceSlotProcessor = new AIWorkspaceSlotProcessor();
export default aiWorkspaceSlotProcessor;

// Also export the class for testing
export { AIWorkspaceSlotProcessor };
