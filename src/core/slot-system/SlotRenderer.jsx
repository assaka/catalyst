/**
 * SlotRenderer - Core component that renders slots with user customizations
 * This is the heart of the new micro-slot system
 */

import React from 'react';
import slotRegistry from './SlotRegistry.js';

/**
 * SlotRenderer - Renders a specific slot with proper context and props
 */
export const SlotRenderer = ({ 
  slotId, 
  context = {}, 
  fallback = null, 
  ...props 
}) => {
  // Get component and configuration for this slot
  const Component = slotRegistry.getComponent(slotId, context);
  const config = slotRegistry.getSlotConfig(slotId);

  // If slot is disabled, don't render anything
  if (config.enabled === false) {
    return null;
  }

  // If no component found, render fallback
  if (!Component) {
    if (fallback) {
      return React.isValidElement(fallback) ? fallback : React.createElement(fallback, props);
    }
    
    // In development, show what slot is missing
    if (process.env.NODE_ENV === 'development') {
      return (
        <div 
          style={{ 
            border: '2px dashed #ff6b6b', 
            padding: '8px', 
            margin: '4px', 
            borderRadius: '4px',
            background: '#ffebee',
            fontSize: '12px',
            color: '#c62828'
          }}
        >
          Missing slot: {slotId}
        </div>
      );
    }
    
    return null;
  }

  // Merge props: base props + config props + passed props
  const mergedProps = {
    // Base slot props
    slotId,
    context,
    
    // Default props from configuration
    ...config.defaultProps,
    
    // User override props
    ...config.props,
    
    // Props passed to SlotRenderer (highest priority)
    ...props
  };

  try {
    return <Component {...mergedProps} />;
  } catch (error) {
    console.error(`❌ Error rendering slot ${slotId}:`, error);
    
    // In development, show error
    if (process.env.NODE_ENV === 'development') {
      return (
        <div 
          style={{ 
            border: '2px solid #f44336', 
            padding: '8px', 
            margin: '4px', 
            borderRadius: '4px',
            background: '#ffebee',
            fontSize: '12px',
            color: '#c62828'
          }}
        >
          Error in slot: {slotId}<br />
          {error.message}
        </div>
      );
    }
    
    return fallback || null;
  }
};

/**
 * SlotContainer - Renders multiple slots in order for a component
 */
export const SlotContainer = ({ 
  componentName, 
  context = {}, 
  className = '',
  children,
  ...props 
}) => {
  const enabledSlots = slotRegistry.getEnabledSlotsForComponent(componentName);

  return (
    <div className={className}>
      {enabledSlots.map(({ slotId, config }) => (
        <SlotRenderer
          key={slotId}
          slotId={slotId}
          context={{ ...context, component: componentName }}
          {...props}
        />
      ))}
      {children}
    </div>
  );
};

/**
 * withSlots - HOC to enhance a component with slot rendering capabilities
 */
export const withSlots = (WrappedComponent, componentName) => {
  return React.forwardRef((props, ref) => {
    const enabledSlots = slotRegistry.getEnabledSlotsForComponent(componentName);
    
    const slotProps = {
      ...props,
      slots: enabledSlots.reduce((acc, { slotId }) => {
        acc[slotId] = (additionalProps = {}) => (
          <SlotRenderer
            slotId={slotId}
            context={{ component: componentName }}
            {...props}
            {...additionalProps}
          />
        );
        return acc;
      }, {}),
      renderSlot: (slotId, additionalProps = {}) => (
        <SlotRenderer
          slotId={slotId}
          context={{ component: componentName }}
          {...props}
          {...additionalProps}
        />
      )
    };

    return <WrappedComponent ref={ref} {...slotProps} />;
  });
};

export default SlotRenderer;