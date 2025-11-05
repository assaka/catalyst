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

    // Find orders that are pending for more than 3 minutes AND email not sent
    // This means instant finalization didn't work, so job needs to handle it
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

    const pendingOrders = await Order.findAll({
      where: {
        status: 'pending',
        payment_status: 'pending',
        createdAt: {
          [Op.lt]: threeMinutesAgo // Only check orders older than 3 minutes
        },
        payment_reference: {
          [Op.ne]: null // Must have a payment session ID
        },
        confirmation_email_sent_at: null // Only if email NOT already sent
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

        // Determine payment provider
        const paymentProvider = order.payment_method || 'stripe';
        console.log(`💳 Payment provider for order ${order.order_number}:`, paymentProvider);

        // Verify payment based on provider
        let paymentVerified = false;

        if (paymentProvider === 'stripe' || paymentProvider.includes('card') || paymentProvider.includes('credit')) {
          // Stripe verification
          const stripeOptions = {};
          if (store.stripe_account_id) {
            stripeOptions.stripeAccount = store.stripe_account_id;
          }

          try {
            const session = await stripe.checkout.sessions.retrieve(
              order.payment_reference,
              stripeOptions
            );
            console.log(`✅ Retrieved Stripe session ${session.id} - Payment status: ${session.payment_status}`);

            if (session.payment_status === 'paid') {
              paymentVerified = true;
            } else {
              console.log(`⏳ Order ${order.order_number} - Stripe payment status: ${session.payment_status}`);
            }
          } catch (stripeError) {
            console.warn(`⚠️ Could not retrieve Stripe session for order ${order.order_number}:`, stripeError.message);
            failedCount++;
            continue;
          }
        } else if (paymentProvider === 'adyen') {
          // TODO: Implement Adyen verification
          console.log(`⚠️ Adyen verification not yet implemented for order ${order.order_number}`);
          continue;
        } else if (paymentProvider === 'mollie') {
          // TODO: Implement Mollie verification
          console.log(`⚠️ Mollie verification not yet implemented for order ${order.order_number}`);
          continue;
        } else {
          // Unknown provider - skip verification (might be offline payment)
          console.log(`⚠️ Unknown provider "${paymentProvider}" for order ${order.order_number}, skipping`);
          continue;
        }

        // Check if payment was verified
        if (paymentVerified) {
          console.log(`🔄 Payment confirmed for order ${order.order_number} - finalizing...`);

          // Update order status
          await order.update({
            status: 'processing',
            payment_status: 'paid',
            updatedAt: new Date()
          });

          finalizedCount++;
          console.log(`✅ Order ${order.order_number} finalized successfully`);

          // Send confirmation email (atomic check-and-set to prevent race condition)
          const [emailAffectedRows] = await Order.update(
            { confirmation_email_sent_at: new Date() },
            {
              where: {
                id: order.id,
                confirmation_email_sent_at: null
              }
            }
          );

          if (emailAffectedRows > 0) {
            // We successfully claimed email sending
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
              // Rollback flag if email failed
              await order.update({ confirmation_email_sent_at: null });
            }
          } else {
            console.log(`✅ Confirmation email already sent by another process for order ${order.order_number}`);
          }
        } else {
          // Payment not verified - already logged in provider-specific blocks above
          console.log(`⏳ Order ${order.order_number} payment not yet verified - keeping as pending`);
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
