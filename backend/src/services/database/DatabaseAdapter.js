/**
 * DatabaseAdapter - Generic database interface
 *
 * This abstract class defines the interface that all database adapters must implement.
 * Allows ConnectionManager to support multiple database types (Supabase, PostgreSQL, MySQL, etc.)
 *
 * Tenants can select their database type in Store → Database settings.
 */

class DatabaseAdapter {
  constructor(config) {
    this.config = config;
    this.type = 'generic'; // Override in subclasses: 'supabase', 'postgres', 'mysql', etc.
  }

  /**
   * Get a query builder for a table
   * @param {string} table - Table name
   * @returns {QueryBuilder} Query builder instance
   */
  from(table) {
    throw new Error('from() must be implemented by adapter');
  }

  /**
   * Execute a raw query (for complex operations)
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async raw(sql, params = []) {
    throw new Error('raw() must be implemented by adapter');
  }

  /**
   * Get database type
   * @returns {string} Database type ('supabase', 'postgres', etc.)
   */
  getType() {
    return this.type;
  }

  /**
   * Test database connection
   * @returns {Promise<boolean>} True if connected
   */
  async testConnection() {
    throw new Error('testConnection() must be implemented by adapter');
  }

  /**
   * Close database connection
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error('close() must be implemented by adapter');
  }
}

module.exports = DatabaseAdapter;
