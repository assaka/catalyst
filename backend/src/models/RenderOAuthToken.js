const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const crypto = require('crypto');

const RenderOAuthToken = sequelize.define('RenderOAuthToken', {
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
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true // Personal Access Tokens may not have expiration
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: true // May not be available for all token types
  },
  user_email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  owner_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  scope: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deployment_permissions: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  }
}, {
  tableName: 'render_oauth_tokens',
  hooks: {
    beforeCreate: (token) => {
      // Encrypt sensitive tokens before saving
      token.access_token = RenderOAuthToken.encrypt(token.access_token);
      if (token.refresh_token) {
        token.refresh_token = RenderOAuthToken.encrypt(token.refresh_token);
      }
    },
    beforeUpdate: (token) => {
      // Encrypt sensitive tokens before updating
      if (token.changed('access_token')) {
        token.access_token = RenderOAuthToken.encrypt(token.access_token);
      }
      if (token.changed('refresh_token') && token.refresh_token) {
        token.refresh_token = RenderOAuthToken.encrypt(token.refresh_token);
      }
    },
    afterFind: (result) => {
      if (!result) return;
      
      const tokens = Array.isArray(result) ? result : [result];
      tokens.forEach(token => {
        if (token) {
          // Decrypt sensitive tokens after fetching
          token.access_token = RenderOAuthToken.decrypt(token.access_token);
          if (token.refresh_token) {
            token.refresh_token = RenderOAuthToken.decrypt(token.refresh_token);
          }
        }
      });
    }
  }
});

// Encryption/Decryption utilities
RenderOAuthToken.getEncryptionKey = () => {
  return process.env.RENDER_ENCRYPTION_KEY || process.env.INTEGRATION_ENCRYPTION_KEY || 'catalyst-render-default-key-change-in-production';
};

RenderOAuthToken.encrypt = (text) => {
  if (!text || text.startsWith('encrypted:')) return text;
  
  try {
    const key = RenderOAuthToken.getEncryptionKey();
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `encrypted:${encrypted}`;
  } catch (error) {
    console.error('Failed to encrypt token:', error.message);
    return text;
  }
};

RenderOAuthToken.decrypt = (text) => {
  if (!text || !text.startsWith('encrypted:')) return text;
  
  try {
    const key = RenderOAuthToken.getEncryptionKey();
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
RenderOAuthToken.findByStore = async function(storeId) {
  return await this.findOne({
    where: { store_id: storeId }
  });
};

RenderOAuthToken.createOrUpdate = async function(storeId, tokenData) {
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

RenderOAuthToken.isTokenExpired = function(token) {
  if (!token || !token.expires_at) return true;
  return new Date(token.expires_at) <= new Date();
};

module.exports = RenderOAuthToken;