const HeatmapInteraction = require('../models/HeatmapInteraction');
const HeatmapSession = require('../models/HeatmapSession');
const { UAParser } = require('ua-parser-js');

class HeatmapTrackingService {
  constructor() {
    this.batchSize = 50;
    this.batchTimeout = 5000; // 5 seconds
    this.pendingInteractions = [];
    this.batchTimer = null;
  }

  // Track a single interaction
  async trackInteraction(interactionData) {
    try {
      // Validate required fields
      const {
        session_id,
        store_id,
        page_url,
        viewport_width,
        viewport_height,
        interaction_type
      } = interactionData;

      if (!session_id || !store_id || !page_url || !interaction_type) {
        throw new Error('Missing required interaction data');
      }

      // Parse user agent for device detection
      const deviceInfo = this.parseUserAgent(interactionData.user_agent);

      // Enrich interaction data
      const enrichedData = {
        ...interactionData,
        device_type: deviceInfo.device_type,
        timestamp_utc: new Date(),
        metadata: {
          ...interactionData.metadata,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          parsed_at: new Date().toISOString()
        }
      };

      // Add to batch for processing
      this.addToBatch(enrichedData);

      // Update session information
      await this.updateSession(session_id, store_id, {
        last_page_url: page_url,
        interaction_count: 1,
        device_type: deviceInfo.device_type,
        browser_name: deviceInfo.browser?.name,
        operating_system: deviceInfo.os?.name
      });

      return { success: true, interaction_id: enrichedData.id };
    } catch (error) {
      console.error('Error tracking heatmap interaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Batch multiple interactions for better performance
  async trackInteractionBatch(interactions) {
    try {
      const validInteractions = [];

      for (const interaction of interactions) {
        if (this.validateInteraction(interaction)) {
          const deviceInfo = this.parseUserAgent(interaction.user_agent);
          validInteractions.push({
            ...interaction,
            device_type: deviceInfo.device_type,
            timestamp_utc: new Date(),
            metadata: {
              ...interaction.metadata,
              browser: deviceInfo.browser,
              os: deviceInfo.os,
              batch_processed: true
            }
          });
        }
      }

      if (validInteractions.length > 0) {
        await HeatmapInteraction.bulkCreate(validInteractions);
        console.log(`Successfully processed ${validInteractions.length} heatmap interactions`);
      }

      return { success: true, processed: validInteractions.length };
    } catch (error) {
      console.error('Error processing interaction batch:', error);
      return { success: false, error: error.message };
    }
  }

  // Add interaction to batch queue
  addToBatch(interactionData) {
    this.pendingInteractions.push(interactionData);

    // Process batch when it reaches the batch size
    if (this.pendingInteractions.length >= this.batchSize) {
      this.processBatch();
    } else {
      // Set timer to process batch after timeout
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchTimeout);
    }
  }

  // Process the current batch
  async processBatch() {
    if (this.pendingInteractions.length === 0) return;

    const currentBatch = [...this.pendingInteractions];
    this.pendingInteractions = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    await this.trackInteractionBatch(currentBatch);
  }

  // Update or create session
  async updateSession(sessionId, storeId, sessionData) {
    try {
      const session = await HeatmapSession.createOrUpdate({
        session_id: sessionId,
        store_id: storeId,
        ...sessionData
      });

      return session;
    } catch (error) {
      console.error('Error updating heatmap session:', error);
      throw error;
    }
  }

  // Parse user agent to extract device and browser info
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

  // Validate interaction data
  validateInteraction(interaction) {
    const required = ['session_id', 'store_id', 'page_url', 'interaction_type'];
    return required.every(field => interaction[field] !== undefined && interaction[field] !== null);
  }

  // Get heatmap data for visualization
  async getHeatmapData(storeId, pageUrl, options = {}) {
    try {
      const heatmapData = await HeatmapInteraction.getHeatmapData(storeId, pageUrl, options);
      
      // Group interactions by coordinates for better visualization
      const coordinateMap = new Map();
      
      heatmapData.forEach(interaction => {
        const key = `${interaction.normalized_x},${interaction.normalized_y}`;
        if (!coordinateMap.has(key)) {
          coordinateMap.set(key, {
            x: interaction.normalized_x,
            y: interaction.normalized_y,
            interactions: [],
            total_count: 0,
            interaction_types: {}
          });
        }
        
        const point = coordinateMap.get(key);
        point.interactions.push(interaction);
        point.total_count++;
        
        const type = interaction.interaction_type;
        point.interaction_types[type] = (point.interaction_types[type] || 0) + 1;
      });

      return Array.from(coordinateMap.values());
    } catch (error) {
      console.error('Error getting heatmap data:', error);
      throw error;
    }
  }

  // Get session analytics
  async getSessionAnalytics(storeId, options = {}) {
    try {
      const analytics = await HeatmapSession.getSessionAnalytics(storeId, options);
      const topPages = await HeatmapSession.getTopPages(storeId, options);

      return {
        analytics,
        topPages
      };
    } catch (error) {
      console.error('Error getting session analytics:', error);
      throw error;
    }
  }

  // Get real-time interaction counts
  async getRealTimeStats(storeId, timeWindow = 300000) { // 5 minutes default
    try {
      const startTime = new Date(Date.now() - timeWindow);
      
      const stats = await HeatmapInteraction.findAll({
        where: {
          store_id: storeId,
          timestamp_utc: {
            [HeatmapInteraction.sequelize.Op.gte]: startTime
          }
        },
        attributes: [
          'interaction_type',
          [HeatmapInteraction.sequelize.fn('COUNT', '*'), 'count'],
          [HeatmapInteraction.sequelize.fn('COUNT', HeatmapInteraction.sequelize.fn('DISTINCT', HeatmapInteraction.sequelize.col('session_id'))), 'unique_sessions']
        ],
        group: ['interaction_type'],
        raw: true
      });

      return {
        time_window: timeWindow,
        start_time: startTime,
        stats
      };
    } catch (error) {
      console.error('Error getting real-time heatmap stats:', error);
      throw error;
    }
  }

  // Clean up old data
  async cleanupOldData(retentionDays = 90) {
    try {
      const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
      
      const deletedInteractions = await HeatmapInteraction.destroy({
        where: {
          timestamp_utc: {
            [HeatmapInteraction.sequelize.Op.lt]: cutoffDate
          }
        }
      });

      const deletedSessions = await HeatmapSession.destroy({
        where: {
          session_start: {
            [HeatmapSession.sequelize.Op.lt]: cutoffDate
          }
        }
      });

      console.log(`Cleaned up ${deletedInteractions} interactions and ${deletedSessions} sessions older than ${retentionDays} days`);
      
      return {
        deletedInteractions,
        deletedSessions,
        cutoffDate
      };
    } catch (error) {
      console.error('Error cleaning up old heatmap data:', error);
      throw error;
    }
  }
}

module.exports = new HeatmapTrackingService();