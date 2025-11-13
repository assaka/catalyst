/**
 * Master Database Utility
 *
 * Unified interface for master DB operations
 * Uses Supabase client (REST API over HTTPS) to avoid pooler connection issues
 *
 * Provides consistent API for all master DB queries
 */

const { masterSupabaseClient } = require('../database/masterConnection');

class MasterDB {
  /**
   * Query a table
   * @param {string} table - Table name
   * @returns {Object} Supabase query builder
   */
  static from(table) {
    if (!masterSupabaseClient) {
      throw new Error('Master Supabase client not initialized. Check MASTER_SUPABASE_URL and MASTER_SUPABASE_SERVICE_KEY');
    }
    return masterSupabaseClient.from(table);
  }

  /**
   * Execute raw SQL (for complex queries)
   * @param {string} sql - SQL query
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  static async query(sql, params = {}) {
    if (!masterSupabaseClient) {
      throw new Error('Master Supabase client not initialized');
    }

    // Use Supabase RPC for raw SQL
    const { data, error } = await masterSupabaseClient.rpc('exec_sql', {
      query: sql,
      params
    });

    if (error) {
      throw new Error(`SQL query failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Insert record
   * @param {string} table - Table name
   * @param {Object} data - Data to insert
   * @returns {Promise<Object>} Inserted record
   */
  static async insert(table, data) {
    const { data: result, error } = await this.from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Insert failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Update record
   * @param {string} table - Table name
   * @param {Object} data - Data to update
   * @param {Object} where - Where conditions
   * @returns {Promise<Object>} Updated record
   */
  static async update(table, data, where) {
    let query = this.from(table).update(data);

    // Apply where conditions
    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data: result, error } = await query.select().single();

    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Delete record
   * @param {string} table - Table name
   * @param {Object} where - Where conditions
   * @returns {Promise<void>}
   */
  static async delete(table, where) {
    let query = this.from(table).delete();

    // Apply where conditions
    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { error } = await query;

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Find single record
   * @param {string} table - Table name
   * @param {Object} where - Where conditions
   * @returns {Promise<Object|null>} Record or null
   */
  static async findOne(table, where) {
    let query = this.from(table).select('*');

    // Apply where conditions
    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query.limit(1).single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      throw new Error(`FindOne failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Find all records
   * @param {string} table - Table name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of records
   */
  static async findAll(table, options = {}) {
    let query = this.from(table).select('*');

    // Apply where conditions
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Apply order
    if (options.order) {
      const [column, direction] = options.order;
      query = query.order(column, { ascending: direction === 'ASC' });
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`FindAll failed: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Count records
   * @param {string} table - Table name
   * @param {Object} where - Where conditions
   * @returns {Promise<number>} Count
   */
  static async count(table, where = {}) {
    let query = this.from(table).select('*', { count: 'exact', head: true });

    // Apply where conditions
    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { count, error } = await query;

    if (error) {
      throw new Error(`Count failed: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Test connection
   * @returns {Promise<boolean>}
   */
  static async testConnection() {
    try {
      const { data, error } = await this.from('users')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      return false;
    }
  }
}

module.exports = MasterDB;
