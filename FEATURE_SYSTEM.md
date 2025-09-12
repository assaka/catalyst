# Custom Feature Builder System

A comprehensive, generic system for creating and managing interactive features across the entire Catalyst platform.

## Overview

The Feature Builder provides a unified way to create custom functionality for:
- **Slot Editor Interactions** - Add interactive behaviors to cart slots
- **Plugin/Extension System** - Extend core functionality 
- **Business Process Automation** - Custom workflows and actions
- **API Endpoints** - Custom server-side functionality
- **UI Components** - Reusable interactive components

## Architecture

### Core Components

1. **FeatureRegistry** (`src/utils/featureBuilder/FeatureRegistry.js`)
   - Manages built-in and custom features
   - Handles secure execution with sandboxing
   - Provides parameter validation and sanitization
   - Tracks usage analytics and execution history

2. **CustomFeatureBuilder** (`src/components/editor/features/CustomFeatureBuilder.jsx`)
   - Visual interface for creating custom features
   - Parameter definition with type validation
   - Code editor with API reference
   - Real-time testing and validation

3. **FeatureIntegration** (`src/components/editor/features/FeatureIntegration.jsx`)
   - Integrates features into existing components
   - Manages feature assignment and execution
   - Provides UI for configuring feature parameters

## Security Features

### XSS Prevention
- All HTML content sanitized with DOMPurify
- Multiple security levels (strict, editor, permissive)
- Real-time validation feedback in UI

### Sandboxed Execution
- JavaScript code runs in isolated scope
- Controlled API access only
- Timeout protection (5 second limit)
- Parameter validation and sanitization

### Safe API Surface
```javascript
// Available methods in custom features:
api.getData(key)              // Get stored data
api.setData(key, value)       // Store data securely
api.showToast(message, type)  // Show notifications
api.addClass(id, className)   // Safe DOM manipulation
api.setText(id, text)         // Update text content
api.fetch(url, options)       // Controlled HTTP requests
api.emit(eventName, data)     // Custom events
```

## Usage Examples

### 1. E-commerce Feature: Wishlist Toggle
```javascript
// Custom feature code
const productId = params.productId;
const wishlist = api.getData('wishlist') || [];

if (wishlist.includes(productId)) {
  // Remove from wishlist
  const updated = wishlist.filter(id => id !== productId);
  api.setData('wishlist', updated);
  api.showToast('Removed from wishlist', 'info');
  api.setText('wishlist-button', '♡ Add to Wishlist');
} else {
  // Add to wishlist
  wishlist.push(productId);
  api.setData('wishlist', wishlist);
  api.showToast('Added to wishlist!', 'success');
  api.setText('wishlist-button', '♥ In Wishlist');
}

return { success: true, wishlistCount: wishlist.length };
```

### 2. Plugin Extension: Analytics Tracker
```javascript
// Track custom events
const eventData = {
  action: params.action,
  element: params.elementId,
  timestamp: new Date().toISOString(),
  userId: context.userId
};

api.fetch('/api/analytics/track', {
  method: 'POST',
  body: JSON.stringify(eventData)
});

api.emit('analytics-tracked', eventData);
```

### 3. UI Component: Dynamic Counter
```javascript
// Increment counter with animation
const currentCount = parseInt(api.getData('counter') || 0);
const newCount = currentCount + (params.increment || 1);

api.setData('counter', newCount);
api.setText('counter-display', newCount.toString());
api.addClass('counter-display', 'animate-bounce');

setTimeout(() => {
  api.removeClass('counter-display', 'animate-bounce');
}, 500);

return { count: newCount };
```

## Feature Categories

- **E-commerce**: Cart operations, wishlist, product comparison
- **UI Interaction**: Animations, toggles, modal dialogs  
- **Data Management**: CRUD operations, data validation
- **Integration**: Third-party APIs, webhooks, notifications
- **Automation**: Scheduled tasks, conditional logic
- **Analytics**: Event tracking, user behavior analysis
- **Security**: Access control, audit logging
- **Utility**: String manipulation, date formatting

## Integration Points

### Slot Editor (EditorSidebar)
Features appear in "Interactive Features" section with:
- Feature library browser
- Parameter configuration forms  
- Real-time testing interface
- Assignment management

### Plugin System
Features can be registered as plugin hooks:
```javascript
// In plugin code
featureRegistry.registerCustom('my-plugin-feature', {
  name: 'Custom Plugin Action',
  contexts: [FEATURE_CONTEXTS.PLUGIN_HOOK],
  // ... feature definition
});
```

### API Endpoints
Server-side features for custom endpoints:
```javascript
// Custom API feature
const validation = params.validationRules;
const data = params.requestData;

// Custom validation logic
const isValid = validateData(data, validation);

if (!isValid) {
  return { error: 'Validation failed', code: 400 };
}

// Process data
return { success: true, processedData: data };
```

## Future Enhancements

- **Feature Marketplace**: Share and install community features
- **Version Control**: Track feature changes and rollbacks  
- **Performance Monitoring**: Execution time and resource usage
- **Visual Flow Builder**: Drag-and-drop feature composition
- **AI-Assisted Creation**: Generate features from natural language
- **Multi-tenant Features**: Organization-specific feature libraries

## Getting Started

1. Open any slot in the CartSlotsEditor
2. Navigate to the "Interactive Features" section in EditorSidebar
3. Click "Custom" to open the Feature Builder
4. Define your feature parameters and code
5. Test and save your custom feature
6. Assign it to elements and configure parameters

The system is designed to be intuitive for non-developers while providing powerful capabilities for advanced users.