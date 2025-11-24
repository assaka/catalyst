/**
 * ServiceCreditCost Model
 * Uses masterDbClient (Supabase) for database operations
 */

const { masterDbClient } = require('../database/masterConnection');
const { v4: uuidv4 } = require('uuid');

const ServiceCreditCost = {
  tableName: 'service_credit_costs',

  /**
   * Get cost for a specific service by key
   */
  async getCostByKey(serviceKey) {
    const { data: service, error } = await masterDbClient
      .from(this.tableName)
      .select('*')
      .eq('service_key', serviceKey)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error getting service cost:', error);
      throw new Error(`Service cost not found for key: ${serviceKey}`);
    }

    if (!service) {
      throw new Error(`Service cost not found for key: ${serviceKey}`);
    }

    return parseFloat(service.cost_per_unit);
  },

  /**
   * Get all active services grouped by category
   */
  async getActiveServicesByCategory() {
    const { data: services, error } = await masterDbClient
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('service_category', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error getting services by category:', error);
      return {};
    }

    // Group by category
    const grouped = {};
    (services || []).forEach(service => {
      const category = service.service_category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(service);
    });

    return grouped;
  },

  /**
   * Get all visible services for pricing page
   */
  async getVisibleServices() {
    const { data, error } = await masterDbClient
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .eq('is_visible', true)
      .order('service_category', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error getting visible services:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Find one service by criteria
   */
  async findOne(options) {
    const { where } = options;

    let query = masterDbClient.from(this.tableName).select('*');

    Object.keys(where).forEach(key => {
      query = query.eq(key, where[key]);
    });

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error finding service:', error);
      return null;
    }

    return data;
  },

  /**
   * Calculate cost for a specific service usage
   */
  async calculateCost(serviceKey, units = 1) {
    const service = await this.findOne({
      where: {
        service_key: serviceKey,
        is_active: true
      }
    });

    if (!service) {
      throw new Error(`Service cost not found for key: ${serviceKey}`);
    }

    const cost = parseFloat(service.cost_per_unit) * units;

    return {
      cost: parseFloat(cost.toFixed(4)),
      service: service
    };
  },

  /**
   * Get services by category
   */
  async getByCategory(category, activeOnly = true) {
    let query = masterDbClient
      .from(this.tableName)
      .select('*')
      .eq('service_category', category)
      .order('display_order', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting services by category:', error);
      return [];
    }

    return data || [];
  }
};

module.exports = ServiceCreditCost;
