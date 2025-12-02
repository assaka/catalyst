/**
 * AkeneoSchedule Model
 * Uses masterDbClient (Supabase) for database operations
 */

const { masterDbClient } = require('../database/masterConnection');
const { v4: uuidv4 } = require('uuid');

const AkeneoSchedule = {
  tableName: 'akeneo_schedules',

  /**
   * Create a new schedule
   */
  async create(scheduleData) {
    const { data, error } = await masterDbClient
      .from(this.tableName)
      .insert({
        id: uuidv4(),
        ...scheduleData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating schedule:', error);
      throw new Error(`Failed to create schedule: ${error.message}`);
    }

    return data;
  },

  /**
   * Delete a schedule by id
   */
  async destroy(id) {
    const { error } = await masterDbClient
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting schedule:', error);
      throw new Error(`Failed to delete schedule: ${error.message}`);
    }

    return true;
  },

  /**
   * Find schedule by primary key
   */
  async findByPk(id) {
    const { data, error } = await masterDbClient
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error finding schedule:', error);
      return null;
    }

    return data;
  },

  /**
   * Find one schedule by criteria
   */
  async findOne(options) {
    const { where } = options;

    let query = masterDbClient.from(this.tableName).select('*');

    Object.keys(where).forEach(key => {
      query = query.eq(key, where[key]);
    });

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error finding schedule:', error);
      return null;
    }

    return data;
  },

  /**
   * Find all schedules by criteria
   */
  async findAll(options = {}) {
    const { where = {} } = options;

    let query = masterDbClient.from(this.tableName).select('*');

    Object.keys(where).forEach(key => {
      query = query.eq(key, where[key]);
    });

    const { data, error } = await query;

    if (error) {
      console.error('Error finding schedules:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Update a schedule
   */
  async update(id, updateData) {
    const { data, error } = await masterDbClient
      .from(this.tableName)
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating schedule:', error);
      throw new Error(`Failed to update schedule: ${error.message}`);
    }

    return data;
  },

  /**
   * Check if user has enough credits to run schedule
   */
  async checkCreditsBeforeExecution(schedule, userId) {
    const CreditService = require('../services/credit-service');
    const requiredCredits = parseFloat(schedule.credit_cost) || 0.1;

    return await CreditService.hasEnoughCredits(userId, schedule.store_id, requiredCredits);
  },

  /**
   * Deduct credits for schedule execution
   */
  async deductCreditsForExecution(schedule, userId) {
    const CreditService = require('../services/credit-service');
    const requiredCredits = parseFloat(schedule.credit_cost) || 0.1;

    try {
      const result = await CreditService.deduct(
        userId,
        schedule.store_id,
        requiredCredits,
        `Akeneo scheduled ${schedule.import_type} import`,
        {
          import_type: schedule.import_type,
          schedule_type: schedule.schedule_type,
          filters: schedule.filters,
          options: schedule.options
        },
        schedule.id,
        'akeneo_schedule'
      );

      // Update the schedule with the credit usage reference
      await this.update(schedule.id, {
        last_credit_usage: result.usage_id
      });

      return {
        success: true,
        usage_id: result.usage_id,
        credits_deducted: requiredCredits
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get schedules that need credits
   */
  async getSchedulesNeedingCredits(userId, storeId) {
    const CreditService = require('../services/credit-service');
    const currentBalance = await CreditService.getBalance(userId, storeId);

    // Get active schedules for the store
    const activeSchedules = await this.findAll({
      where: {
        store_id: storeId,
        is_active: true
      }
    });

    // Filter schedules that can't run due to insufficient credits
    const schedulesNeedingCredits = activeSchedules.filter(schedule => {
      const requiredCredits = parseFloat(schedule.credit_cost) || 0.1;
      return currentBalance < requiredCredits;
    });

    return {
      current_balance: currentBalance,
      active_schedules: activeSchedules.length,
      schedules_needing_credits: schedulesNeedingCredits.length,
      schedules: schedulesNeedingCredits
    };
  }
};

module.exports = AkeneoSchedule;
