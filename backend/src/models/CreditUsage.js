/**
 * CreditUsage Model
 * Uses masterDbClient (Supabase) for database operations
 */

const { masterDbClient } = require('../database/masterConnection');
const { v4: uuidv4 } = require('uuid');

const CreditUsage = {
  tableName: 'credit_usage',

  /**
   * Create a new credit usage record
   */
  async create(data) {
    const record = {
      id: data.id || uuidv4(),
      user_id: data.user_id,
      store_id: data.store_id,
      credits_used: data.credits_used,
      usage_type: data.usage_type,
      reference_id: data.reference_id || null,
      reference_type: data.reference_type || null,
      description: data.description || null,
      metadata: data.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: result, error } = await masterDbClient
      .from(this.tableName)
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('Error creating credit usage:', error);
      throw new Error(`Failed to create credit usage: ${error.message}`);
    }

    return result;
  },

  /**
   * Record Akeneo schedule usage
   */
  async recordAkeneoScheduleUsage(userId, storeId, scheduleId, creditsUsed = 0.1, metadata = {}) {
    return await this.create({
      user_id: userId,
      store_id: storeId,
      credits_used: creditsUsed,
      usage_type: 'akeneo_schedule',
      reference_id: scheduleId,
      reference_type: 'akeneo_schedule',
      description: `Akeneo scheduled import execution (${creditsUsed} credits)`,
      metadata: {
        schedule_id: scheduleId,
        execution_time: new Date().toISOString(),
        ...metadata
      }
    });
  },

  /**
   * Record Akeneo manual usage
   */
  async recordAkeneoManualUsage(userId, storeId, importType, creditsUsed = 0.1, metadata = {}) {
    return await this.create({
      user_id: userId,
      store_id: storeId,
      credits_used: creditsUsed,
      usage_type: 'akeneo_manual',
      reference_type: 'manual_import',
      description: `Manual Akeneo ${importType} import (${creditsUsed} credits)`,
      metadata: {
        import_type: importType,
        execution_time: new Date().toISOString(),
        ...metadata
      }
    });
  },

  /**
   * Get usage history
   */
  async getUsageHistory(userId, storeId = null, limit = 100, usageType = null) {
    let query = masterDbClient
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    if (usageType) {
      query = query.eq('usage_type', usageType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting usage history:', error);
      throw new Error(`Failed to get usage history: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Get usage stats
   */
  async getUsageStats(userId, storeId, startDate = null, endDate = null) {
    let query = masterDbClient
      .from(this.tableName)
      .select('usage_type, credits_used')
      .eq('user_id', userId)
      .eq('store_id', storeId);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting usage stats:', error);
      return {};
    }

    // Aggregate stats by usage_type in JavaScript
    const stats = {};
    (data || []).forEach(record => {
      const type = record.usage_type;
      if (!stats[type]) {
        stats[type] = {
          usage_count: 0,
          total_credits_used: 0,
          credits_list: []
        };
      }
      stats[type].usage_count += 1;
      stats[type].total_credits_used += parseFloat(record.credits_used || 0);
      stats[type].credits_list.push(parseFloat(record.credits_used || 0));
    });

    // Calculate averages
    Object.keys(stats).forEach(type => {
      const s = stats[type];
      s.avg_credits_per_usage = s.usage_count > 0
        ? s.total_credits_used / s.usage_count
        : 0;
      delete s.credits_list;
    });

    return stats;
  }
};

module.exports = CreditUsage;
