/**
 * Customer Activity Event Handler
 * Processes customer activity events from the unified event bus
 */

const { CustomerActivity } = require('../../../models');
const eventBus = require('../EventBus');

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
        metadata: {
          ...event.data.metadata,
          event_id: event.id,
          correlation_id: event.metadata.correlationId,
          processed_at: new Date().toISOString()
        }
      }));

      // Bulk insert
      await CustomerActivity.bulkCreate(activities, {
        validate: true,
        returning: true
      });

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
