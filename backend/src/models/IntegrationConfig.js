/**
 * IntegrationConfig - Pure service class (NO SEQUELIZE)
 *
 * This class provides methods to interact with integration_configs table
 * using ConnectionManager for proper tenant database isolation.
 *
 * All methods are static and use direct Supabase queries through ConnectionManager.
 */

const crypto = require('crypto');

const IntegrationConfig = {};

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
    'local-storage': [],

    // Marketplace integrations
    amazon: ['mwsAuthToken', 'awsAccessKeyId', 'awsSecretAccessKey'],
    ebay: ['appId', 'certId', 'devId', 'authToken'],
    'google-shopping': ['apiKey'],
    facebook: ['accessToken'],
    instagram: ['accessToken']
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

// Static method to update sync status (removed instance method - use static instead)
IntegrationConfig.updateSyncStatus = async function(configId, storeId, status, error = null) {
  const ConnectionManager = require('../services/database/ConnectionManager');

  try {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const updateData = {
      sync_status: status,
      sync_error: error,
      updated_at: new Date().toISOString()
    };

    if (status === 'success') {
      updateData.last_sync_at = new Date().toISOString();
    }

    const { error: updateError } = await tenantDb
      .from('integration_configs')
      .update(updateData)
      .eq('id', configId);

    if (updateError) {
      console.error('Error updating sync status:', updateError);
      throw updateError;
    }

    return updateData;
  } catch (err) {
    console.error('IntegrationConfig.updateSyncStatus error:', err);
    throw err;
  }
};

// Static method to update connection status (replaces instance method)
IntegrationConfig.updateConnectionStatus = async function(configId, storeId, status, error = null) {
  const ConnectionManager = require('../services/database/ConnectionManager');

  try {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const updateData = {
      connection_status: status,
      connection_error: error,
      connection_tested_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await tenantDb
      .from('integration_configs')
      .update(updateData)
      .eq('id', configId);

    if (updateError) {
      console.error('Error updating connection status:', updateError);
      throw updateError;
    }

    return updateData;
  } catch (err) {
    console.error('IntegrationConfig.updateConnectionStatus error:', err);
    throw err;
  }
};

// Static methods for common operations
IntegrationConfig.findByStoreAndType = async function(storeId, integrationType) {
  // Use ConnectionManager to avoid deprecated sequelize connection
  const ConnectionManager = require('../services/database/ConnectionManager');

  try {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data, error } = await tenantDb
      .from('integration_configs')
      .select('*')
      .eq('store_id', storeId)
      .eq('integration_type', integrationType)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching integration config:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Ensure we have the id field
    if (!data.id) {
      console.error('IntegrationConfig data missing id field:', data);
      throw new Error('Integration config data is missing required id field');
    }

    // Decrypt sensitive data before returning
    const decryptedData = {
      ...data,
      config_data: IntegrationConfig.decryptSensitiveData(data.config_data, integrationType)
    };

    // Create a simplified plain object (remove backward compatibility with Sequelize)
    return decryptedData;
  } catch (error) {
    console.error('IntegrationConfig.findByStoreAndType error:', error);
    throw error;
  }
};

IntegrationConfig.createOrUpdate = async function(storeId, integrationType, configData) {
  const ConnectionManager = require('../services/database/ConnectionManager');
  const { v4: uuidv4 } = require('uuid');

  try {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Encrypt sensitive data before saving
    const encryptedData = IntegrationConfig.encryptSensitiveData(configData, integrationType);

    // First try to find active config
    const { data: existingConfig } = await tenantDb
      .from('integration_configs')
      .select('*')
      .eq('store_id', storeId)
      .eq('integration_type', integrationType)
      .maybeSingle();

    if (existingConfig) {
      // Update existing
      const updateData = {
        config_data: encryptedData,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      const { data: updated, error: updateError } = await tenantDb
        .from('integration_configs')
        .update(updateData)
        .eq('id', existingConfig.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return {
        ...updated,
        config_data: IntegrationConfig.decryptSensitiveData(updated.config_data, integrationType)
      };
    } else {
      // Create new
      const newConfig = {
        id: uuidv4(),
        store_id: storeId,
        integration_type: integrationType,
        config_data: encryptedData,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: created, error: createError } = await tenantDb
        .from('integration_configs')
        .insert(newConfig)
        .select()
        .single();

      if (createError) {
        console.error('IntegrationConfig.create failed:', createError);
        throw createError;
      }

      return {
        ...created,
        config_data: IntegrationConfig.decryptSensitiveData(created.config_data, integrationType)
      };
    }
  } catch (error) {
    console.error('IntegrationConfig.createOrUpdate error:', error);
    throw error;
  }
};

IntegrationConfig.getActiveConfigs = async function(storeId) {
  const ConnectionManager = require('../services/database/ConnectionManager');

  try {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data, error } = await tenantDb
      .from('integration_configs')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    // Decrypt sensitive data for all configs
    return (data || []).map(config => ({
      ...config,
      config_data: IntegrationConfig.decryptSensitiveData(config.config_data, config.integration_type)
    }));
  } catch (error) {
    console.error('IntegrationConfig.getActiveConfigs error:', error);
    throw error;
  }
};

module.exports = IntegrationConfig;