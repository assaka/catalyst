/**
 * Pricing Rule Model
 * Handles database operations for pricing rules
 */

class PricingRuleModel {
  constructor(knex) {
    this.knex = knex;
    this.tableName = 'plugin_custom_pricing_rules';
    this.discountTable = 'plugin_custom_pricing_discounts';
  }

  // Find all active rules for a store
  async findActiveRules(storeId, type = null) {
    try {
      let query = this.knex(this.tableName)
        .where('enabled', true);
      
      if (storeId) {
        query = query.where('store_id', storeId);
      }
      
      if (type) {
        query = query.where('type', type);
      }
      
      const rules = await query
        .orderBy('priority', 'asc')
        .select('*');
      
      // Load associated discounts
      for (const rule of rules) {
        rule.discounts = await this.knex(this.discountTable)
          .where('rule_id', rule.id)
          .select('*');
      }
      
      return rules;
    } catch (error) {
      console.error('Error finding pricing rules:', error);
      return [];
    }
  }

  // Find rule by ID with discounts
  async findById(id) {
    try {
      const rule = await this.knex(this.tableName)
        .where('id', id)
        .first();
      
      if (rule) {
        rule.discounts = await this.knex(this.discountTable)
          .where('rule_id', rule.id)
          .select('*');
      }
      
      return rule;
    } catch (error) {
      console.error('Error finding pricing rule by ID:', error);
      return null;
    }
  }

  // Create new pricing rule with discounts
  async create(ruleData) {
    const trx = await this.knex.transaction();
    
    try {
      const [ruleId] = await trx(this.tableName)
        .insert({
          name: ruleData.name,
          type: ruleData.type,
          enabled: ruleData.enabled !== false,
          priority: ruleData.priority || 10,
          conditions: JSON.stringify(ruleData.conditions || {}),
          actions: JSON.stringify(ruleData.actions || {}),
          store_id: ruleData.store_id
        });
      
      // Create associated discounts
      if (ruleData.discounts && ruleData.discounts.length > 0) {
        const discounts = ruleData.discounts.map(discount => ({
          rule_id: ruleId,
          discount_type: discount.discount_type,
          discount_value: discount.discount_value,
          minimum_amount: discount.minimum_amount,
          minimum_quantity: discount.minimum_quantity,
          applies_to: discount.applies_to || 'item',
          conditions: JSON.stringify(discount.conditions || {}),
          stackable: discount.stackable !== false
        }));
        
        await trx(this.discountTable).insert(discounts);
      }
      
      await trx.commit();
      
      return this.findById(ruleId);
    } catch (error) {
      await trx.rollback();
      console.error('Error creating pricing rule:', error);
      throw error;
    }
  }

  // Update pricing rule
  async update(id, ruleData) {
    const trx = await this.knex.transaction();
    
    try {
      await trx(this.tableName)
        .where('id', id)
        .update({
          name: ruleData.name,
          type: ruleData.type,
          enabled: ruleData.enabled,
          priority: ruleData.priority,
          conditions: JSON.stringify(ruleData.conditions || {}),
          actions: JSON.stringify(ruleData.actions || {}),
          updated_at: new Date()
        });
      
      // Update discounts
      if (ruleData.discounts) {
        // Delete existing discounts
        await trx(this.discountTable).where('rule_id', id).del();
        
        // Insert new discounts
        if (ruleData.discounts.length > 0) {
          const discounts = ruleData.discounts.map(discount => ({
            rule_id: id,
            discount_type: discount.discount_type,
            discount_value: discount.discount_value,
            minimum_amount: discount.minimum_amount,
            minimum_quantity: discount.minimum_quantity,
            applies_to: discount.applies_to || 'item',
            conditions: JSON.stringify(discount.conditions || {}),
            stackable: discount.stackable !== false
          }));
          
          await trx(this.discountTable).insert(discounts);
        }
      }
      
      await trx.commit();
      
      return this.findById(id);
    } catch (error) {
      await trx.rollback();
      console.error('Error updating pricing rule:', error);
      throw error;
    }
  }

  // Delete pricing rule
  async delete(id) {
    try {
      const result = await this.knex(this.tableName)
        .where('id', id)
        .del();
      
      return result > 0;
    } catch (error) {
      console.error('Error deleting pricing rule:', error);
      return false;
    }
  }

  // Get rules by type
  async findByType(type, storeId = null) {
    try {
      let query = this.knex(this.tableName)
        .where('type', type)
        .where('enabled', true);
      
      if (storeId) {
        query = query.where('store_id', storeId);
      }
      
      return await query.orderBy('priority', 'asc');
    } catch (error) {
      console.error('Error finding rules by type:', error);
      return [];
    }
  }

  // Log pricing event
  async logEvent(eventData) {
    try {
      await this.knex('plugin_custom_pricing_logs').insert({
        rule_id: eventData.rule_id,
        event_type: eventData.event_type,
        original_price: eventData.original_price,
        final_price: eventData.final_price,
        discount_amount: eventData.discount_amount || 0,
        customer_id: eventData.customer_id,
        product_id: eventData.product_id,
        context: JSON.stringify(eventData.context || {})
      });
    } catch (error) {
      console.error('Error logging pricing event:', error);
    }
  }

  // Get analytics data
  async getAnalytics(storeId, dateRange = null) {
    try {
      let query = this.knex('plugin_custom_pricing_logs as logs')
        .leftJoin(`${this.tableName} as rules`, 'logs.rule_id', 'rules.id')
        .select(
          'rules.name as rule_name',
          'rules.type as rule_type',
          this.knex.raw('COUNT(*) as usage_count'),
          this.knex.raw('SUM(logs.discount_amount) as total_discount'),
          this.knex.raw('AVG(logs.discount_amount) as avg_discount')
        )
        .where('rules.store_id', storeId)
        .groupBy('rules.id', 'rules.name', 'rules.type');
      
      if (dateRange) {
        query = query.whereBetween('logs.created_at', [dateRange.start, dateRange.end]);
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting pricing analytics:', error);
      return [];
    }
  }
}

module.exports = PricingRuleModel;