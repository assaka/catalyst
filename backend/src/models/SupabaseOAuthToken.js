const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const crypto = require('crypto');

const SupabaseOAuthToken = sequelize.define('SupabaseOAuthToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  access_token: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  project_url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  service_role_key: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  database_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  storage_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  auth_url: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'supabase_oauth_tokens',
  hooks: {
    beforeCreate: (token) => {
      // Encrypt sensitive tokens before saving
      token.access_token = SupabaseOAuthToken.encrypt(token.access_token);
      token.refresh_token = SupabaseOAuthToken.encrypt(token.refresh_token);
      if (token.service_role_key) {
        token.service_role_key = SupabaseOAuthToken.encrypt(token.service_role_key);
      }
      if (token.database_url) {
        token.database_url = SupabaseOAuthToken.encrypt(token.database_url);
      }
    },
    beforeUpdate: (token) => {
      // Encrypt sensitive tokens before updating
      if (token.changed('access_token')) {
        token.access_token = SupabaseOAuthToken.encrypt(token.access_token);
      }
      if (token.changed('refresh_token')) {
        token.refresh_token = SupabaseOAuthToken.encrypt(token.refresh_token);
      }
      if (token.changed('service_role_key') && token.service_role_key) {
        token.service_role_key = SupabaseOAuthToken.encrypt(token.service_role_key);
      }
      if (token.changed('database_url') && token.database_url) {
        token.database_url = SupabaseOAuthToken.encrypt(token.database_url);
      }
    },
    afterFind: (result) => {
      if (!result) return;
      
      const tokens = Array.isArray(result) ? result : [result];
      tokens.forEach(token => {
        if (token) {
          // Decrypt sensitive tokens after fetching
          token.access_token = SupabaseOAuthToken.decrypt(token.access_token);
          token.refresh_token = SupabaseOAuthToken.decrypt(token.refresh_token);
          if (token.service_role_key) {
            token.service_role_key = SupabaseOAuthToken.decrypt(token.service_role_key);
          }
          if (token.database_url) {
            token.database_url = SupabaseOAuthToken.decrypt(token.database_url);
          }
        }
      });
    }
  }
});

// Encryption/Decryption utilities
SupabaseOAuthToken.getEncryptionKey = () => {
  return process.env.SUPABASE_ENCRYPTION_KEY || process.env.INTEGRATION_ENCRYPTION_KEY || 'catalyst-supabase-default-key-change-in-production';
};

SupabaseOAuthToken.encrypt = (text) => {
  if (!text || text.startsWith('encrypted:')) return text;
  
  try {
    const key = SupabaseOAuthToken.getEncryptionKey();
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `encrypted:${encrypted}`;
  } catch (error) {
    console.error('Failed to encrypt token:', error.message);
    return text;
  }
};

SupabaseOAuthToken.decrypt = (text) => {
  if (!text || !text.startsWith('encrypted:')) return text;
  
  try {
    const key = SupabaseOAuthToken.getEncryptionKey();
    const encryptedText = text.replace('encrypted:', '');
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt token:', error.message);
    return text;
  }
};

// Static methods
SupabaseOAuthToken.findByStore = async function(storeId) {
  return await this.findOne({
    where: { store_id: storeId }
  });
};

SupabaseOAuthToken.createOrUpdate = async function(storeId, tokenData) {
  const existing = await this.findByStore(storeId);
  
  if (existing) {
    return await existing.update(tokenData);
  } else {
    return await this.create({
      store_id: storeId,
      ...tokenData
    });
  }
};

SupabaseOAuthToken.isTokenExpired = function(token) {
  if (!token || !token.expires_at) return true;
  return new Date(token.expires_at) <= new Date();
};

module.exports = SupabaseOAuthToken;