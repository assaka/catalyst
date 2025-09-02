/**
 * SlotWrapper - Universal wrapper that renders any page using SlotParser
 * Store owners never touch this file
 */

import React, { useMemo } from 'react';
import SlotParser from './SlotParser.jsx';

// Import all available components that can be used in slots
import { 
  CartPageContainer,
  CartPageHeader,
  EmptyCartDisplay,
  CartItemsContainer,
  CartItem,
  CartSidebar,
  CouponSection,
  OrderSummary,
  CheckoutButton,
  CartGridLayout
} from './default-components/CartSlots.jsx';

// Layout components
const FlexLayout = ({ children, config }) => (
  <div 
    className={`flex ${config?.direction === 'column' ? 'flex-col' : 'flex-row'} ${config?.gap ? `gap-${config.gap}` : 'gap-4'} ${config?.justify ? `justify-${config.justify}` : ''} ${config?.align ? `items-${config.align}` : ''}`}
    style={config?.style}
  >
    {children}
  </div>
);

const GridLayout = ({ children, config }) => (
  <div 
    className={`grid ${config?.cols ? `grid-cols-${config.cols}` : 'grid-cols-1'} ${config?.gap ? `gap-${config.gap}` : 'gap-4'}`}
    style={config?.style}
  >
    {children}
  </div>
);

const StackLayout = ({ children, config }) => (
  <div 
    className={`space-y-${config?.gap || '4'}`}
    style={config?.style}
  >
    {children}
  </div>
);

// Micro-slot components for fine-grained control
const ItemImage = ({ src, alt, className = "w-20 h-20 object-cover rounded-lg" }) => (
  <img src={src} alt={alt} className={className} />
);

const ItemTitle = ({ children, className = "text-lg font-semibold" }) => (
  <h3 className={className}>{children}</h3>
);

const ItemPrice = ({ price, currencySymbol = "$", className = "text-gray-600" }) => (
  <p className={className}>{currencySymbol}{price} each</p>
);

const QuantityControls = ({ quantity, onIncrease, onDecrease, className = "flex items-center space-x-3" }) => (
  <div className={className}>
    <button onClick={onDecrease} className="btn btn-outline btn-sm">-</button>
    <span className="text-lg font-semibold">{quantity}</span>
    <button onClick={onIncrease} className="btn btn-outline btn-sm">+</button>
  </div>
);

const RemoveButton = ({ onRemove, className = "btn btn-destructive btn-sm" }) => (
  <button onClick={onRemove} className={className}>Remove</button>
);

const SlotWrapper = ({ 
  slotDefinitions,
  pageConfig,
  data = {},
  className = ""
}) => {
  // Initialize parser with slot definitions
  const parser = useMemo(() => {
    const slotParser = new SlotParser(slotDefinitions);
    
    // Register all available components
    slotParser.registerComponent('CartPageContainer', CartPageContainer);
    slotParser.registerComponent('CartPageHeader', CartPageHeader);
    slotParser.registerComponent('EmptyCartDisplay', EmptyCartDisplay);
    slotParser.registerComponent('CartItemsContainer', CartItemsContainer);
    slotParser.registerComponent('CartItem', CartItem);
    slotParser.registerComponent('CartSidebar', CartSidebar);
    slotParser.registerComponent('CouponSection', CouponSection);
    slotParser.registerComponent('OrderSummary', OrderSummary);
    slotParser.registerComponent('CheckoutButton', CheckoutButton);
    slotParser.registerComponent('CartGridLayout', CartGridLayout);
    
    // Register micro-slot components
    slotParser.registerComponent('ItemImage', ItemImage);
    slotParser.registerComponent('ItemTitle', ItemTitle);
    slotParser.registerComponent('ItemPrice', ItemPrice);
    slotParser.registerComponent('QuantityControls', QuantityControls);
    slotParser.registerComponent('RemoveButton', RemoveButton);
    
    // Register layout components
    slotParser.registerLayout('flex', FlexLayout);
    slotParser.registerLayout('grid', GridLayout);
    slotParser.registerLayout('stack', StackLayout);
    
    return slotParser;
  }, [slotDefinitions]);

  // Enhance page config with data
  const enhancedPageConfig = useMemo(() => ({
    ...pageConfig,
    data
  }), [pageConfig, data]);

  // Parse and render the page
  const renderedPage = useMemo(() => {
    try {
      return parser.parsePage(enhancedPageConfig);
    } catch (error) {
      console.error('Error parsing page:', error);
      return (
        <div className="error-boundary p-4 border border-red-300 rounded-lg bg-red-50">
          <h3 className="text-red-700 font-semibold mb-2">Slot Rendering Error</h3>
          <p className="text-red-600 text-sm">{error.message}</p>
        </div>
      );
    }
  }, [parser, enhancedPageConfig]);

  return (
    <div className={`slot-wrapper ${className}`}>
      {renderedPage}
    </div>
  );
};

// Higher-order component for easy integration
export const withSlotWrapper = (slotDefinitions) => (WrappedComponent) => {
  return function SlotWrappedComponent(props) {
    return (
      <SlotWrapper
        slotDefinitions={slotDefinitions}
        pageConfig={props.pageConfig}
        data={props.data}
        className={props.className}
      >
        <WrappedComponent {...props} />
      </SlotWrapper>
    );
  };
};

export default SlotWrapper;