-- Quick seed: Insert email templates for ALL stores
-- This will create the 3 default templates for every store in your database

DO $$
DECLARE
  store_record RECORD;
BEGIN
  FOR store_record IN SELECT id, name FROM stores
  LOOP
    RAISE NOTICE 'Creating email templates for store: % (%)', store_record.name, store_record.id;

    -- 1. Signup Email
    INSERT INTO email_templates (
      id, store_id, identifier, subject, content_type,
      template_content, html_content, variables,
      is_active, sort_order, attachment_enabled, attachment_config,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      store_record.id,
      'signup_email',
      'Welcome to {{store_name}}!',
      'both',
      'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team',
      '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Welcome to {{store_name}}!</h1>
  </div>
  <div style="background: #f8f9fa; padding: 30px;">
    <p>Hi <strong>{{customer_first_name}}</strong>,</p>
    <p>Welcome to {{store_name}}! Your account has been created successfully.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{login_url}}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Login to Your Account</a>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center;">© {{current_year}} {{store_name}}</p>
  </div>
</body>
</html>',
      '[{"key": "{{customer_name}}"}, {"key": "{{customer_first_name}}"}, {"key": "{{store_name}}"}, {"key": "{{store_url}}"}, {"key": "{{login_url}}"}, {"key": "{{current_year}}"}]'::jsonb,
      true, 1, false, '{}'::jsonb,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT (identifier, store_id) DO NOTHING;

    -- 2. Credit Purchase Email
    INSERT INTO email_templates (
      id, store_id, identifier, subject, content_type,
      template_content, html_content, variables,
      is_active, sort_order, attachment_enabled, attachment_config,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      store_record.id,
      'credit_purchase_email',
      'Credit Purchase Confirmation - {{credits_purchased}} Credits',
      'both',
      'Hi {{customer_first_name}},

Thank you for your credit purchase!

Purchase Details:
- Credits Purchased: {{credits_purchased}}
- Amount Paid: {{amount_usd}}
- Current Balance: {{balance}} credits

Your credits are ready to use!

Best regards,
The {{store_name}} Team',
      '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Purchase Confirmed!</h1>
    <p style="color: white; font-size: 18px;">+{{credits_purchased}} Credits</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px;">
    <p>Hi <strong>{{customer_first_name}}</strong>,</p>
    <p>Your credit purchase has been processed successfully!</p>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Credits Purchased:</strong> {{credits_purchased}}</p>
      <p><strong>Amount Paid:</strong> {{amount_usd}}</p>
      <p><strong>Current Balance:</strong> {{balance}} credits</p>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center;">© {{current_year}} {{store_name}}</p>
  </div>
</body>
</html>',
      '[{"key": "{{customer_name}}"}, {"key": "{{customer_first_name}}"}, {"key": "{{credits_purchased}}"}, {"key": "{{amount_usd}}"}, {"key": "{{balance}}"}, {"key": "{{store_name}}"}, {"key": "{{current_year}}"}]'::jsonb,
      true, 2, false, '{}'::jsonb,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT (identifier, store_id) DO NOTHING;

    -- 3. Order Success Email
    INSERT INTO email_templates (
      id, store_id, identifier, subject, content_type,
      template_content, html_content, variables,
      is_active, sort_order, attachment_enabled, attachment_config,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      store_record.id,
      'order_success_email',
      'Order Confirmation #{{order_number}} - Thank You!',
      'both',
      'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team',
      '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Order Confirmed!</h1>
    <p style="color: white; font-size: 18px;">Order #{{order_number}}</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px;">
    <p>Hi <strong>{{customer_first_name}}</strong>,</p>
    <p>Thank you for your order! We''ve received it and it''s being processed.</p>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Order Number:</strong> {{order_number}}</p>
      <p><strong>Order Date:</strong> {{order_date}}</p>
      <p><strong>Total:</strong> {{order_total}}</p>
      <p><strong>Status:</strong> {{order_status}}</p>
    </div>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Order Items ({{items_count}})</h3>
      {{items_html}}
    </div>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Shipping To:</strong></p>
      <p style="color: #666;">{{shipping_address}}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{order_details_url}}" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Track Your Order</a>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center;">Order #{{order_number}} | © {{current_year}} {{store_name}}</p>
  </div>
</body>
</html>',
      '[{"key": "{{customer_name}}"}, {"key": "{{order_number}}"}, {"key": "{{order_date}}"}, {"key": "{{order_total}}"}, {"key": "{{items_html}}"}, {"key": "{{items_count}}"}, {"key": "{{shipping_address}}"}, {"key": "{{store_name}}"}, {"key": "{{current_year}}"}]'::jsonb,
      true, 3, true, '{"generateInvoicePdf": true}'::jsonb,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT (identifier, store_id) DO NOTHING;

  END LOOP;
END $$;

-- Show what was created
SELECT s.name as store_name, et.identifier, et.subject, et.is_active
FROM email_templates et
JOIN stores s ON et.store_id = s.id
ORDER BY s.name, et.sort_order;
