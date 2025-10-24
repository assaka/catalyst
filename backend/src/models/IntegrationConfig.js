const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const crypto = require('crypto');

const IntegrationConfig = sequelize.define('IntegrationConfig', {
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
  integration_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [[
        // E-commerce platforms
        'akeneo', 'magento', 'shopify', 'woocommerce',

        // Database integrations
        'supabase', // Legacy - will be split into supabase-database + supabase-storage
        'supabase-database',
        'postgresql',
        'mysql',

        // Storage integrations
        'supabase-storage',
        'google-cloud-storage',
        'aws-s3',
        'cloudflare-r2',
        'local-storage'
      ]]
    }
  },
  config_data: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_sync_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sync_status: {
    type: DataTypes.ENUM('idle', 'syncing', 'success', 'error'),
    defaultValue: 'idle'
  },
  sync_error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  connection_status: {
    type: DataTypes.ENUM('untested', 'success', 'failed'),
    defaultValue: 'untested'
  },
  connection_tested_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  connection_error: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'integration_configs',
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'integration_type']
    }
  ],
  hooks: {
    beforeCreate: (integrationConfig) => {
      integrationConfig.config_data = IntegrationConfig.encryptSensitiveData(
        integrationConfig.config_data, 
        integrationConfig.integration_type
      );
    },
    beforeUpdate: (integrationConfig) => {
      if (integrationConfig.changed('config_data')) {
        integrationConfig.config_data = IntegrationConfig.encryptSensitiveData(
          integrationConfig.config_data, 
          integrationConfig.integration_type
        );
      }
    },
    afterFind: (result) => {
      if (!result) return;
      
      const configs = Array.isArray(result) ? result : [result];
      configs.forEach(config => {
        if (config && config.config_data) {
          config.config_data = IntegrationConfig.decryptSensitiveData(
            config.config_data, 
            config.integration_type
          );
        }
      });
    }
  }
});

// Encryption/Decryption utilities
IntegrationConfig.getEncryptionKey = () => {
  // Use environment variable or generate a key
  // In production, this should be a secure, consistent key
  return process.env.INTEGRATION_ENCRYPTION_KEY || 'catalyst-integration-default-key-change-in-production';
};

IntegrationConfig.getSensitiveFields = (integrationType) => {
  const sensitiveFieldsMap = {
    // E-commerce platforms
    akeneo: ['clientSecret', 'password'],
    magento: ['apiKey', 'password'],
    shopify: ['accessToken', 'apiSecret'],
    woocommerce: ['consumerSecret'],

    // Database integrations
    supabase: ['accessToken', 'refreshToken', 'serviceRoleKey', 'databaseUrl'],
    'supabase-database': ['accessToken', 'refreshToken', 'serviceRoleKey', 'connectionString'],
    postgresql: ['password', 'connectionString'],
    mysql: ['password', 'connectionString'],

    // Storage integrations
    'supabase-storage': ['serviceRoleKey', 'accessToken'],
    'google-cloud-storage': ['privateKey', 'credentials'],
    'aws-s3': ['accessKeyId', 'secretAccessKey', 'sessionToken'],
    'cloudflare-r2': ['accessKeyId', 'secretAccessKey'],
    'local-storage': []
  };

  return sensitiveFieldsMap[integrationType] || [];
};

IntegrationConfig.encryptSensitiveData = (configData, integrationType) => {
  if (!configData || typeof configData !== 'object') {
    return configData;
  }

  const sensitiveFields = IntegrationConfig.getSensitiveFields(integrationType);
  const encrypted = { ...configData };
  const key = IntegrationConfig.getEncryptionKey();

  sensitiveFields.forEach(field => {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      try {
        const cipher = crypto.createCipher('aes-256-cbc', key);
        let encryptedValue = cipher.update(encrypted[field], 'utf8', 'hex');
        encryptedValue += cipher.final('hex');
        encrypted[field] = `encrypted:${encryptedValue}`;
      } catch (error) {
        console.error(`Failed to encrypt field ${field}:`, error.message);
      }
    }
  });

  return encrypted;
};

IntegrationConfig.decryptSensitiveData = (configData, integrationType) => {
  if (!configData || typeof configData !== 'object') {
    return configData;
  }

  const sensitiveFields = IntegrationConfig.getSensitiveFields(integrationType);
  const decrypted = { ...configData };
  const key = IntegrationConfig.getEncryptionKey();

  sensitiveFields.forEach(field => {
    if (decrypted[field] && typeof decrypted[field] === 'string' && decrypted[field].startsWith('encrypted:')) {
      try {
        const encryptedValue = decrypted[field].replace('encrypted:', '');
        const decipher = crypto.createDecipher('aes-256-cbc', key);
        let decryptedValue = decipher.update(encryptedValue, 'hex', 'utf8');
        decryptedValue += decipher.final('utf8');
        
        // Handle double encryption (legacy issue)
        if (decryptedValue.startsWith('encrypted:')) {
          console.warn(`Field ${field} appears to be double-encrypted, fixing...`);
          try {
            const encryptedValue2 = decryptedValue.replace('encrypted:', '');
            const decipher2 = crypto.createDecipher('aes-256-cbc', key);
            let decryptedValue2 = decipher2.update(encryptedValue2, 'hex', 'utf8');
            decryptedValue2 += decipher2.final('utf8');
            decryptedValue = decryptedValue2;
          } catch (doubleDecryptError) {
            console.error(`Failed to decrypt double-encrypted field ${field}:`, doubleDecryptError.message);
          }
        }
        
        decrypted[field] = decryptedValue;
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error.message);
        // Keep encrypted value if decryption fails
      }
    }
  });

  return decrypted;
};

// Instance methods
IntegrationConfig.prototype.updateSyncStatus = async function(status, error = null) {
  this.sync_status = status;
  this.sync_error = error;
  if (status === 'success') {
    this.last_sync_at = new Date();
  }
  await this.save();
};

IntegrationConfig.prototype.updateConnectionStatus = async function(status, error = null) {
  this.connection_status = status;
  this.connection_error = error;
  this.connection_tested_at = new Date();
  await this.save();
};

// Static methods for common operations
IntegrationConfig.findByStoreAndType = async function(storeId, integrationType) {
  return await this.findOne({
    where: {
      store_id: storeId,
      integration_type: integrationType,
      is_active: true
    }
  });
};

IntegrationConfig.createOrUpdate = async function(storeId, integrationType, configData) {
  // First try to find active config
  let existingConfig = await this.findByStoreAndType(storeId, integrationType);

  // If not found, check for inactive config (to avoid unique constraint violation)
  if (!existingConfig) {
    existingConfig = await this.findOne({
      where: {
        store_id: storeId,
        integration_type: integrationType
      }
    });
  }

  if (existingConfig) {
    existingConfig.config_data = configData;
    existingConfig.is_active = true;
    await existingConfig.save();
    return existingConfig;
  } else {
    try {
      return await this.create({
        store_id: storeId,
        integration_type: integrationType,
        config_data: configData,
        is_active: true
      });
    } catch (error) {
      console.error('IntegrationConfig.create failed:', {
        storeId,
        integrationType,
        configData,
        error: error.message,
        name: error.name,
        errors: error.errors?.map(e => ({
          field: e.path,
          message: e.message,
          type: e.type,
          value: e.value
        }))
      });
      throw error;
    }
  }
};

IntegrationConfig.getActiveConfigs = async function(storeId) {
  return await this.findAll({
    where: {
      store_id: storeId,
      is_active: true
    }
  });
};

module.exports = IntegrationConfig;