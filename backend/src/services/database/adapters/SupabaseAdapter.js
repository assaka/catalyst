/**
 * SupabaseAdapter - Supabase implementation of DatabaseAdapter
 *
 * Wraps Supabase client with generic database interface.
 * Routes use this adapter through ConnectionManager, making them DB-agnostic.
 */

const DatabaseAdapter = require('../DatabaseAdapter');
const SupabaseQueryBuilder = require('./SupabaseQueryBuilder');

class SupabaseAdapter extends DatabaseAdapter {
  constructor(supabaseClient, config = {}) {
    super(config);
    this.client = supabaseClient;
    this.type = 'supabase';
  }

  /**
   * Get query builder for a table
   * Returns wrapped Supabase query that implements generic interface
   */
  from(table) {
    const supabaseQuery = this.client.from(table);
    return new SupabaseQueryBuilder(supabaseQuery);
  }

  /**
   * Execute raw SQL query
   * Note: Supabase doesn't support arbitrary SQL, so this uses RPC functions
   */
  async raw(sql, params = []) {
    // For Supabase, raw queries need to be implemented as database functions
    // This is a limitation of Supabase's security model
    throw new Error('Raw SQL not supported by Supabase. Use RPC functions instead.');
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      // Simple query to test connection
      const { error } = await this.client
        .from('stores')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  }

  /**
   * Close connection (Supabase handles this automatically)
   */
  async close() {
    // Supabase client doesn't need explicit closing
    // Connection pooling is handled by Supabase
    return Promise.resolve();
  }

  /**
   * Get underlying Supabase client (for advanced operations)
   * Use sparingly - prefer using the adapter methods
   */
  getClient() {
    return this.client;
  }
}

module.exports = SupabaseAdapter;
