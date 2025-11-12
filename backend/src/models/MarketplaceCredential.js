const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const crypto = require('crypto');

/**
 * MarketplaceCredential Model
 *
 * Stores credentials for various marketplace integrations (Amazon, eBay, etc.)
 * Supports credential-based authentication (no OAuth needed)
 */
const MarketplaceCredential = sequelize.define('MarketplaceCredential', {
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
    },
    onDelete: 'CASCADE'
  },
  marketplace: {
    type: DataTypes.ENUM('amazon', 'ebay', 'google_shopping', 'facebook', 'instagram'),
    allowNull: false,
    comment: 'The marketplace platform'
  },
  marketplace_account_name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Friendly name for this marketplace account'
  },
  credentials: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'Encrypted credentials object (marketplace-specific)',
    get() {
      const encrypted = this.getDataValue('credentials');
      if (!encrypted) return null;

      try {
        // Decrypt credentials
        return MarketplaceCredential.decryptCredentials(encrypted);
      } catch (error) {
        console.error('Failed to decrypt credentials:', error);
        return null;
      }
    },
    set(value) {
      if (!value) {
        this.setDataValue('credentials', null);
        return;
      }

      // Encrypt credentials before storing
      const encrypted = MarketplaceCredential.encryptCredentials(value);
      this.setDataValue('credentials', encrypted);
    }
  },
  marketplace_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Marketplace-specific ID (e.g., Amazon Marketplace ID, eBay Site ID)'
  },
  region: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Region/Country (e.g., US, UK, DE, FR)'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'error', 'testing'),
    defaultValue: 'active'
  },
  last_sync_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last successful sync timestamp'
  },
  last_error: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Last error message if sync failed'
  },
  sync_settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      auto_sync: true,
      sync_frequency: 'hourly', // hourly, daily, weekly
      sync_inventory: true,
      sync_prices: true,
      sync_new_products: true
    },
    comment: 'Sync configuration settings'
  },
  export_settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      use_ai_optimization: true,
      auto_translate: true,
      include_variants: true,
      export_out_of_stock: false,
      price_adjustment_percent: 0,
      category_mapping: {}
    },
    comment: 'Export configuration and product transformation rules'
  },
  statistics: {
    type: DataTypes.JSONB,
    defaultValue: {
      total_exports: 0,
      successful_exports: 0,
      failed_exports: 0,
      total_products_synced: 0,
      last_export_duration_ms: 0
    },
    comment: 'Export statistics and metrics'
  }
}, {
  tableName: 'marketplace_credentials',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'marketplace', 'marketplace_id']
    },
    {
      fields: ['store_id']
    },
    {
      fields: ['marketplace']
    },
    {
      fields: ['status']
    }
  ]
});

/**
 * Encryption/Decryption methods for secure credential storage
 */
MarketplaceCredential.encryptCredentials = function(credentials) {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-change-me-in-production-32bytes', 'utf8').slice(0, 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(credentials), 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

MarketplaceCredential.decryptCredentials = function(encryptedData) {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-change-me-in-production-32bytes', 'utf8').slice(0, 32);

  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(encryptedData.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData.encrypted, 'hex')),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString('utf8'));
};

/**
 * Class Methods
 */

// Find credentials by store and marketplace
MarketplaceCredential.findByStoreAndMarketplace = async function(storeId, marketplace) {
  return await this.findOne({
    where: {
      store_id: storeId,
      marketplace: marketplace,
      status: 'active'
    }
  });
};

// Get all active marketplace connections for a store
MarketplaceCredential.getStoreMarketplaces = async function(storeId) {
  return await this.findAll({
    where: {
      store_id: storeId,
      status: 'active'
    },
    order: [['marketplace', 'ASC']]
  });
};

// Update sync statistics
MarketplaceCredential.prototype.updateSyncStats = async function(stats) {
  const currentStats = this.statistics || {};

  this.statistics = {
    ...currentStats,
    ...stats,
    total_exports: (currentStats.total_exports || 0) + (stats.increment_exports ? 1 : 0),
    successful_exports: (currentStats.successful_exports || 0) + (stats.success ? 1 : 0),
    failed_exports: (currentStats.failed_exports || 0) + (stats.failed ? 1 : 0)
  };

  this.last_sync_at = new Date();

  if (stats.error) {
    this.last_error = stats.error;
    this.status = 'error';
  }

  await this.save();
};

// Test connection (validates credentials)
MarketplaceCredential.prototype.testConnection = async function() {
  // This will be implemented in marketplace-specific clients
  // Returns { success: boolean, message: string }
  return { success: true, message: 'Override this method in marketplace client' };
};

/**
 * Instance methods
 */

// Get credential field (convenience method)
MarketplaceCredential.prototype.getCredential = function(field) {
  const creds = this.credentials;
  return creds ? creds[field] : null;
};

// Validate required credentials for marketplace
MarketplaceCredential.prototype.validateCredentials = function() {
  const creds = this.credentials;
  if (!creds) return { valid: false, missing: ['credentials'] };

  const required = {
    amazon: ['seller_id', 'mws_auth_token', 'aws_access_key_id', 'aws_secret_access_key'],
    ebay: ['app_id', 'cert_id', 'dev_id', 'auth_token'],
    google_shopping: ['merchant_id', 'api_key'],
    facebook: ['catalog_id', 'access_token'],
    instagram: ['business_account_id', 'access_token']
  };

  const requiredFields = required[this.marketplace] || [];
  const missing = requiredFields.filter(field => !creds[field]);

  return {
    valid: missing.length === 0,
    missing: missing
  };
};

module.exports = MarketplaceCredential;
