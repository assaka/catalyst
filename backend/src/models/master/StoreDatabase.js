/**
 * StoreDatabase Model (Master Database)
 *
 * Stores encrypted tenant database connection credentials
 * Allows backend to connect to each store's tenant database
 */

const { DataTypes } = require('sequelize');
const { masterSequelize } = require('../../database/masterConnection');
const {
  encryptDatabaseCredentials,
  decryptDatabaseCredentials
} = require('../../utils/encryption');

const StoreDatabase = masterSequelize.define('StoreDatabase', {
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
    },
    onDelete: 'CASCADE'
  },
  database_type: {
    type: DataTypes.ENUM('supabase', 'postgresql', 'mysql'),
    allowNull: false
  },
  connection_string_encrypted: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'AES-256-GCM encrypted database credentials JSON'
  },
  host: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Database host (non-sensitive)'
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  database_name: {
    type: DataTypes.STRING,
    defaultValue: 'postgres'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_connection_test: {
    type: DataTypes.DATE,
    allowNull: true
  },
  connection_status: {
    type: DataTypes.ENUM('pending', 'connected', 'failed', 'timeout'),
    defaultValue: 'pending'
  }
}, {
  tableName: 'store_databases',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['store_id']
    },
    {
      fields: ['is_active'],
      where: {
        is_active: true
      }
    }
  ]
});

// Virtual Fields

/**
 * Get decrypted credentials (not stored, computed on access)
 */
StoreDatabase.prototype.getCredentials = function() {
  try {
    return decryptDatabaseCredentials(this.connection_string_encrypted);
  } catch (error) {
    console.error('Failed to decrypt credentials:', error.message);
    throw new Error('Unable to decrypt database credentials');
  }
};

// Instance Methods

/**
 * Set credentials (encrypts before storage)
 * @param {Object} credentials - Database credentials object
 * @param {string} credentials.projectUrl - Supabase project URL
 * @param {string} credentials.serviceRoleKey - Supabase service role key
 * @param {string} credentials.anonKey - Supabase anon key (optional)
 * @param {string} credentials.connectionString - PostgreSQL connection string
 */
StoreDatabase.prototype.setCredentials = function(credentials) {
  try {
    this.connection_string_encrypted = encryptDatabaseCredentials(credentials);

    // Extract non-sensitive info for quick reference
    if (credentials.projectUrl) {
      const url = new URL(credentials.projectUrl);
      this.host = url.hostname;
    }
  } catch (error) {
    console.error('Failed to encrypt credentials:', error.message);
    throw new Error('Unable to encrypt database credentials');
  }
};

/**
 * Test database connection
 * @returns {Promise<boolean>}
 */
StoreDatabase.prototype.testConnection = async function() {
  try {
    const credentials = this.getCredentials();

    // Import dynamically to avoid circular dependency
    const { createClient } = require('@supabase/supabase-js');

    if (this.database_type === 'supabase') {
      const client = createClient(
        credentials.projectUrl,
        credentials.serviceRoleKey
      );

      // Test with simple query
      const { data, error } = await client
        .from('stores')
        .select('id')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 = table not found (ok for new DB)
        throw error;
      }

      this.connection_status = 'connected';
      this.last_connection_test = new Date();
      await this.save();

      return true;
    }

    // TODO: Add PostgreSQL/MySQL connection testing
    return false;

  } catch (error) {
    console.error('Connection test failed:', error.message);
    this.connection_status = 'failed';
    this.last_connection_test = new Date();
    await this.save();

    return false;
  }
};

/**
 * Mark as active
 * @returns {Promise<void>}
 */
StoreDatabase.prototype.activate = async function() {
  this.is_active = true;
  this.connection_status = 'connected';
  await this.save();
};

/**
 * Mark as inactive
 * @returns {Promise<void>}
 */
StoreDatabase.prototype.deactivate = async function() {
  this.is_active = false;
  await this.save();
};

// Class Methods

/**
 * Find by store ID
 * @param {string} storeId - Store UUID
 * @returns {Promise<StoreDatabase|null>}
 */
StoreDatabase.findByStoreId = async function(storeId) {
  return this.findOne({
    where: { store_id: storeId, is_active: true }
  });
};

/**
 * Find all active connections
 * @returns {Promise<StoreDatabase[]>}
 */
StoreDatabase.findAllActive = async function() {
  return this.findAll({
    where: {
      is_active: true,
      connection_status: 'connected'
    }
  });
};

/**
 * Create and store encrypted credentials
 * @param {string} storeId - Store UUID
 * @param {string} databaseType - Database type
 * @param {Object} credentials - Credentials object
 * @returns {Promise<StoreDatabase>}
 */
StoreDatabase.createWithCredentials = async function(storeId, databaseType, credentials) {
  try {
    console.log('🔧 StoreDatabase.createWithCredentials called:', {
      storeId,
      databaseType,
      hasProjectUrl: !!credentials.projectUrl,
      hasServiceRoleKey: !!credentials.serviceRoleKey
    });

    const storeDb = this.build({
      store_id: storeId,
      database_type: databaseType
    });

    console.log('🔧 Built StoreDatabase instance, setting credentials...');
    storeDb.setCredentials(credentials);

    console.log('🔧 Credentials set, saving to master DB...');
    await storeDb.save();

    console.log('✅ StoreDatabase record saved successfully:', storeDb.id);
    return storeDb;
  } catch (error) {
    console.error('❌ StoreDatabase.createWithCredentials error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

module.exports = StoreDatabase;
