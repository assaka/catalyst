const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const { Op } = require('sequelize');

/**
 * ConnectionManager - Manages database connections for stores
 *
 * UPDATED for Master-Tenant Architecture:
 * - Master DB connection (platform data: users, stores, subscriptions, credits)
 * - Tenant DB connections (per-store data: products, orders, customers)
 * - Connection pooling and caching
 * - Multi-database query routing
 *
 * Uses StoreDatabase model from master DB to fetch encrypted tenant credentials
 */
class ConnectionManager {
  static connections = new Map();
  static masterConnection = null;

  /**
   * Get the master database connection (platform DB)
   * Contains: users (agencies), stores (minimal), subscriptions, credits, monitoring
   */
  static getMasterConnection() {
    if (!this.masterConnection) {
      const { masterSequelize } = require('../../database/masterConnection');
      this.masterConnection = masterSequelize;
    }
    return this.masterConnection;
  }

  /**
   * Get store-specific database connection (client DB)
   * Contains: products, categories, orders, customers, etc.
   *
   * @param {string} storeId - Store UUID
   * @param {boolean} cache - Whether to use cached connection (default: true)
   * @returns {Promise<Object>} Database connection object
   */
  static async getStoreConnection(storeId, cache = true) {
    // Validate store ID
    if (!storeId || storeId === 'undefined') {
      throw new Error('Valid store ID is required');
    }

    // Check cache first
    if (cache && this.connections.has(storeId)) {
      const cached = this.connections.get(storeId);
      return cached.connection || cached; // Return just the connection, not the wrapper object
    }

    // Get connection configuration from master DB (use Supabase client to avoid Sequelize auth issues)
    const { masterDbClient } = require('../../database/masterConnection');
    const { decryptDatabaseCredentials } = require('../../utils/encryption');

    const { data: storeDb, error } = await masterDbClient
      .from('store_databases')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch database config: ${error.message}`);
    }

    if (!storeDb) {
      throw new Error(
        `No database configured for store ${storeId}. ` +
        'Please connect a database first.'
      );
    }

    if (!storeDb.is_active) {
      throw new Error(`Database for store ${storeId} is inactive`);
    }

    // Decrypt credentials from master DB
    const credentials = decryptDatabaseCredentials(storeDb.connection_string_encrypted);

    // Create connection based on database type
    const connection = await this._createConnection(
      storeDb.database_type,
      credentials,
      storeId
    );

    // Test the connection
    try {
      await this._testConnection(connection, storeDb.database_type);
    } catch (error) {
      console.error(`Failed to connect to database for store ${storeId}:`, error.message);
      throw new Error(`Database connection failed: ${error.message}`);
    }

    // Cache the connection
    if (cache) {
      this.connections.set(storeId, {
        connection,
        type: storeDb.database_type,
        createdAt: new Date()
      });
    }

    return connection;
  }

  /**
   * Create a database connection based on database type
   * @private
   */
  static async _createConnection(type, credentials, storeId) {
    switch (type) {
      case 'supabase':
        return this._createSupabaseConnection(credentials);

      case 'postgresql':
        return this._createPostgreSQLConnection(credentials);

      case 'mysql':
        return this._createMySQLConnection(credentials);

      default:
        throw new Error(`Unknown database type: ${type}`);
    }
  }

  /**
   * Create Supabase client connection
   * @private
   */
  static _createSupabaseConnection(config) {
    if (!config.projectUrl) {
      throw new Error('Supabase projectUrl is required');
    }

    if (!config.serviceRoleKey) {
      throw new Error('Supabase serviceRoleKey is required');
    }

    return createClient(config.projectUrl, config.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      db: {
        schema: config.schema || 'public'
      }
    });
  }

  /**
   * Create PostgreSQL connection pool
   * @private
   */
  static _createPostgreSQLConnection(config) {
    if (!config.host || !config.database) {
      throw new Error('PostgreSQL host and database are required');
    }

    return new Pool({
      host: config.host,
      port: config.port || 5432,
      database: config.database,
      user: config.username || config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: config.maxConnections || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
  }

  /**
   * Create MySQL connection pool
   * @private
   */
  static _createMySQLConnection(config) {
    if (!config.host || !config.database) {
      throw new Error('MySQL host and database are required');
    }

    const mysql = require('mysql2/promise');

    return mysql.createPool({
      host: config.host,
      port: config.port || 3306,
      database: config.database,
      user: config.username || config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
      waitForConnections: true,
      connectionLimit: config.maxConnections || 10,
      queueLimit: 0
    });
  }

  /**
   * Test database connection
   * @private
   */
  static async _testConnection(connection, type) {
    switch (type) {
      case 'supabase':
        // Test with a simple query (stores table should exist in tenant DB)
        const { data, error } = await connection
          .from('stores')
          .select('id')
          .limit(1);
        // PGRST116 = table not found (ok for new/empty DB)
        if (error && error.code !== 'PGRST116') throw error;
        break;

      case 'postgresql':
      case 'mysql':
        // Test with a ping query
        await connection.query('SELECT 1');
        break;
    }
  }

  /**
   * Execute a query on a store's database
   *
   * @param {string} storeId - Store UUID
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Query results
   */
  static async query(storeId, sql, params = []) {
    const connectionInfo = await this.getStoreConnection(storeId);
    const connection = connectionInfo.connection || connectionInfo;
    const type = connectionInfo.type;

    switch (type) {
      case 'supabase-database':
      case 'supabase':
        // Supabase uses its own query syntax
        throw new Error('Use Supabase client methods directly instead of raw SQL');

      case 'postgresql':
      case 'mysql':
        const result = await connection.query(sql, params);
        return result.rows || result[0]; // PostgreSQL returns .rows, MySQL returns array

      default:
        throw new Error(`Query not supported for type: ${type}`);
    }
  }

  /**
   * Execute a query on the master database
   *
   * @param {string} sql - SQL query
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Query results
   */
  static async queryMaster(sql, options = {}) {
    const sequelize = this.getMasterConnection();
    const [results] = await sequelize.query(sql, options);
    return results;
  }

  /**
   * Get a Sequelize connection for a store with models
   * This is a convenience wrapper around getStoreConnection that also loads Sequelize models
   *
   * @param {string} storeId - Store UUID
   * @returns {Promise<Object>} Object with sequelize instance and models
   */
  static async getConnection(storeId) {
    // Check cache first
    const cacheKey = `connection_${storeId}`;
    if (this.connections.has(cacheKey)) {
      return this.connections.get(cacheKey);
    }

    // This returns a Supabase client or raw connection from getStoreConnection
    // For tenant operations, we need to create a Sequelize instance with the models
    const { Sequelize } = require('sequelize');

    // Get the store database configuration
    const { masterDbClient } = require('../../database/masterConnection');
    const { decryptDatabaseCredentials } = require('../../utils/encryption');

    const { data: storeDb, error } = await masterDbClient
      .from('store_databases')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !storeDb) {
      throw new Error(`No database configured for store ${storeId}`);
    }

    // Decrypt credentials
    const credentials = decryptDatabaseCredentials(storeDb.connection_string_encrypted);

    // Create Sequelize instance for the tenant database
    let sequelize;
    if (storeDb.database_type === 'supabase' || storeDb.database_type === 'postgresql') {
      // Build connection string
      const connectionString = credentials.connectionString ||
        `postgresql://${credentials.username}:${credentials.password}@${credentials.host}:${credentials.port || 5432}/${credentials.database}`;

      sequelize = new Sequelize(connectionString, {
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      });
    } else {
      throw new Error(`Unsupported database type for Sequelize: ${storeDb.database_type}`);
    }

    // Test the connection
    await sequelize.authenticate();

    // Import all models and bind them to this Sequelize instance
    // This creates a fresh set of models for the tenant database
    const models = require('../../models');

    // Return object with models attached
    const connectionObj = {
      sequelize,
      models, // The models are already connected to the default Sequelize instance
      type: storeDb.database_type
    };

    // Cache the connection
    this.connections.set(cacheKey, connectionObj);

    return connectionObj;
  }

  /**
   * Get connection info for a store
   *
   * @param {string} storeId - Store UUID
   * @returns {Promise<Object>} Connection information (without sensitive data)
   */
  static async getConnectionInfo(storeId) {
    const { StoreDatabase } = require('../../models/master');
    const storeDb = await StoreDatabase.findByStoreId(storeId);

    if (!storeDb) {
      return null;
    }

    return {
      type: storeDb.database_type,
      status: storeDb.connection_status,
      lastTested: storeDb.last_connection_test,
      isActive: storeDb.is_active,
      host: storeDb.host, // Non-sensitive
      // Don't expose sensitive connection details (credentials are encrypted)
      hasConfiguration: !!storeDb.connection_string_encrypted
    };
  }

  /**
   * Clear cached connection for a store
   *
   * @param {string} storeId - Store UUID (optional, clears all if not provided)
   */
  static clearCache(storeId = null) {
    if (storeId) {
      const connectionInfo = this.connections.get(storeId);
      if (connectionInfo) {
        // Close connection if it has an end method
        if (connectionInfo.connection?.end) {
          connectionInfo.connection.end().catch(console.error);
        }
        this.connections.delete(storeId);
      }
    } else {
      // Clear all connections
      for (const [id, info] of this.connections.entries()) {
        if (info.connection?.end) {
          info.connection.end().catch(console.error);
        }
      }
      this.connections.clear();
    }
  }

  /**
   * Get all cached connections (for monitoring)
   */
  static getCachedConnections() {
    const cached = [];
    for (const [storeId, info] of this.connections.entries()) {
      cached.push({
        storeId,
        type: info.type,
        cachedSince: info.createdAt
      });
    }
    return cached;
  }

  /**
   * Test connection for a store without caching
   *
   * @param {string} storeId - Store UUID
   * @returns {Promise<Object>} Connection test result
   */
  static async testStoreConnection(storeId) {
    try {
      const connection = await this.getStoreConnection(storeId, false);
      return {
        success: true,
        message: 'Successfully connected to store database',
        storeId
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        storeId
      };
    }
  }

  /**
   * Close all connections (for graceful shutdown)
   */
  static async closeAll() {
    console.log('Closing all database connections...');

    for (const [storeId, info] of this.connections.entries()) {
      try {
        if (info.connection?.end) {
          await info.connection.end();
          console.log(`Closed connection for store ${storeId}`);
        }
      } catch (error) {
        console.error(`Error closing connection for store ${storeId}:`, error.message);
      }
    }

    this.connections.clear();

    // Close master connection
    if (this.masterConnection) {
      try {
        await this.masterConnection.close();
        console.log('Closed master database connection');
      } catch (error) {
        console.error('Error closing master connection:', error.message);
      }
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await ConnectionManager.closeAll();
});

process.on('SIGINT', async () => {
  await ConnectionManager.closeAll();
});

module.exports = ConnectionManager;
