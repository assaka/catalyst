const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const { IntegrationConfig } = require('../../models');
const { Op } = require('sequelize');

/**
 * ConnectionManager - Manages database connections for stores
 *
 * Handles:
 * - Master DB connection (platform data)
 * - Client DB connections (per-store data)
 * - Connection pooling and caching
 * - Multi-database query routing
 */
class ConnectionManager {
  static connections = new Map();
  static masterConnection = null;

  /**
   * Get the master database connection (platform DB)
   * Contains: stores, users, subscriptions, billing, usage_metrics, etc.
   */
  static getMasterConnection() {
    if (!this.masterConnection) {
      const { sequelize } = require('../../database/connection');
      this.masterConnection = sequelize;
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
      return this.connections.get(storeId);
    }

    // Get connection configuration from master DB
    const config = await IntegrationConfig.findOne({
      where: {
        store_id: storeId,
        integration_type: {
          [Op.in]: [
            'supabase-database',
            'postgresql',
            'mysql',
            'supabase' // Legacy fallback
          ]
        },
        is_active: true
      }
    });

    if (!config) {
      throw new Error(
        `No database configured for store ${storeId}. ` +
        'Please configure a database integration first.'
      );
    }

    // Create connection based on database type
    const connection = await this._createConnection(
      config.integration_type,
      config.config_data,
      storeId
    );

    // Test the connection
    try {
      await this._testConnection(connection, config.integration_type);
    } catch (error) {
      console.error(`Failed to connect to database for store ${storeId}:`, error.message);
      throw new Error(`Database connection failed: ${error.message}`);
    }

    // Cache the connection
    if (cache) {
      this.connections.set(storeId, {
        connection,
        type: config.integration_type,
        createdAt: new Date()
      });
    }

    return connection;
  }

  /**
   * Create a database connection based on integration type
   * @private
   */
  static async _createConnection(type, config, storeId) {
    switch (type) {
      case 'supabase-database':
      case 'supabase': // Legacy
        return this._createSupabaseConnection(config);

      case 'postgresql':
        return this._createPostgreSQLConnection(config);

      case 'mysql':
        return this._createMySQLConnection(config);

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
      case 'supabase-database':
      case 'supabase':
        // Test with a simple query
        const { data, error } = await connection
          .from('products')
          .select('id')
          .limit(1);
        if (error) throw error;
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
   * Get connection info for a store
   *
   * @param {string} storeId - Store UUID
   * @returns {Promise<Object>} Connection information (without sensitive data)
   */
  static async getConnectionInfo(storeId) {
    const config = await IntegrationConfig.findOne({
      where: {
        store_id: storeId,
        integration_type: {
          [Op.in]: ['supabase-database', 'postgresql', 'mysql', 'supabase']
        },
        is_active: true
      }
    });

    if (!config) {
      return null;
    }

    return {
      type: config.integration_type,
      status: config.connection_status,
      lastTested: config.connection_tested_at,
      isActive: config.is_active,
      // Don't expose sensitive connection details
      hasConfiguration: !!config.config_data
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
