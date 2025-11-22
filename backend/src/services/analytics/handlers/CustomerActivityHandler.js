/**
 * Customer Activity Event Handler
 * Processes customer activity events from the unified event bus
 */

const eventBus = require('../EventBus');
const ConnectionManager = require('../../database/ConnectionManager');

class CustomerActivityHandler {
  constructor() {
    this.registerHandlers();
  }

  /**
   * Register event handlers
   */
  registerHandlers() {
    // Batch handler for customer activity events
    eventBus.subscribe(
      'customer_activity',
      this.handleBatch.bind(this),
      {
        name: 'CustomerActivityHandler',
        batchHandler: true,
        priority: 10
      }
    );

    console.log('[CUSTOMER ACTIVITY] Handler registered');
  }

  /**
   * Handle batch of customer activity events
   */
  async handleBatch(events) {
    try {
      const activities = events.map(event => ({
        session_id: event.data.session_id,
        store_id: event.data.store_id,
        user_id: event.data.user_id || null,
        activity_type: event.data.activity_type,
        page_url: event.data.page_url || null,
        referrer: event.data.referrer || null,
        product_id: event.data.product_id || null,
        search_query: event.data.search_query || null,
        user_agent: event.data.user_agent || null,
        ip_address: event.data.ip_address || null,
        country: event.data.country || null,
        country_name: event.data.country_name || null,
        city: event.data.city || null,
        region: event.data.region || null,
        language: event.data.language || null,
        timezone: event.data.timezone || null,
        metadata: {
          ...event.data.metadata,
          event_id: event.id,
          correlation_id: event.metadata.correlationId,
          processed_at: new Date().toISOString()
        }
      }));

      // Get store_id from first activity (all should have same store_id in a batch)
      const store_id = activities[0]?.store_id;
      if (!store_id) {
        throw new Error('store_id not found in activity events');
      }

      // Get tenant connection
      const tenantDb = await ConnectionManager.getStoreConnection(store_id);

      // Bulk insert using Supabase
      const { error: insertError } = await tenantDb
        .from('customer_activities')
        .insert(activities);

      if (insertError) {
        throw insertError;
      }

      console.log(`[CUSTOMER ACTIVITY] Processed batch of ${activities.length} events`);

      return { success: true, processed: activities.length };
    } catch (error) {
      console.error('[CUSTOMER ACTIVITY] Batch processing error:', {
        error: error.message,
        stack: error.stack,
        count: events.length
      });

      throw error; // Re-throw to trigger retry logic
    }
  }
}

// Initialize handler
const handler = new CustomerActivityHandler();

module.exports = handler;
