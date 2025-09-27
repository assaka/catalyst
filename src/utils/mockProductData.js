// Mock product data generator for ProductSlotsEditor
export const generateMockProductContext = () => {
  return {
    product: {
      id: 1,
      name: 'Premium Wireless Headphones',
      slug: 'premium-wireless-headphones',
      sku: 'WH-1000XM4',
      price: 349.99,
      compare_price: 399.99,
      description: '<p>Experience exceptional sound quality with these premium wireless headphones featuring industry-leading noise cancellation technology. Perfect for music lovers and professionals alike.</p>',
      short_description: 'Premium wireless headphones with noise cancellation',
      stock_quantity: 15,
      infinite_stock: false,
      track_stock: true,
      status: 'active',
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=600&h=600&fit=crop'
      ],
      attributes: {
        brand: 'AudioTech',
        color: 'Midnight Black',
        connectivity: 'Bluetooth 5.0',
        battery_life: '30 hours',
        weight: '254g',
        warranty: '2 years'
      },
      category_ids: [1, 2],
      created_date: new Date('2024-01-15').toISOString(),
      updated_date: new Date().toISOString()
    },
    categories: [
      { id: 1, name: 'Electronics', slug: 'electronics' },
      { id: 2, name: 'Audio', slug: 'audio' }
    ],
    productTabs: [
      {
        id: 1,
        name: 'Description',
        tab_type: 'description',
        content: '<p>Experience exceptional sound quality with these premium wireless headphones featuring industry-leading noise cancellation technology.</p><ul><li>Active Noise Cancellation</li><li>30-hour battery life</li><li>Quick charging (3 hours in 10 minutes)</li><li>Premium comfort design</li></ul>',
        is_active: true,
        sort_order: 1
      },
      {
        id: 2,
        name: 'Specifications',
        tab_type: 'attributes',
        content: null,
        is_active: true,
        sort_order: 2
      },
      {
        id: 3,
        name: 'Reviews',
        tab_type: 'text',
        content: '<div class="reviews"><h4>Customer Reviews (4.8/5)</h4><p>Excellent sound quality and comfort. Highly recommended!</p></div>',
        is_active: true,
        sort_order: 3
      }
    ],
    customOptions: [
      {
        id: 1,
        name: 'Color',
        type: 'select',
        required: true,
        options: [
          { id: 1, name: 'Midnight Black', value: 'black', price: 0 },
          { id: 2, name: 'Silver', value: 'silver', price: 20 },
          { id: 3, name: 'Blue', value: 'blue', price: 20 }
        ]
      },
      {
        id: 2,
        name: 'Warranty Extension',
        type: 'select',
        required: false,
        options: [
          { id: 1, name: 'Standard (2 years)', value: 'standard', price: 0 },
          { id: 2, name: 'Extended (3 years)', value: 'extended', price: 49.99 },
          { id: 3, name: 'Premium (5 years)', value: 'premium', price: 99.99 }
        ]
      }
    ],
    relatedProducts: [
      {
        id: 2,
        name: 'Wireless Earbuds Pro',
        slug: 'wireless-earbuds-pro',
        price: 199.99,
        compare_price: 249.99,
        images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=300&fit=crop'],
        rating: 4.6,
        reviews_count: 234
      },
      {
        id: 3,
        name: 'Gaming Headset RGB',
        slug: 'gaming-headset-rgb',
        price: 129.99,
        images: ['https://images.unsplash.com/photo-1599669454699-248893623440?w=300&h=300&fit=crop'],
        rating: 4.3,
        reviews_count: 156
      },
      {
        id: 4,
        name: 'Studio Monitor Speakers',
        slug: 'studio-monitor-speakers',
        price: 299.99,
        compare_price: 349.99,
        images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop'],
        rating: 4.7,
        reviews_count: 89
      },
      {
        id: 5,
        name: 'Portable Bluetooth Speaker',
        slug: 'portable-bluetooth-speaker',
        price: 79.99,
        images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop'],
        rating: 4.4,
        reviews_count: 312
      }
    ],
    store: {
      id: 1,
      name: 'AudioTech Store',
      slug: 'audiotech-store',
      currency_code: 'USD',
      currency_symbol: '$'
    },
    settings: {
      currency_code: 'USD',
      currency_symbol: '$',
      hide_currency_product: false,
      track_stock: true,
      hide_quantity_selector: false,
      product_gallery_layout: 'horizontal', // Default to horizontal layout
      vertical_gallery_position: 'left', // Default thumbnails to left side in vertical layout
      stock_settings: {
        show_stock_label: true,
        in_stock_label: 'In Stock ({quantity} available)',
        out_of_stock_label: 'Out of Stock',
        low_stock_label: 'Only {quantity} left!'
      },
      theme: {
        add_to_cart_button_color: '#16a34a'
      }
    },
    productLabels: [
      {
        id: 1,
        text: 'SALE',
        position: 'top-right',
        background_color: '#dc2626',
        text_color: '#ffffff',
        priority: 10,
        sort_order: 1,
        conditions: {
          price_conditions: {
            has_sale_price: true
          }
        }
      }
    ],
    taxes: [],
    selectedCountry: 'US',
    user: {
      id: 1,
      email: 'demo@example.com',
      name: 'Demo User'
    },
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Electronics', url: '/category/electronics' },
      { name: 'Audio', url: '/category/audio' },
      { name: 'Premium Wireless Headphones', url: null }
    ]
  };
};