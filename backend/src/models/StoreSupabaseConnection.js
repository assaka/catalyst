const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const crypto = require('crypto');

const StoreSupabaseConnection = sequelize.define('StoreSupabaseConnection', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  connection_name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'primary'
  },
  project_url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  anon_key: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  service_key: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  jwt_secret: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  database_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  connection_status: {
    type: DataTypes.ENUM('active', 'inactive', 'error'),
    defaultValue: 'active'
  },
  last_tested_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  connection_metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'store_supabase_connections',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'connection_name']
    },
    {
      fields: ['store_id']
    },
    {
      fields: ['connection_status']
    }
  ]
});

// Encryption helper methods
const ENCRYPTION_KEY = process.env.SUPABASE_ENCRYPTION_KEY || 'default-key-change-in-production';

function encrypt(text) {
  if (!text) return null;
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `encrypted:${encrypted}`;
}

function decrypt(encryptedText) {
  if (!encryptedText || !encryptedText.startsWith('encrypted:')) {
    return encryptedText; // Return as-is if not encrypted
  }
  
  const encrypted = encryptedText.replace('encrypted:', '');
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Instance methods
StoreSupabaseConnection.prototype.activate = function() {
  return this.update({ connection_status: 'active', updated_at: new Date() });
};

StoreSupabaseConnection.prototype.deactivate = function() {
  return this.update({ connection_status: 'inactive', updated_at: new Date() });
};

StoreSupabaseConnection.prototype.markAsError = function(errorMessage = null) {
  const metadata = { ...this.connection_metadata };
  if (errorMessage) {
    metadata.lastError = errorMessage;
    metadata.lastErrorAt = new Date().toISOString();
  }
  
  return this.update({ 
    connection_status: 'error',
    connection_metadata: metadata,
    updated_at: new Date()
  });
};

StoreSupabaseConnection.prototype.testConnection = async function() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const client = createClient(this.project_url, this.getDecryptedAnonKey());
    
    // Test basic connectivity
    const { data, error } = await client.from('_test_connection_').select('*').limit(1);
    
    // Even if the table doesn't exist, if we get a proper error (not network error), connection is working
    const isConnected = !error || (error && !error.message.includes('network') && !error.message.includes('fetch'));
    
    if (isConnected) {
      await this.update({
        connection_status: 'active',
        last_tested_at: new Date(),
        updated_at: new Date()
      });
      return { success: true, message: 'Connection successful' };
    } else {
      await this.markAsError(error.message);
      return { success: false, error: error.message };
    }
  } catch (error) {
    await this.markAsError(error.message);
    return { success: false, error: error.message };
  }
};

StoreSupabaseConnection.prototype.getDecryptedAnonKey = function() {
  return decrypt(this.anon_key);
};

StoreSupabaseConnection.prototype.getDecryptedServiceKey = function() {
  return decrypt(this.service_key);
};

StoreSupabaseConnection.prototype.getDecryptedJwtSecret = function() {
  return this.jwt_secret ? decrypt(this.jwt_secret) : null;
};

StoreSupabaseConnection.prototype.updateKeys = function(keyData) {
  const updateData = {
    updated_at: new Date()
  };
  
  if (keyData.anon_key) {
    updateData.anon_key = encrypt(keyData.anon_key);
  }
  
  if (keyData.service_key) {
    updateData.service_key = encrypt(keyData.service_key);
  }
  
  if (keyData.jwt_secret) {
    updateData.jwt_secret = encrypt(keyData.jwt_secret);
  }
  
  if (keyData.database_url) {
    updateData.database_url = keyData.database_url;
  }
  
  return this.update(updateData);
};

// Static methods
StoreSupabaseConnection.findByStore = function(storeId, connectionName = 'primary') {
  return this.findOne({
    where: { 
      store_id: storeId,
      connection_name: connectionName
    }
  });
};

StoreSupabaseConnection.findActiveByStore = function(storeId, connectionName = 'primary') {
  return this.findOne({
    where: { 
      store_id: storeId,
      connection_name: connectionName,
      connection_status: 'active'
    }
  });
};

StoreSupabaseConnection.createOrUpdate = async function(storeId, connectionData) {
  const { connection_name = 'primary', project_url, anon_key, service_key, jwt_secret, database_url, connection_metadata = {} } = connectionData;
  
  const existing = await this.findOne({
    where: {
      store_id: storeId,
      connection_name: connection_name
    }
  });

  const encryptedData = {
    project_url,
    anon_key: encrypt(anon_key),
    service_key: encrypt(service_key),
    jwt_secret: jwt_secret ? encrypt(jwt_secret) : null,
    database_url,
    connection_metadata,
    connection_status: 'active',
    updated_at: new Date()
  };

  if (existing) {
    return existing.update(encryptedData);
  } else {
    return this.create({
      store_id: storeId,
      connection_name,
      ...encryptedData
    });
  }
};

StoreSupabaseConnection.getConnectionStats = async function(storeId) {
  const connections = await this.findAll({
    where: { store_id: storeId },
    attributes: ['connection_name', 'connection_status', 'last_tested_at', 'created_at']
  });

  return {
    total: connections.length,
    active: connections.filter(c => c.connection_status === 'active').length,
    inactive: connections.filter(c => c.connection_status === 'inactive').length,
    error: connections.filter(c => c.connection_status === 'error').length,
    connections: connections.map(c => ({
      name: c.connection_name,
      status: c.connection_status,
      lastTested: c.last_tested_at,
      createdAt: c.created_at
    }))
  };
};

// Hooks
StoreSupabaseConnection.beforeUpdate((connection) => {
  connection.updated_at = new Date();
});

// Virtual getters for decrypted values (use with caution)
StoreSupabaseConnection.prototype.getDecryptedData = function() {
  return {
    project_url: this.project_url,
    anon_key: this.getDecryptedAnonKey(),
    service_key: this.getDecryptedServiceKey(),
    jwt_secret: this.getDecryptedJwtSecret(),
    database_url: this.database_url
  };
};

module.exports = StoreSupabaseConnection;