/**
 * Heatmap Interaction Event Handler
 * Processes heatmap interaction events from the unified event bus
 */

const HeatmapInteraction = require('../../../models/HeatmapInteraction');
const HeatmapSession = require('../../../models/HeatmapSession');
const { UAParser } = require('ua-parser-js');
const eventBus = require('../EventBus');

class HeatmapHandler {
  constructor() {
    this.sessionCache = new Map(); // Cache session updates to reduce DB calls
    this.registerHandlers();
  }

  /**
   * Register event handlers
   */
  registerHandlers() {
    // Batch handler for heatmap interaction events
    eventBus.subscribe(
      'heatmap_interaction',
      this.handleBatch.bind(this),
      {
        name: 'HeatmapHandler',
        batchHandler: true,
        priority: 10
      }
    );

    console.log('[HEATMAP] Handler registered');
  }

  /**
   * Handle batch of heatmap interaction events
   */
  async handleBatch(events) {
    try {
      const interactions = [];
      const sessionUpdates = new Map();

      for (const event of events) {
        // Parse user agent for device detection
        const deviceInfo = this.parseUserAgent(event.data.user_agent);

        // Prepare interaction data
        interactions.push({
          session_id: event.data.session_id,
          store_id: event.data.store_id,
          user_id: event.data.user_id || null,
          page_url: event.data.page_url,
          viewport_width: event.data.viewport_width || null,
          viewport_height: event.data.viewport_height || null,
          interaction_type: event.data.interaction_type,
          x_coordinate: event.data.x_coordinate || null,
          y_coordinate: event.data.y_coordinate || null,
          element_selector: event.data.element_selector || null,
          element_tag: event.data.element_tag || null,
          element_id: event.data.element_id || null,
          element_class: event.data.element_class || null,
          element_text: event.data.element_text || null,
          scroll_position: event.data.scroll_position || null,
          scroll_depth_percent: event.data.scroll_depth_percent || null,
          time_on_element: event.data.time_on_element || null,
          device_type: deviceInfo.device_type,
          user_agent: event.data.user_agent || null,
          ip_address: event.data.ip_address || null,
          timestamp_utc: new Date(),
          metadata: {
            ...event.data.metadata,
            event_id: event.id,
            correlation_id: event.metadata.correlationId,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            processed_at: new Date().toISOString()
          }
        });

        // Track session updates
        const sessionKey = `${event.data.session_id}_${event.data.store_id}`;
        if (!sessionUpdates.has(sessionKey)) {
          sessionUpdates.set(sessionKey, {
            session_id: event.data.session_id,
            store_id: event.data.store_id,
            user_id: event.data.user_id || null,
            last_page_url: event.data.page_url,
            device_type: deviceInfo.device_type,
            browser_name: deviceInfo.browser?.name,
            operating_system: deviceInfo.os?.name,
            interaction_count: 0
          });
        }

        sessionUpdates.get(sessionKey).interaction_count++;
      }

      // Bulk insert interactions
      await HeatmapInteraction.bulkCreate(interactions, {
        validate: true,
        returning: true
      });

      // Update sessions
      for (const [, sessionData] of sessionUpdates) {
        await this.updateSession(sessionData);
      }

      console.log(`[HEATMAP] Processed batch of ${interactions.length} interactions, ${sessionUpdates.size} sessions`);

      return { success: true, processed: interactions.length };
    } catch (error) {
      console.error('[HEATMAP] Batch processing error:', {
        error: error.message,
        stack: error.stack,
        count: events.length
      });

      throw error; // Re-throw to trigger retry logic
    }
  }

  /**
   * Update or create session
   */
  async updateSession(sessionData) {
    try {
      await HeatmapSession.createOrUpdate(sessionData);
    } catch (error) {
      console.error('[HEATMAP] Session update error:', {
        error: error.message,
        session_id: sessionData.session_id
      });
      // Don't throw - session update failure shouldn't fail the batch
    }
  }

  /**
   * Parse user agent to extract device and browser info
   */
  parseUserAgent(userAgent) {
    if (!userAgent) {
      return {
        device_type: 'desktop',
        browser: { name: 'Unknown', version: '' },
        os: { name: 'Unknown', version: '' }
      };
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Determine device type
    let deviceType = 'desktop';
    if (result.device.type === 'mobile') {
      deviceType = 'mobile';
    } else if (result.device.type === 'tablet') {
      deviceType = 'tablet';
    }

    return {
      device_type: deviceType,
      browser: {
        name: result.browser.name || 'Unknown',
        version: result.browser.version || ''
      },
      os: {
        name: result.os.name || 'Unknown',
        version: result.os.version || ''
      }
    };
  }
}

// Initialize handler
const handler = new HeatmapHandler();

module.exports = handler;
