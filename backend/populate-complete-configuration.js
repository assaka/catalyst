const { Sequelize } = require('sequelize');

// Database connection - use environment variables or fallback to Supabase
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres', {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function populateCompleteConfiguration() {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check for specific store ID that needs a draft configuration
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Create complete default configuration with all content
    const defaultConfig = {
        page_name: 'Cart',
        slots: {
          // Header content
          'header.title': {
            content: 'My Cart',
            styles: {},
            className: 'text-2xl font-bold text-gray-800',
            parentClassName: 'text-center',
            metadata: { lastModified: new Date().toISOString() }
          },
          
          // Empty cart content
          'emptyCart.icon': {
            content: '🛒',
            styles: {},
            className: 'text-6xl text-gray-400',
            parentClassName: 'text-center',
            metadata: { lastModified: new Date().toISOString() }
          },
          'emptyCart.title': {
            content: 'Your cart is empty',
            styles: {},
            className: 'text-xl font-bold text-gray-600',
            parentClassName: 'text-center',
            metadata: { lastModified: new Date().toISOString() }
          },
          'emptyCart.text': {
            content: "Looks like you haven't added anything to your cart yet.",
            styles: {},
            className: 'text-gray-500 mb-4',
            parentClassName: 'text-center',
            metadata: { lastModified: new Date().toISOString() }
          },
          'emptyCart.button': {
            content: 'Continue Shopping',
            styles: {},
            className: 'px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold',
            parentClassName: 'text-center',
            metadata: { lastModified: new Date().toISOString() }
          },

          // Cart item content templates
          'cartItem.productImage': {
            content: 'Product Image',
            styles: {},
            className: 'w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500',
            parentClassName: '',
            metadata: { lastModified: new Date().toISOString() }
          },
          'cartItem.productTitle': {
            content: 'Product Name',
            styles: {},
            className: 'font-semibold text-gray-900',
            parentClassName: '',
            metadata: { lastModified: new Date().toISOString() }
          },
          'cartItem.quantityControl': {
            content: '1',
            styles: {},
            className: 'flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded',
            parentClassName: 'text-center',
            metadata: { lastModified: new Date().toISOString() }
          },
          'cartItem.productPrice': {
            content: '$29.99',
            styles: {},
            className: 'font-bold text-gray-900',
            parentClassName: 'text-right',
            metadata: { lastModified: new Date().toISOString() }
          },
          'cartItem.removeButton': {
            content: 'Remove',
            styles: {},
            className: 'text-red-500 hover:text-red-700 text-sm',
            parentClassName: '',
            metadata: { lastModified: new Date().toISOString() }
          },

          // Coupon content
          'coupon.title': {
            content: 'Apply Coupon',
            styles: {},
            className: 'text-lg font-bold text-gray-800',
            parentClassName: '',
            metadata: { lastModified: new Date().toISOString() }
          },
          'coupon.input': {
            content: 'Enter coupon code',
            styles: {},
            className: 'flex-1 px-3 py-2 border rounded bg-white text-gray-700',
            parentClassName: '',
            metadata: { lastModified: new Date().toISOString() }
          },
          'coupon.button': {
            content: 'Apply',
            styles: {},
            className: 'px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium',
            parentClassName: '',
            metadata: { lastModified: new Date().toISOString() }
          },

          // Order summary content
          'orderSummary.title': {
            content: 'Order Summary',
            styles: {},
            className: 'text-lg font-bold text-gray-800 mb-4',
            parentClassName: '',
            metadata: { lastModified: new Date().toISOString() }
          },
          'orderSummary.subtotal': {
            content: 'Subtotal: $59.98',
            styles: {},
            className: 'flex justify-between text-gray-600 mb-2',
            parentClassName: '',
            metadata: { lastModified: new Date().toISOString() }
          },
          'orderSummary.total': {
            content: 'Total: $59.98',
            styles: {},
            className: 'flex justify-between font-bold text-lg text-gray-900 border-t pt-4',
            parentClassName: '',
            metadata: { lastModified: new Date().toISOString() }
          },
          'orderSummary.checkoutButton': {
            content: 'Proceed to Checkout',
            styles: {},
            className: 'w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold',
            parentClassName: '',
            metadata: { lastModified: new Date().toISOString() }
          }
        },
        majorSlots: ['header', 'emptyCart', 'cartItems'],
        microSlotOrders: {
          flashMessage: ['flashMessage.message'],
          emptyCart: ['emptyCart.icon', 'emptyCart.title', 'emptyCart.text', 'emptyCart.button'],
          header: ['header.title'],
          cartItem: ['cartItem.productImage', 'cartItem.productTitle', 'cartItem.quantityControl', 'cartItem.productPrice', 'cartItem.removeButton'],
          coupon: ['coupon.title', 'coupon.input', 'coupon.button', 'coupon.message', 'coupon.appliedCoupon'],
          orderSummary: ['orderSummary.title', 'orderSummary.subtotal', 'orderSummary.discount', 'orderSummary.shipping', 'orderSummary.tax', 'orderSummary.total', 'orderSummary.checkoutButton'],
          recommendations: ['recommendations.title', 'recommendations.products']
        },
        microSlotSpans: {
          flashMessage: { 'flashMessage.message': { col: 12, row: 1 } },
          emptyCart: {
            'emptyCart.icon': { col: 2, row: 1 },
            'emptyCart.title': { col: 10, row: 1 },
            'emptyCart.text': { col: 12, row: 1 },
            'emptyCart.button': { col: 12, row: 1 }
          },
          header: { 'header.title': { col: 12, row: 1 } },
          cartItem: {
            'cartItem.productImage': { col: 2, row: 2 },
            'cartItem.productTitle': { col: 6, row: 1 },
            'cartItem.quantityControl': { col: 2, row: 1 },
            'cartItem.productPrice': { col: 2, row: 1 },
            'cartItem.removeButton': { col: 12, row: 1 }
          },
          coupon: {
            'coupon.title': { col: 12, row: 1 },
            'coupon.input': { col: 8, row: 1 },
            'coupon.button': { col: 4, row: 1 },
            'coupon.message': { col: 12, row: 1 },
            'coupon.appliedCoupon': { col: 12, row: 1 }
          },
          orderSummary: {
            'orderSummary.title': { col: 12, row: 1 },
            'orderSummary.subtotal': { col: 12, row: 1 },
            'orderSummary.discount': { col: 12, row: 1 },
            'orderSummary.shipping': { col: 12, row: 1 },
            'orderSummary.tax': { col: 12, row: 1 },
            'orderSummary.total': { col: 12, row: 1 },
            'orderSummary.checkoutButton': { col: 12, row: 1 }
          },
          recommendations: {
            'recommendations.title': { col: 12, row: 1 },
            'recommendations.products': { col: 12, row: 3 }
          }
        },
        componentSizes: {},
        customSlots: {},
        metadata: {
          created: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
    };
    
    // Check if a draft configuration already exists
    const existingDraft = await sequelize.query(`
      SELECT id FROM slot_configurations 
      WHERE store_id = $1 AND status = 'draft' AND page_type = 'cart'
    `, { 
      bind: [storeId],
      type: Sequelize.QueryTypes.SELECT 
    });

    if (existingDraft.length > 0) {
      console.log(`🔄 Updating existing draft configuration for store ${storeId}`);
      const configId = existingDraft[0].id;
      
      // Update the existing configuration with complete content
      await sequelize.query(`
        UPDATE slot_configurations 
        SET configuration = $1, updated_at = NOW()
        WHERE id = $2
      `, {
        bind: [JSON.stringify(defaultConfig), configId],
        type: Sequelize.QueryTypes.UPDATE
      });
      
      console.log(`✅ Updated existing configuration with complete slot content and slotContent`);
      console.log(`🎉 Configuration updated successfully!`);
      return;
    }

    console.log(`📋 Creating new draft configuration for store ${storeId}`);

    // Get user_id from existing users table
    const users = await sequelize.query(`SELECT id FROM users LIMIT 1`, { 
      type: Sequelize.QueryTypes.SELECT 
    });
    
    if (users.length === 0) {
      console.log('❌ No users found in database. Cannot create slot configuration.');
      return;
    }
    
    const userId = users[0].id;
    console.log(`📋 Using user_id: ${userId}`);

    // Insert the default configuration
    const result = await sequelize.query(`
      INSERT INTO slot_configurations (
        id,
        user_id,
        store_id,
        configuration,
        version,
        is_active,
        status,
        version_number,
        page_type,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        '1.0',
        true,
        'draft',
        1,
        'cart',
        NOW(),
        NOW()
      ) RETURNING id
    `, {
      bind: [userId, storeId, JSON.stringify(defaultConfig)],
      type: Sequelize.QueryTypes.INSERT
    });

    console.log(`✅ Created default configuration for store ${storeId}`);
    console.log(`🎉 Configuration created successfully with complete slot content!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
populateCompleteConfiguration();