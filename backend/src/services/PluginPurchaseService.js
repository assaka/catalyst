// backend/src/services/PluginPurchaseService.js
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');
// const stripeService = require('./StripeService'); // TODO: Implement Stripe service
// const pluginManager = require('../core/PluginManager'); // Will be created next

class PluginPurchaseService {

  /**
   * Purchase a plugin from marketplace
   */
  async purchasePlugin(marketplacePluginId, tenantId, selectedPlan, userId) {
    try {
      // 1. Get plugin details
      const plugin = await this.getMarketplacePlugin(marketplacePluginId);

      // 2. Check if already purchased
      const existingLicense = await this.checkExistingLicense(marketplacePluginId, tenantId);
      if (existingLicense) {
        throw new Error('Plugin already purchased');
      }

      // 3. Calculate pricing
      const pricingDetails = this.calculatePricing(plugin, selectedPlan);

      // 4. Process payment
      let paymentResult;
      if (pricingDetails.amount > 0) {
        if (plugin.pricing_model === 'subscription') {
          paymentResult = await this.createSubscription(plugin, tenantId, pricingDetails, userId);
        } else {
          paymentResult = await this.processOneTimePayment(plugin, tenantId, pricingDetails, userId);
        }
      }

      // 5. Create license
      const license = await this.createLicense(
        marketplacePluginId,
        tenantId,
        plugin,
        pricingDetails,
        paymentResult,
        userId
      );

      // 6. Install plugin to tenant
      // await pluginManager.installFromMarketplace(marketplacePluginId, tenantId, userId);

      // 7. Update marketplace metrics
      await this.updateMarketplaceMetrics(marketplacePluginId, pricingDetails.amount);

      // 8. Distribute revenue
      await this.recordRevenue(plugin.author_id, pricingDetails.amount, plugin.revenue_share_percentage);

      return {
        success: true,
        license,
        paymentResult
      };

    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  /**
   * Calculate pricing based on selected plan
   */
  calculatePricing(plugin, selectedPlan) {
    let amount = 0;
    let billingInterval = null;

    if (plugin.pricing_model === 'free') {
      return { amount: 0, billingInterval: null, currency: 'USD' };
    }

    if (plugin.pricing_model === 'one_time') {
      amount = plugin.base_price;
    } else if (plugin.pricing_model === 'subscription') {
      if (selectedPlan === 'monthly') {
        amount = plugin.monthly_price;
        billingInterval = 'month';
      } else if (selectedPlan === 'yearly') {
        amount = plugin.yearly_price;
        billingInterval = 'year';
      }
    } else if (plugin.pricing_model === 'custom') {
      const tier = plugin.pricing_tiers.find(t => t.id === selectedPlan);
      if (!tier) throw new Error('Invalid pricing tier');
      amount = tier.price;
      billingInterval = tier.billingInterval === 'one_time' ? null : tier.billingInterval;
    }

    return {
      amount,
      billingInterval,
      currency: plugin.currency || 'USD'
    };
  }

  /**
   * Process one-time payment via Stripe
   */
  async processOneTimePayment(plugin, tenantId, pricingDetails, userId) {
    // TODO: Implement Stripe payment
    console.log('Processing one-time payment:', pricingDetails.amount);

    return {
      paymentIntentId: `pi_${Date.now()}`,
      type: 'one_time'
    };
  }

  /**
   * Create subscription via Stripe
   */
  async createSubscription(plugin, tenantId, pricingDetails, userId) {
    // TODO: Implement Stripe subscription
    console.log('Creating subscription:', pricingDetails);

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + (pricingDetails.billingInterval === 'year' ? 12 : 1));

    return {
      subscriptionId: `sub_${Date.now()}`,
      customerId: `cus_${Date.now()}`,
      type: 'subscription',
      nextBillingDate
    };
  }

  /**
   * Create license record
   */
  async createLicense(marketplacePluginId, tenantId, plugin, pricingDetails, paymentResult, userId) {
    const licenseKey = this.generateLicenseKey();

    const license = await db.query(`
      INSERT INTO plugin_licenses (
        id,
        plugin_id,
        tenant_id,
        license_key,
        license_type,
        pricing_model,
        amount_paid,
        currency,
        billing_interval,
        subscription_status,
        subscription_id,
        stripe_customer_id,
        stripe_payment_intent_id,
        next_billing_date,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
      RETURNING *
    `, [
      uuidv4(),
      marketplacePluginId,
      tenantId,
      licenseKey,
      plugin.license_type,
      plugin.pricing_model,
      pricingDetails.amount,
      pricingDetails.currency,
      pricingDetails.billingInterval,
      paymentResult?.type === 'subscription' ? 'active' : null,
      paymentResult?.subscriptionId || null,
      paymentResult?.customerId || null,
      paymentResult?.paymentIntentId || null,
      paymentResult?.nextBillingDate || null
    ]);

    return license.rows[0];
  }

  /**
   * Record revenue distribution
   */
  async recordRevenue(creatorId, amount, revenueSharePercentage) {
    const creatorAmount = (amount * revenueSharePercentage / 100).toFixed(2);
    const platformAmount = (amount * (100 - revenueSharePercentage) / 100).toFixed(2);

    // TODO: Record in revenue tracking table
    // This would integrate with accounting/payout systems

    console.log(`💰 Revenue: Creator ${creatorId} gets $${creatorAmount}, Platform gets $${platformAmount}`);
  }

  /**
   * Update marketplace metrics
   */
  async updateMarketplaceMetrics(pluginId, revenue) {
    await db.query(`
      UPDATE plugin_marketplace
      SET
        active_installations = active_installations + 1,
        total_revenue = total_revenue + $1,
        updated_at = NOW()
      WHERE id = $2
    `, [revenue, pluginId]);
  }

  /**
   * Generate unique license key
   */
  generateLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 4;
    const segmentLength = 4;

    let key = '';
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segmentLength; j++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < segments - 1) key += '-';
    }

    return key; // Format: XXXX-XXXX-XXXX-XXXX
  }

  /**
   * Get marketplace plugin
   */
  async getMarketplacePlugin(pluginId) {
    const result = await db.query(`
      SELECT * FROM plugin_marketplace WHERE id = $1 AND status = 'approved'
    `, [pluginId]);

    if (!result.rows[0]) {
      throw new Error('Plugin not found in marketplace');
    }

    return result.rows[0];
  }

  /**
   * Check existing license
   */
  async checkExistingLicense(pluginId, tenantId) {
    const result = await db.query(`
      SELECT * FROM plugin_licenses
      WHERE plugin_id = $1 AND tenant_id = $2 AND is_active = true
    `, [pluginId, tenantId]);

    return result.rows[0] || null;
  }
}

module.exports = new PluginPurchaseService();
