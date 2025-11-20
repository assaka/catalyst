/**
 * PostgreSQLAdapter - PostgreSQL implementation of DatabaseAdapter
 *
 * Wraps node-postgres (pg) with the same interface as SupabaseAdapter
 * Routes can use this adapter transparently - they don't know if it's Supabase or PostgreSQL
 */

const DatabaseAdapter = require('../DatabaseAdapter');
const PostgreSQLQueryBuilder = require('./PostgreSQLQueryBuilder');

class PostgreSQLAdapter extends DatabaseAdapter {
  constructor(pool, config = {}) {
    super(config);
    this.pool = pool;
    this.type = 'postgresql';
  }

  /**
   * Get query builder for a table
   * Returns wrapped PostgreSQL query that implements generic interface
   */
  from(table) {
    return new PostgreSQLQueryBuilder(table, this.pool);
  }

  /**
   * Execute raw SQL query
   */
  async raw(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return {
        data: result.rows,
        error: null,
        count: result.rowCount
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
      console.error('PostgreSQL connection test failed:', error);
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

module.exports = PostgreSQLAdapter;
