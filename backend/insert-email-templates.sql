-- Insert default email templates
-- REPLACE 'YOUR_STORE_ID_HERE' with your actual store ID from the stores table
-- Example: '66a80282-7f9f-41ef-a1a4-e96330aec679'

-- 1. SIGNUP/WELCOME EMAIL TEMPLATE
INSERT INTO email_templates (
  id,
  store_id,
  identifier,
  subject,
  content_type,
  template_content,
  html_content,
  variables,
  is_active,
  sort_order,
  attachment_enabled,
  attachment_config,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'YOUR_STORE_ID_HERE',
  'signup_email',
  'Welcome to {{store_name}}!',
  'both',
  'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

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
Account created on: {{signup_date}}',
  '<!DOCTYPE html>
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

    <p>We''re thrilled to have you with us! Your account has been successfully created.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #667eea;">What''s Next?</h3>
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
</html>',
  '[
    {"key": "{{customer_name}}", "description": "Customer full name", "example": "John Doe"},
    {"key": "{{customer_first_name}}", "description": "Customer first name", "example": "John"},
    {"key": "{{customer_email}}", "description": "Customer email address", "example": "john@example.com"},
    {"key": "{{store_name}}", "description": "Store name", "example": "My Awesome Store"},
    {"key": "{{store_url}}", "description": "Store URL", "example": "https://mystore.com"},
    {"key": "{{login_url}}", "description": "Customer login URL", "example": "https://mystore.com/login"},
    {"key": "{{signup_date}}", "description": "Signup date", "example": "January 15, 2025"},
    {"key": "{{current_year}}", "description": "Current year", "example": "2025"}
  ]'::jsonb,
  true,
  1,
  false,
  '{}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (identifier, store_id) DO NOTHING;

-- 2. CREDIT PURCHASE CONFIRMATION EMAIL
INSERT INTO email_templates (
  id,
  store_id,
  identifier,
  subject,
  content_type,
  template_content,
  html_content,
  variables,
  is_active,
  sort_order,
  attachment_enabled,
  attachment_config,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'YOUR_STORE_ID_HERE',
  'credit_purchase_email',
  'Credit Purchase Confirmation - {{credits_purchased}} Credits',
  'both',
  'Hi {{customer_first_name}},

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
Transaction ID: {{transaction_id}}',
  '<!DOCTYPE html>
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
</html>',
  '[
    {"key": "{{customer_name}}", "description": "Customer full name", "example": "John Doe"},
    {"key": "{{customer_first_name}}", "description": "Customer first name", "example": "John"},
    {"key": "{{customer_email}}", "description": "Customer email address", "example": "john@example.com"},
    {"key": "{{store_name}}", "description": "Store name", "example": "My Awesome Store"},
    {"key": "{{credits_purchased}}", "description": "Number of credits purchased", "example": "100"},
    {"key": "{{amount_usd}}", "description": "Purchase amount in USD", "example": "$10.00"},
    {"key": "{{transaction_id}}", "description": "Transaction ID", "example": "TXN-12345"},
    {"key": "{{balance}}", "description": "Current credit balance", "example": "150"},
    {"key": "{{purchase_date}}", "description": "Purchase date", "example": "January 15, 2025"},
    {"key": "{{payment_method}}", "description": "Payment method used", "example": "Visa ending in 4242"},
    {"key": "{{current_year}}", "description": "Current year", "example": "2025"}
  ]'::jsonb,
  true,
  2,
  false,
  '{}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (identifier, store_id) DO NOTHING;

-- 3. ORDER SUCCESS/CONFIRMATION EMAIL
INSERT INTO email_templates (
  id,
  store_id,
  identifier,
  subject,
  content_type,
  template_content,
  html_content,
  variables,
  is_active,
  sort_order,
  attachment_enabled,
  attachment_config,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'YOUR_STORE_ID_HERE',
  'order_success_email',
  'Order Confirmation #{{order_number}} - Thank You!',
  'both',
  'Hi {{customer_first_name}},

Thank you for your order! We''ve received your order and it''s being processed.

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

We''ll send you another email when your order ships with tracking information.

Thank you for shopping with us!

Best regards,
The {{store_name}} Team

---
Order #{{order_number}} | {{order_date}}',
  '<!DOCTYPE html>
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

    <p>Thank you for your order! We''ve received it and it''s being processed with care.</p>

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
      📦 We''ll send you another email when your order ships with tracking information!
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
</html>',
  '[
    {"key": "{{customer_name}}", "description": "Customer full name", "example": "John Doe"},
    {"key": "{{customer_first_name}}", "description": "Customer first name", "example": "John"},
    {"key": "{{customer_email}}", "description": "Customer email address", "example": "john@example.com"},
    {"key": "{{store_name}}", "description": "Store name", "example": "My Awesome Store"},
    {"key": "{{order_number}}", "description": "Order number", "example": "ORD-12345"},
    {"key": "{{order_date}}", "description": "Order date", "example": "January 15, 2025"},
    {"key": "{{order_total}}", "description": "Order total amount", "example": "$125.99"},
    {"key": "{{order_subtotal}}", "description": "Order subtotal", "example": "$100.00"},
    {"key": "{{order_tax}}", "description": "Tax amount", "example": "$10.00"},
    {"key": "{{order_shipping}}", "description": "Shipping cost", "example": "$15.99"},
    {"key": "{{items_html}}", "description": "HTML table of order items", "example": "<table>...</table>"},
    {"key": "{{items_count}}", "description": "Number of items", "example": "3"},
    {"key": "{{shipping_address}}", "description": "Shipping address", "example": "123 Main St"},
    {"key": "{{billing_address}}", "description": "Billing address", "example": "123 Main St"},
    {"key": "{{payment_method}}", "description": "Payment method", "example": "Credit Card"},
    {"key": "{{tracking_url}}", "description": "Tracking URL", "example": "https://track.com/12345"},
    {"key": "{{order_status}}", "description": "Order status", "example": "Processing"},
    {"key": "{{order_details_url}}", "description": "Order details link", "example": "https://store.com/order/123"},
    {"key": "{{store_url}}", "description": "Store URL", "example": "https://mystore.com"},
    {"key": "{{current_year}}", "description": "Current year", "example": "2025"}
  ]'::jsonb,
  true,
  3,
  true,
  '{"generateInvoicePdf": true, "attachOrderDetails": true}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (identifier, store_id) DO NOTHING;

-- Verify insertion
SELECT id, identifier, subject, is_active
FROM email_templates
WHERE store_id = 'YOUR_STORE_ID_HERE'
ORDER BY sort_order;
