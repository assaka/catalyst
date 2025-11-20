/**
 * MySQLAdapter - MySQL implementation of DatabaseAdapter
 *
 * Wraps mysql2 with the same interface as SupabaseAdapter
 * Routes can use this adapter transparently - they don't know if it's Supabase, PostgreSQL, or MySQL
 */

const DatabaseAdapter = require('../DatabaseAdapter');
const MySQLQueryBuilder = require('./MySQLQueryBuilder');

class MySQLAdapter extends DatabaseAdapter {
  constructor(pool, config = {}) {
    super(config);
    this.pool = pool;
    this.type = 'mysql';
  }

  /**
   * Get query builder for a table
   * Returns wrapped MySQL query that implements generic interface
   */
  from(table) {
    return new MySQLQueryBuilder(table, this.pool);
  }

  /**
   * Execute raw SQL query
   */
  async raw(sql, params = []) {
    try {
      const [rows, fields] = await this.pool.query(sql, params);
      return {
        data: Array.isArray(rows) ? rows : [rows],
        error: null,
        count: rows.affectedRows || rows.length
      };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code
        },
        count: 0
      };
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('MySQL connection test failed:', error);
      return false;
    }
  }

  /**
   * Close connection
   */
  async close() {
    await this.pool.end();
  }

  /**
   * Get underlying pool (for advanced operations)
   * Use sparingly - prefer using the adapter methods
   */
  getPool() {
    return this.pool;
  }
}

module.exports = MySQLAdapter;
