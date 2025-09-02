/**
 * SlotWrapper - Simplified universal wrapper that renders slots
 * Store owners never touch this file
 */

import React from 'react';

const SlotWrapper = ({ 
  slotDefinitions = {},
  slotOrder = [],
  layoutConfig = {},
  data = {},
  className = "",
  children,
  ...props
}) => {
  // Simple slot renderer - just iterate through slotOrder and render components
  const renderSlots = () => {
    return slotOrder.map(slotId => {
      const slotDef = slotDefinitions[slotId];
      if (!slotDef) {
        console.warn(`Slot definition not found: ${slotId}`);
        return null;
      }
      
      // Get the component
      const Component = slotDef.component;
      if (!Component) {
        console.warn(`Component not found for slot: ${slotId}`);
        return null;
      }
      
      // Render the component with props
      return (
        <Component 
          key={slotId}
          {...slotDef.props}
          {...props}
          data={data}
          layoutConfig={layoutConfig}
        >
          {slotDef.children}
        </Component>
      );
    });
  };

  return (
    <div className={`slot-wrapper ${className}`}>
      {renderSlots()}
      {children}
    </div>
  );
};

export default SlotWrapper;