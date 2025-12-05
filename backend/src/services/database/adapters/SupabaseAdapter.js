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
   * Uses a method that works even if tables don't exist
   */
  async testConnection() {
    try {
      // Try to query any table - if it fails with "relation does not exist",
      // that's fine - the connection works, just no tables yet
      const { data, error } = await this.client
        .from('stores')
        .select('id')
        .limit(1);

      // No error = connection works
      if (!error) {
        return true;
      }

      // Check if error is just "table doesn't exist" (PostgreSQL error 42P01)
      // This means connection works but table is missing - that's OK for reprovisioning
      if (error.code === '42P01' ||
          error.message?.includes('relation') ||
          error.message?.includes('does not exist') ||
          error.code === 'PGRST116') {
        console.log('Supabase connection OK (table missing, will be created during provisioning)');
        return true;
      }

      // Any other error = actual connection problem
      console.error('Supabase connection test failed:', error);
      return false;
    } catch (error) {
      console.error('Supabase connection test exception:', error);
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
