const BaseJobHandler = require('./BaseJobHandler');
const { Order, OrderItem, Store, Product, Customer } = require('../../models');
const { Op } = require('sequelize');
const emailService = require('../../services/email-service');

/**
 * Finalize Pending Orders Job
 *
 * Checks for orders that are "pending" and verifies payment status with Stripe.
 * This handles edge cases where user paid but never reached the success page
 * (browser crash, connection lost, etc.)
 *
 * Runs every 5-15 minutes
 */
class FinalizePendingOrdersJob extends BaseJobHandler {
  async execute() {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    console.log('🔍 FinalizePendingOrdersJob: Starting...');

    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      console.warn('⚠️ Stripe not configured, skipping pending orders job');
      return { success: false, message: 'Stripe not configured' };
    }

    // Find orders that are pending for more than 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const pendingOrders = await Order.findAll({
      where: {
        status: 'pending',
        payment_status: 'pending',
        createdAt: {
          [Op.lt]: twoMinutesAgo // Only check orders older than 2 minutes
        },
        payment_reference: {
          [Op.ne]: null // Must have a Stripe session ID
        }
      },
      include: [{
        model: Store,
        as: 'Store',
        required: true
      }],
      limit: 100 // Process max 100 orders per run
    });

    console.log(`🔍 Found ${pendingOrders.length} pending orders to check`);

    let processedCount = 0;
    let finalizedCount = 0;
    let failedCount = 0;

    for (const order of pendingOrders) {
      try {
        console.log(`🔍 Checking order ${order.order_number} (${order.id})`);

        const store = order.Store;
        if (!store) {
          console.warn(`⚠️ No store found for order ${order.id}`);
          continue;
        }

        // Build Stripe options for connected account
        const stripeOptions = {};
        if (store.stripe_account_id) {
          stripeOptions.stripeAccount = store.stripe_account_id;
        }

        // Verify payment status with Stripe
        let session;
        try {
          session = await stripe.checkout.sessions.retrieve(
            order.payment_reference,
            stripeOptions
          );
        } catch (stripeError) {
          // Session might not exist or be on different account
          console.warn(`⚠️ Could not retrieve Stripe session for order ${order.order_number}:`, stripeError.message);
          failedCount++;
          continue;
        }

        console.log(`✅ Retrieved session ${session.id} - Payment status: ${session.payment_status}`);

        // Check if payment was completed
        if (session.payment_status === 'paid') {
          console.log(`🔄 Payment confirmed for order ${order.order_number} - finalizing...`);

          // Update order status
          await order.update({
            status: 'processing',
            payment_status: 'paid',
            updatedAt: new Date()
          });

          finalizedCount++;
          console.log(`✅ Order ${order.order_number} finalized successfully`);

          // Send confirmation email
          try {
            const orderWithDetails = await Order.findByPk(order.id, {
              include: [{
                model: OrderItem,
                as: 'OrderItems',
                include: [{
                  model: Product,
                  attributes: ['id', 'sku']
                }]
              }, {
                model: Store,
                as: 'Store'
              }]
            });

            // Try to get customer details
            let customer = null;
            if (order.customer_id) {
              customer = await Customer.findByPk(order.customer_id);
            }

            // Extract customer name from shipping/billing address if customer not found
            const customerName = customer
              ? `${customer.first_name} ${customer.last_name}`
              : (order.shipping_address?.full_name || order.shipping_address?.name || order.billing_address?.full_name || order.billing_address?.name || 'Customer');

            const [firstName, ...lastNameParts] = customerName.split(' ');
            const lastName = lastNameParts.join(' ') || '';

            // Send order success email
            await emailService.sendTransactionalEmail(order.store_id, 'order_success_email', {
              recipientEmail: order.customer_email,
              customer: customer || {
                first_name: firstName,
                last_name: lastName,
                email: order.customer_email
              },
              order: orderWithDetails.toJSON(),
              store: orderWithDetails.Store
            });

            console.log(`📧 Sent confirmation email to ${order.customer_email}`);
          } catch (emailError) {
            console.error(`❌ Failed to send email for order ${order.order_number}:`, emailError.message);
            // Don't fail the job if email fails
          }

        } else if (session.payment_status === 'unpaid') {
          console.log(`⏳ Order ${order.order_number} still unpaid - keeping as pending`);
        } else {
          console.log(`⚠️ Order ${order.order_number} has unexpected payment status: ${session.payment_status}`);
        }

        processedCount++;

      } catch (error) {
        console.error(`❌ Error processing order ${order.id}:`, error.message);
        failedCount++;
      }
    }

    const result = {
      success: true,
      checked: pendingOrders.length,
      processed: processedCount,
      finalized: finalizedCount,
      failed: failedCount,
      message: `Checked ${pendingOrders.length} pending orders, finalized ${finalizedCount}`
    };

    console.log(`✅ FinalizePendingOrdersJob completed:`, result);
    return result;
  }
}

module.exports = FinalizePendingOrdersJob;
