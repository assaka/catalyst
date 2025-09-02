/**
 * SlotParser - Universal parser for any page slot configuration
 * Converts simple slot definitions into renderable components
 * Store owners never touch this file
 */

import React from 'react';

class SlotParser {
  constructor(slotDefinitions) {
    this.slotDefinitions = slotDefinitions;
    this.componentRegistry = new Map();
    this.layoutRegistry = new Map();
  }

  // Register a component for use in slots
  registerComponent(name, component) {
    this.componentRegistry.set(name, component);
  }

  // Register a layout for use in slots
  registerLayout(name, layoutComponent) {
    this.layoutRegistry.set(name, layoutComponent);
  }

  // Parse slot definition into React component
  parseSlot(slotId, slotConfig = {}) {
    const definition = this.slotDefinitions[slotId];
    if (!definition) {
      console.warn(`Slot definition not found: ${slotId}`);
      return null;
    }

    // Handle different slot types
    switch (definition.type) {
      case 'component':
        return this.parseComponent(definition, slotConfig);
      case 'container':
        return this.parseContainer(definition, slotConfig);
      case 'layout':
        return this.parseLayout(definition, slotConfig);
      case 'micro-slot':
        return this.parseMicroSlot(definition, slotConfig);
      default:
        console.warn(`Unknown slot type: ${definition.type}`);
        return null;
    }
  }

  // Parse a simple component slot
  parseComponent(definition, config) {
    const Component = this.componentRegistry.get(definition.component);
    if (!Component) {
      console.warn(`Component not found: ${definition.component}`);
      return <div>Component not found: {definition.component}</div>;
    }

    const props = {
      ...definition.defaultProps,
      ...config.props,
      className: this.buildClassName(definition, config),
      style: this.buildStyle(definition, config)
    };

    return <Component key={definition.id} {...props} />;
  }

  // Parse a container slot with children
  parseContainer(definition, config) {
    const Container = this.componentRegistry.get(definition.component) || 'div';
    
    const props = {
      ...definition.defaultProps,
      ...config.props,
      className: this.buildClassName(definition, config),
      style: this.buildStyle(definition, config)
    };

    return (
      <Container key={definition.id} {...props}>
        {definition.children?.map(childSlotId => 
          this.parseSlot(childSlotId, config.children?.[childSlotId])
        )}
      </Container>
    );
  }

  // Parse a layout slot (flexbox, grid, etc.)
  parseLayout(definition, config) {
    const layoutType = config.layoutType || definition.defaultLayout || 'flex';
    const LayoutComponent = this.layoutRegistry.get(layoutType) || this.getDefaultLayout(layoutType);

    return (
      <LayoutComponent
        key={definition.id}
        config={config}
        definition={definition}
      >
        {definition.slots?.map(slotId => 
          this.parseSlot(slotId, config.slots?.[slotId])
        )}
      </LayoutComponent>
    );
  }

  // Parse micro-slots within a component
  parseMicroSlot(definition, config) {
    const MicroSlotContainer = definition.container || 'div';
    
    return (
      <MicroSlotContainer
        key={definition.id}
        className={this.buildClassName(definition, config)}
        style={this.buildStyle(definition, config)}
      >
        {(config.order || definition.defaultOrder)?.map(microSlotId => {
          const microDefinition = definition.microSlots[microSlotId];
          if (!microDefinition) return null;
          
          return this.parseSlot(microSlotId, config.microSlots?.[microSlotId]);
        })}
      </MicroSlotContainer>
    );
  }

  // Build className from definition and config
  buildClassName(definition, config) {
    const baseClasses = definition.className || '';
    const configClasses = config.className || '';
    const layoutClasses = this.getLayoutClasses(config.layout);
    
    return [baseClasses, configClasses, layoutClasses]
      .filter(Boolean)
      .join(' ');
  }

  // Build style object from definition and config
  buildStyle(definition, config) {
    return {
      ...definition.style,
      ...config.style,
      ...this.getLayoutStyles(config.layout)
    };
  }

  // Get layout classes based on configuration
  getLayoutClasses(layout) {
    if (!layout) return '';
    
    const classes = [];
    
    // Flexbox classes
    if (layout.display === 'flex') {
      classes.push('flex');
      if (layout.direction) classes.push(`flex-${layout.direction}`);
      if (layout.justify) classes.push(`justify-${layout.justify}`);
      if (layout.align) classes.push(`items-${layout.align}`);
      if (layout.wrap) classes.push('flex-wrap');
      if (layout.gap) classes.push(`gap-${layout.gap}`);
    }
    
    // Grid classes
    if (layout.display === 'grid') {
      classes.push('grid');
      if (layout.cols) classes.push(`grid-cols-${layout.cols}`);
      if (layout.rows) classes.push(`grid-rows-${layout.rows}`);
      if (layout.gap) classes.push(`gap-${layout.gap}`);
    }

    // Spacing classes
    if (layout.padding) classes.push(`p-${layout.padding}`);
    if (layout.margin) classes.push(`m-${layout.margin}`);
    
    return classes.join(' ');
  }

  // Get layout styles for CSS
  getLayoutStyles(layout) {
    if (!layout) return {};
    
    const styles = {};
    
    if (layout.width) styles.width = layout.width;
    if (layout.height) styles.height = layout.height;
    if (layout.maxWidth) styles.maxWidth = layout.maxWidth;
    if (layout.maxHeight) styles.maxHeight = layout.maxHeight;
    
    return styles;
  }

  // Get default layout component
  getDefaultLayout(type) {
    const defaultLayouts = {
      flex: ({ children, config, definition }) => (
        <div 
          className={`flex ${config.layout?.direction === 'column' ? 'flex-col' : 'flex-row'}`}
          style={config.layout?.style}
        >
          {children}
        </div>
      ),
      grid: ({ children, config, definition }) => (
        <div 
          className={`grid grid-cols-${config.layout?.cols || 1}`}
          style={config.layout?.style}
        >
          {children}
        </div>
      ),
      stack: ({ children }) => (
        <div className="space-y-4">
          {children}
        </div>
      )
    };

    return defaultLayouts[type] || defaultLayouts.flex;
  }

  // Parse entire page configuration
  parsePage(pageConfig) {
    if (!pageConfig.layout) {
      console.warn('No layout configuration found');
      return null;
    }

    return this.parseSlot('page-root', {
      layoutType: pageConfig.layout,
      slots: pageConfig.slots,
      ...pageConfig.config
    });
  }
}

export default SlotParser;