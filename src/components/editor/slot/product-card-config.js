/**
 * Product Card Configuration for the unified slot system
 * Replaces ProductCardSlots.jsx with a cleaner approach
 */

export const productCardConfig = {
  name: 'Product Card',
  slots: {
    image: {
      name: 'Product Image',
      defaultContent: '',
      editable: true
    },
    labels: {
      name: 'Product Labels',
      defaultContent: '',
      editable: true
    },
    title: {
      name: 'Product Title',
      defaultContent: '',
      editable: true
    },
    price: {
      name: 'Product Price',
      defaultContent: '',
      editable: true
    },
    rating: {
      name: 'Product Rating',
      defaultContent: '',
      editable: true
    },
    addToCart: {
      name: 'Add to Cart Button',
      defaultContent: '',
      editable: true
    },
    quickView: {
      name: 'Quick View Button',
      defaultContent: '',
      editable: false
    }
  },
  layouts: {
    grid: {
      name: 'Grid Layout',
      slots: ['image', 'labels', 'title', 'price', 'rating', 'addToCart']
    },
    list: {
      name: 'List Layout',
      slots: ['image', 'title', 'price', 'rating', 'addToCart', 'quickView']
    },
    compact: {
      name: 'Compact Layout',
      slots: ['image', 'title', 'price', 'addToCart']
    }
  }
};

// Product Card Component that uses the unified slot system
export function ProductCard({ product, store, layout = 'grid', config }) {
  const slots = config?.slots || productCardConfig.slots;
  const activeLayout = productCardConfig.layouts[layout];
  
  return (
    <div className="product-card">
      {activeLayout.slots.map(slotId => {
        const slot = slots[slotId];
        if (!slot) return null;
        
        // Render slot based on type
        switch(slotId) {
          case 'image':
            return (
              <div key={slotId} className="product-image">
                <img src={product.image} alt={product.name} />
              </div>
            );
          case 'title':
            return (
              <h3 key={slotId} className="product-title">
                {product.name}
              </h3>
            );
          case 'price':
            return (
              <div key={slotId} className="product-price">
                ${product.price}
              </div>
            );
          case 'addToCart':
            return (
              <button key={slotId} className="add-to-cart">
                Add to Cart
              </button>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

// This can be integrated into page-configs.js for any page that shows products
export const productGridSlotConfig = {
  name: 'Product Grid',
  component: ProductCard,
  getData: (data) => data.products || [],
  defaultLayout: 'grid',
  editable: true
};