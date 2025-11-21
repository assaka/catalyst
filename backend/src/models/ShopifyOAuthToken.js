/**
 * ShopifyOAuthToken - Pure service class (NO SEQUELIZE)
 * Tenant data - uses ConnectionManager for database access
 */
const crypto = require('crypto');

const ShopifyOAuthToken = sequelize.define('ShopifyOAuthToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  shop_domain: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isValidShopDomain(value) {
        if (!value.includes('.myshopify.com')) {
          throw new Error('Shop domain must be a valid Shopify domain (*.myshopify.com)');
        }
      }
    }
  },
  access_token: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  scope: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  shop_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  shop_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  shop_email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  shop_country: {
    type: DataTypes.STRING(2),
    allowNull: true
  },
  shop_currency: {
    type: DataTypes.STRING(3),
    allowNull: true
  },
  shop_timezone: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  plan_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  webhook_endpoint_secret: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'shopify_oauth_tokens',
  indexes: [
    {
      unique: true,
      fields: ['store_id']
    },
    {
      unique: true,
      fields: ['shop_domain']
    }
  ]
});

// Static methods - use ConnectionManager for tenant DB access
ShopifyOAuthToken.findByStore = async function(storeId) {
  const ConnectionManager = require('../services/database/ConnectionManager');

  try {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data, error } = await tenantDb
      .from('shopify_oauth_tokens')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching Shopify OAuth token:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('ShopifyOAuthToken.findByStore error:', error);
    throw error;
  }
};

ShopifyOAuthToken.findByShopDomain = async function(shopDomain) {
  const ConnectionManager = require('../services/database/ConnectionManager');

  try {
    // We need storeId to get tenant connection, but we only have shop_domain
    // This method is problematic - should be refactored to require storeId
    throw new Error('findByShopDomain requires storeId - use findByStore instead');
  } catch (error) {
    console.error('ShopifyOAuthToken.findByShopDomain error:', error);
    throw error;
  }
};

ShopifyOAuthToken.createOrUpdate = async function(data) {
  const { store_id, shop_domain } = data;
  
  // Check if token exists for this store
  const existingToken = await this.findByStore(store_id);
  
  if (existingToken) {
    // Update existing token
    await existingToken.update(data);
    return existingToken;
  } else {
    // Create new token
    return await this.create(data);
  }
};

// Instance methods
ShopifyOAuthToken.prototype.updateShopInfo = async function(shopInfo) {
  this.shop_id = shopInfo.id;
  this.shop_name = shopInfo.name;
  this.shop_email = shopInfo.email;
  this.shop_country = shopInfo.country_code;
  this.shop_currency = shopInfo.currency;
  this.shop_timezone = shopInfo.timezone;
  this.plan_name = shopInfo.plan_name;
  
  await this.save();
};

ShopifyOAuthToken.prototype.isValid = function() {
  return !!(this.access_token && this.shop_domain);
};

module.exports = ShopifyOAuthToken;