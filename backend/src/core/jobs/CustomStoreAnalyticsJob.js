const BaseJobHandler = require('./BaseJobHandler');
const { sequelize } = require('../../database/connection');

/**
 * Custom Store Analytics Job Handler
 * Example of how to create a custom job type
 */
class CustomStoreAnalyticsJob extends BaseJobHandler {
  constructor(job) {
    super(job);
  }

  async execute() {
    console.log('🔄 Running custom store analytics job...');

    try {
      // Example: Calculate daily sales metrics for all stores
      const [results] = await sequelize.query(`
        SELECT 
          s.id as store_id,
          s.name as store_name,
          COUNT(o.id) as daily_orders,
          COALESCE(SUM(o.total), 0) as daily_revenue,
          AVG(o.total) as average_order_value
        FROM stores s
        LEFT JOIN orders o ON s.id = o.store_id 
          AND DATE(o.created_at) = CURRENT_DATE
        WHERE s.is_active = true
        GROUP BY s.id, s.name
      `);

      // Store the analytics results
      for (const store of results) {
        await sequelize.query(`
          INSERT INTO daily_analytics (
            store_id, date, orders_count, revenue, avg_order_value, created_at
          ) VALUES (
            :store_id, CURRENT_DATE, :orders, :revenue, :avg_order, NOW()
          ) ON CONFLICT (store_id, date) DO UPDATE SET
            orders_count = :orders,
            revenue = :revenue,
            avg_order_value = :avg_order,
            updated_at = NOW()
        `, {
          replacements: {
            store_id: store.store_id,
            orders: store.daily_orders,
            revenue: store.daily_revenue,
            avg_order: store.average_order_value
          }
        });
      }

      console.log(`✅ Processed analytics for ${results.length} stores`);

      return {
        success: true,
        storesProcessed: results.length,
        totalOrders: results.reduce((sum, s) => sum + parseInt(s.daily_orders), 0),
        totalRevenue: results.reduce((sum, s) => sum + parseFloat(s.daily_revenue), 0),
        results: results
      };

    } catch (error) {
      console.error('❌ Custom analytics job failed:', error);
      throw error;
    }
  }

  /**
   * Get job type identifier
   */
  static getJobType() {
    return 'custom:store_analytics';
  }

  /**
   * Get job description for logging
   */
  getDescription() {
    return 'Custom store analytics calculation and storage';
  }
}

module.exports = CustomStoreAnalyticsJob;