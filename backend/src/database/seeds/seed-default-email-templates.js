const { sequelize } = require('../connection');
const { EmailTemplate, Store } = require('../../models');
const { getVariablesForTemplate } = require('../../services/email-template-variables');

/**
 * Seed default email templates for all stores
 * Creates signup, credit purchase, and order success templates
 */
async function seedDefaultEmailTemplates() {
  try {
    console.log('📧 Starting email template seeding...');

    // Get all stores
    const stores = await Store.findAll();

    if (stores.length === 0) {
      console.log('⚠️ No stores found. Please create a store first.');
      return;
    }

    console.log(`📧 Found ${stores.length} store(s). Creating default email templates...`);

    for (const store of stores) {
      console.log(`\n📧 Processing store: ${store.name} (${store.id})`);

      // 1. Signup/Welcome Email Template
      const signupExists = await EmailTemplate.findOne({
        where: { store_id: store.id, identifier: 'signup_email' }
      });

      if (!signupExists) {
        await EmailTemplate.create({
          store_id: store.id,
          identifier: 'signup_email',
          subject: 'Welcome to {{store_name}}!',
          content_type: 'both',
          template_content: `
Hi {{customer_first_name}},

Welcome to {{store_name}}! We're thrilled to have you with us.

Your account has been successfully created. You can now:
- Browse our products at {{store_url}}
- Track your orders
- Manage your preferences
- Enjoy exclusive member benefits

Login to your account: {{login_url}}

If you have any questions, feel free to reach out to our support team.

Best regards,
The {{store_name}} Team

---
Account created on: {{signup_date}}
          `.trim(),
          html_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Welcome to {{store_name}}!</h1>
  </div>

  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hi <strong>{{customer_first_name}}</strong>,</p>

    <p>We're thrilled to have you with us! Your account has been successfully created.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #667eea;">What's Next?</h3>
      <ul style="padding-left: 20px;">
        <li>Browse our products</li>
        <li>Track your orders</li>
        <li>Manage your preferences</li>
        <li>Enjoy exclusive member benefits</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{login_url}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Login to Your Account
      </a>
    </div>

    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      If you have any questions, feel free to reach out to our support team.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; text-align: center;">
      Account created on {{signup_date}}<br>
      © {{current_year}} {{store_name}}. All rights reserved.
    </p>
  </div>
</body>
</html>
          `.trim(),
          variables: getVariablesForTemplate('signup_email'),
          is_active: true,
          sort_order: 1,
          attachment_enabled: false
        });
        console.log('  ✅ Created signup_email template');
      } else {
        console.log('  ⏭️ Signup email template already exists');
      }

      // 2. Credit Purchase Confirmation Email Template
      const creditExists = await EmailTemplate.findOne({
        where: { store_id: store.id, identifier: 'credit_purchase_email' }
      });

      if (!creditExists) {
        await EmailTemplate.create({
          store_id: store.id,
          identifier: 'credit_purchase_email',
          subject: 'Credit Purchase Confirmation - {{credits_purchased}} Credits',
          content_type: 'both',
          template_content: `
Hi {{customer_first_name}},

Thank you for your credit purchase!

Purchase Details:
- Credits Purchased: {{credits_purchased}}
- Amount Paid: {{amount_usd}}
- Transaction ID: {{transaction_id}}
- Current Balance: {{balance}} credits
- Purchase Date: {{purchase_date}}

Your credits have been added to your account and are ready to use.

Visit your dashboard: {{store_url}}/admin

Thank you for your business!

Best regards,
The {{store_name}} Team

---
Transaction ID: {{transaction_id}}
          `.trim(),
          html_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Purchase Confirmed!</h1>
    <p style="color: white; font-size: 18px; margin: 10px 0 0 0;">+{{credits_purchased}} Credits</p>
  </div>

  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hi <strong>{{customer_first_name}}</strong>,</p>

    <p>Thank you for your credit purchase! Your payment has been processed successfully.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #10b981;">Purchase Summary</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Credits Purchased:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #10b981; font-size: 18px; font-weight: bold;">{{credits_purchased}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Amount Paid:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{amount_usd}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Current Balance:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">{{balance}} credits</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Purchase Date:</strong></td>
          <td style="padding: 8px 0; text-align: right;">{{purchase_date}}</td>
        </tr>
      </table>
    </div>

    <p style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px;">
      💡 Your credits are now available and ready to use in your account!
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{store_url}}/admin" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        View Dashboard
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; text-align: center;">
      Transaction ID: {{transaction_id}}<br>
      © {{current_year}} {{store_name}}. All rights reserved.
    </p>
  </div>
</body>
</html>
          `.trim(),
          variables: getVariablesForTemplate('credit_purchase_email'),
          is_active: true,
          sort_order: 2,
          attachment_enabled: false
        });
        console.log('  ✅ Created credit_purchase_email template');
      } else {
        console.log('  ⏭️ Credit purchase email template already exists');
      }

      // 3. Invoice Email Template
      const invoiceExists = await EmailTemplate.findOne({
        where: { store_id: store.id, identifier: 'invoice_email' }
      });

      if (!invoiceExists) {
        await EmailTemplate.create({
          store_id: store.id,
          identifier: 'invoice_email',
          subject: 'Invoice #{{invoice_number}} from {{store_name}}',
          content_type: 'both',
          template_content: `
INVOICE #{{invoice_number}}

From: {{store_name}}
{{store_address}}
{{store_phone}} | {{store_email}}

Bill To:
{{customer_name}}
{{billing_address}}
{{customer_email}}
{{customer_phone}}

Invoice Details:
- Invoice Number: {{invoice_number}}
- Invoice Date: {{invoice_date}}
- Due Date: {{due_date}}
- Order Number: {{order_number}}
- Payment Status: {{payment_status}}

Items ({{items_count}}):
{{items_html}}

Summary:
- Subtotal: {{invoice_subtotal}}
- Shipping: {{invoice_shipping}}
- Tax: {{invoice_tax}}
- Discount: {{invoice_discount}}
- TOTAL: {{invoice_total}}

Payment Information:
- Payment Method: {{payment_method}}
- Transaction ID: {{transaction_id}}
- Payment Date: {{payment_date}}

{{notes}}

View invoice online: {{invoice_url}}

Thank you for your business!

---
{{store_name}} | {{store_url}}
Invoice #{{invoice_number}} | {{invoice_date}}
          `.trim(),
          html_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #{{invoice_number}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="border-bottom: 3px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px;">
      <table style="width: 100%;">
        <tr>
          <td style="vertical-align: top;">
            <h1 style="margin: 0; color: #2c3e50; font-size: 28px;">INVOICE</h1>
            <p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 18px;">#{{invoice_number}}</p>
          </td>
          <td style="text-align: right; vertical-align: top;">
            <h2 style="margin: 0; color: #2c3e50; font-size: 24px;">{{store_name}}</h2>
            <p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 14px; line-height: 1.5;">
              {{store_address}}<br>
              {{store_phone}}<br>
              {{store_email}}
            </p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Invoice Info -->
    <div style="margin-bottom: 30px;">
      <table style="width: 100%;">
        <tr>
          <td style="vertical-align: top; width: 50%;">
            <div style="background: #ecf0f1; padding: 20px; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Bill To:</h3>
              <p style="margin: 0; line-height: 1.6;">
                <strong>{{customer_name}}</strong><br>
                {{billing_address}}<br>
                {{customer_email}}<br>
                {{customer_phone}}
              </p>
            </div>
          </td>
          <td style="vertical-align: top; width: 50%; padding-left: 20px;">
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #7f8c8d;"><strong>Invoice Date:</strong></td>
                <td style="padding: 8px 0; text-align: right;">{{invoice_date}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #7f8c8d;"><strong>Due Date:</strong></td>
                <td style="padding: 8px 0; text-align: right;">{{due_date}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #7f8c8d;"><strong>Order Number:</strong></td>
                <td style="padding: 8px 0; text-align: right;">{{order_number}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #7f8c8d;"><strong>Payment Status:</strong></td>
                <td style="padding: 8px 0; text-align: right;">
                  <span style="background: #27ae60; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">{{payment_status}}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <!-- Items Table -->
    <div style="margin-bottom: 30px;">
      <h3 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 18px;">Invoice Items ({{items_count}})</h3>
      {{items_html}}
    </div>

    <!-- Totals -->
    <div style="margin-bottom: 30px;">
      <table style="width: 100%; max-width: 400px; margin-left: auto;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #ecf0f1;"><strong>Subtotal:</strong></td>
          <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #ecf0f1;">{{invoice_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #ecf0f1;"><strong>Shipping:</strong></td>
          <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #ecf0f1;">{{invoice_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #ecf0f1;"><strong>Tax:</strong></td>
          <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #ecf0f1;">{{invoice_tax}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #ecf0f1;"><strong>Discount:</strong></td>
          <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #ecf0f1; color: #27ae60;">-{{invoice_discount}}</td>
        </tr>
        <tr style="background: #2c3e50;">
          <td style="padding: 15px 10px; color: white;"><strong style="font-size: 18px;">TOTAL:</strong></td>
          <td style="padding: 15px 10px; text-align: right; color: white; font-size: 20px; font-weight: bold;">{{invoice_total}}</td>
        </tr>
      </table>
    </div>

    <!-- Payment Information -->
    <div style="background: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <h3 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 16px;">Payment Information</h3>
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 5px 0; color: #7f8c8d; width: 40%;"><strong>Payment Method:</strong></td>
          <td style="padding: 5px 0;">{{payment_method}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #7f8c8d;"><strong>Transaction ID:</strong></td>
          <td style="padding: 5px 0;">{{transaction_id}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #7f8c8d;"><strong>Payment Date:</strong></td>
          <td style="padding: 5px 0;">{{payment_date}}</td>
        </tr>
      </table>
    </div>

    <!-- Notes -->
    <div style="background: #fff9e6; border-left: 4px solid #f39c12; padding: 15px; border-radius: 4px; margin-bottom: 30px;">
      <p style="margin: 0; color: #7f8c8d; font-size: 14px; line-height: 1.6;">
        {{notes}}
      </p>
    </div>

    <!-- View Online Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{invoice_url}}" style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
        View Invoice Online
      </a>
    </div>

    <!-- Footer -->
    <hr style="border: none; border-top: 2px solid #ecf0f1; margin: 30px 0;">
    <div style="text-align: center;">
      <p style="color: #7f8c8d; font-size: 12px; margin: 10px 0;">
        Thank you for your business!<br>
        <a href="{{store_url}}" style="color: #3498db; text-decoration: none;">{{store_name}}</a>
      </p>
      <p style="color: #bdc3c7; font-size: 11px; margin: 10px 0;">
        Invoice #{{invoice_number}} | Issued: {{invoice_date}}<br>
        © {{current_year}} {{store_name}}. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
          `.trim(),
          variables: getVariablesForTemplate('invoice_email'),
          is_active: true,
          sort_order: 4,
          attachment_enabled: true,
          attachment_config: {
            generateInvoicePdf: true,
            attachInvoiceDetails: true
          }
        });
        console.log('  ✅ Created invoice_email template');
      } else {
        console.log('  ⏭️ Invoice email template already exists');
      }

      // 4. Order Success Email Template
      const orderExists = await EmailTemplate.findOne({
        where: { store_id: store.id, identifier: 'order_success_email' }
      });

      if (!orderExists) {
        await EmailTemplate.create({
          store_id: store.id,
          identifier: 'order_success_email',
          subject: 'Order Confirmation #{{order_number}} - Thank You!',
          content_type: 'both',
          template_content: `
Hi {{customer_first_name}},

Thank you for your order! We've received your order and it's being processed.

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items Ordered ({{items_count}} items):
{{items_html}}

Shipping Address:
{{shipping_address}}

Payment Method: {{payment_method}}

You can track your order here: {{order_details_url}}

We'll send you another email when your order ships with tracking information.

Thank you for shopping with us!

Best regards,
The {{store_name}} Team

---
Order #{{order_number}} | {{order_date}}
          `.trim(),
          html_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Order Confirmed!</h1>
    <p style="color: white; font-size: 18px; margin: 10px 0 0 0;">Order #{{order_number}}</p>
  </div>

  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hi <strong>{{customer_first_name}}</strong>,</p>

    <p>Thank you for your order! We've received it and it's being processed with care.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #3b82f6;">Order Summary</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Order Number:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_number}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Order Date:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Status:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">{{order_status}}</span></td>
        </tr>
      </table>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #3b82f6;">Order Items ({{items_count}})</h3>
      {{items_html}}

      <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #3b82f6;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 5px 0;"><strong>Subtotal:</strong></td>
            <td style="padding: 5px 0; text-align: right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Shipping:</strong></td>
            <td style="padding: 5px 0; text-align: right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Tax:</strong></td>
            <td style="padding: 5px 0; text-align: right;">{{order_tax}}</td>
          </tr>
          <tr style="border-top: 2px solid #e5e7eb;">
            <td style="padding: 10px 0;"><strong style="font-size: 18px;">Total:</strong></td>
            <td style="padding: 10px 0; text-align: right; font-size: 18px; font-weight: bold; color: #3b82f6;">{{order_total}}</td>
          </tr>
        </table>
      </div>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #3b82f6;">Shipping Address</h3>
      <p style="margin: 0; color: #666;">{{shipping_address}}</p>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #3b82f6;">Payment Method</h3>
      <p style="margin: 0; color: #666;">{{payment_method}}</p>
    </div>

    <p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
      📦 We'll send you another email when your order ships with tracking information!
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{order_details_url}}" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Track Your Order
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; text-align: center;">
      Order #{{order_number}} | {{order_date}}<br>
      Questions? Visit <a href="{{store_url}}" style="color: #3b82f6;">{{store_name}}</a><br>
      © {{current_year}} {{store_name}}. All rights reserved.
    </p>
  </div>
</body>
</html>
          `.trim(),
          variables: getVariablesForTemplate('order_success_email'),
          is_active: true,
          sort_order: 3,
          attachment_enabled: true,
          attachment_config: {
            generateInvoicePdf: true,
            attachOrderDetails: true
          }
        });
        console.log('  ✅ Created order_success_email template');
      } else {
        console.log('  ⏭️ Order success email template already exists');
      }
    }

    console.log('\n✅ Email template seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding email templates:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedDefaultEmailTemplates()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

module.exports = seedDefaultEmailTemplates;
