# Phoenix Migration: Slot API Design Document

## Slot Naming Convention

### Format: `domain.component.section.element`

**Examples:**
- `product.card.image` - Product card image area
- `product.card.pricing` - Product card price display
- `product.card.actions.add_to_cart` - Add to cart button in product card
- `product.detail.gallery.main` - Main product image
- `product.detail.info.pricing` - Product detail pricing section
- `checkout.address.shipping` - Shipping address form
- `cart.mini.header` - Mini cart header section

## Props Interface Design

### Base Slot Props (All slots receive these)
```typescript
interface BaseSlotProps {
  slotId: string;           // Unique identifier for this slot
  context: SlotContext;     // Rendering context information
  isPreview?: boolean;      // Is this in preview mode
  store: Store;             // Current store context
  settings: StoreSettings;  // Store configuration
}

interface SlotContext {
  component: string;        // Component name (e.g., "ProductCard")
  page?: string;           // Page context if applicable
  user?: User;             // Current user if authenticated
  device?: DeviceInfo;     // Device/viewport information
}
```

### Specific Slot Props

#### Product Card Slots
```typescript
interface ProductCardSlotProps extends BaseSlotProps {
  product: Product;
  taxes?: TaxInfo[];
  selectedCountry: string;
}

// Specific slots:
// product.card.image - ProductCardSlotProps + { images: string[] }
// product.card.pricing - ProductCardSlotProps + { comparePrice?: number }
// product.card.actions.add_to_cart - ProductCardSlotProps + { onAddToCart: Function }
```

#### Checkout Slots
```typescript
interface CheckoutSlotProps extends BaseSlotProps {
  cartItems: CartItem[];
  total: number;
  currency: string;
  onSubmit?: Function;
}
```

## Configuration Schema

### User Override Configuration
```json
{
  "version": "1.0",
  "slots": {
    "product.card.actions.add_to_cart": {
      "enabled": true,
      "order": 1,
      "component": "CustomAddToCartButton",
      "props": {
        "text": "Buy Now",
        "color": "#FF6B35",
        "style": "rounded"
      }
    },
    "product.card.pricing": {
      "enabled": true,
      "order": 2,
      "component": "CustomPricing",
      "props": {
        "showOriginalPrice": true,
        "highlightSavings": true
      }
    }
  },
  "components": {
    "CustomAddToCartButton": {
      "type": "react",
      "source": "custom-components/add-to-cart-button.jsx"
    },
    "CustomPricing": {
      "type": "react", 
      "source": "custom-components/pricing.jsx"
    }
  }
}
```

### Default Slot Configuration (System)
```json
{
  "product.card.image": {
    "component": "DefaultProductImage",
    "order": 1,
    "required": true,
    "props": {
      "aspectRatio": "1:1",
      "placeholder": "https://placehold.co/400x400"
    }
  },
  "product.card.pricing": {
    "component": "DefaultProductPricing", 
    "order": 2,
    "required": true
  },
  "product.card.actions.add_to_cart": {
    "component": "DefaultAddToCartButton",
    "order": 3,
    "required": false
  }
}
```

## Slot Registry Structure

### Registry Interface
```typescript
interface SlotRegistry {
  // Register a default component for a slot
  register(slotId: string, component: React.ComponentType, config?: SlotConfig): void;
  
  // Get component for a slot (considers user overrides)
  getComponent(slotId: string, context: SlotContext): React.ComponentType;
  
  // Apply user configuration
  applyUserConfig(config: UserSlotConfig): void;
  
  // Get all slots for a component
  getSlotsForComponent(componentName: string): string[];
}

interface SlotConfig {
  order?: number;
  required?: boolean;
  defaultProps?: Record<string, any>;
  validation?: SlotValidation;
}
```

## Migration Strategy

### 1. Identify Current Diff Patterns
Common diff patterns to map to slots:
- **Text Changes**: Button labels, headings, descriptions → Text slot props
- **Styling Changes**: Colors, fonts, spacing → Style slot props  
- **Element Insertion**: New buttons, badges, sections → New slot insertions
- **Element Hiding**: Display: none → Slot enabled: false
- **Reordering**: Moving elements → Slot order changes

### 2. Diff-to-Slot Mapping Rules
```javascript
// Example mapping rules
const diffToSlotRules = [
  {
    pattern: /Add to Cart/g,
    slotId: 'product.card.actions.add_to_cart',
    type: 'text',
    transform: (match, replacement) => ({
      props: { text: replacement }
    })
  },
  {
    pattern: /backgroundColor:\s*['"]([^'"]+)['"]/,
    slotId: 'product.card.actions.add_to_cart',
    type: 'style',
    transform: (match, color) => ({
      props: { style: { backgroundColor: color } }
    })
  }
];
```

## Implementation Priority

### Phase 1: Core Infrastructure
1. SlotRegistry class
2. SlotRenderer component  
3. Configuration merger

### Phase 2: ProductCard Migration
1. Convert ProductCard to use slots
2. Create default slot components
3. Build diff-to-slot translator for ProductCard

### Phase 3: Expand to Other Components
1. ProductDetail
2. MiniCart  
3. Checkout

### Phase 4: Migration Tools
1. CLI migration tool
2. Validation system
3. User interface for slot management

## Success Metrics
- Zero breaking changes during migration
- 100% of existing diffs successfully translated
- 50% reduction in customization system complexity
- 90% faster customization application times