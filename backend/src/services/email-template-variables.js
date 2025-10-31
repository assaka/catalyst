/**
 * Email Template Variables Service
 * Defines available variables for each email template type
 */

const EMAIL_VARIABLES = {
  // Signup/Welcome Email Variables
  signup_email: [
    { key: '{{customer_name}}', description: 'Customer full name', example: 'John Doe' },
    { key: '{{customer_first_name}}', description: 'Customer first name', example: 'John' },
    { key: '{{customer_email}}', description: 'Customer email address', example: 'john@example.com' },
    { key: '{{store_name}}', description: 'Store name', example: 'My Awesome Store' },
    { key: '{{store_url}}', description: 'Store URL', example: 'https://mystore.com' },
    { key: '{{login_url}}', description: 'Customer login URL', example: 'https://mystore.com/login' },
    { key: '{{signup_date}}', description: 'Signup date', example: 'January 15, 2025' },
    { key: '{{current_year}}', description: 'Current year', example: '2025' }
  ],

  // Credit Purchase Email Variables
  credit_purchase_email: [
    { key: '{{customer_name}}', description: 'Customer full name', example: 'John Doe' },
    { key: '{{customer_first_name}}', description: 'Customer first name', example: 'John' },
    { key: '{{customer_email}}', description: 'Customer email address', example: 'john@example.com' },
    { key: '{{store_name}}', description: 'Store name', example: 'My Awesome Store' },
    { key: '{{credits_purchased}}', description: 'Number of credits purchased', example: '100' },
    { key: '{{amount_usd}}', description: 'Purchase amount in USD', example: '$10.00' },
    { key: '{{transaction_id}}', description: 'Transaction ID', example: 'TXN-12345' },
    { key: '{{balance}}', description: 'Current credit balance', example: '150' },
    { key: '{{purchase_date}}', description: 'Purchase date', example: 'January 15, 2025' },
    { key: '{{payment_method}}', description: 'Payment method used', example: 'Visa ending in 4242' },
    { key: '{{current_year}}', description: 'Current year', example: '2025' }
  ],

  // Order Success Email Variables
  order_success_email: [
    { key: '{{customer_name}}', description: 'Customer full name', example: 'John Doe' },
    { key: '{{customer_first_name}}', description: 'Customer first name', example: 'John' },
    { key: '{{customer_email}}', description: 'Customer email address', example: 'john@example.com' },
    { key: '{{store_name}}', description: 'Store name', example: 'My Awesome Store' },
    { key: '{{order_number}}', description: 'Order number', example: 'ORD-12345' },
    { key: '{{order_date}}', description: 'Order date', example: 'January 15, 2025' },
    { key: '{{order_total}}', description: 'Order total amount', example: '$125.99' },
    { key: '{{order_subtotal}}', description: 'Order subtotal (before tax/shipping)', example: '$100.00' },
    { key: '{{order_tax}}', description: 'Tax amount', example: '$10.00' },
    { key: '{{order_shipping}}', description: 'Shipping cost', example: '$15.99' },
    { key: '{{items_html}}', description: 'HTML table of order items', example: '<table>...</table>' },
    { key: '{{items_count}}', description: 'Number of items in order', example: '3' },
    { key: '{{shipping_address}}', description: 'Shipping address', example: '123 Main St, City, State 12345' },
    { key: '{{billing_address}}', description: 'Billing address', example: '123 Main St, City, State 12345' },
    { key: '{{payment_method}}', description: 'Payment method', example: 'Credit Card' },
    { key: '{{tracking_url}}', description: 'Shipment tracking URL', example: 'https://track.example.com/12345' },
    { key: '{{order_status}}', description: 'Order status', example: 'Processing' },
    { key: '{{estimated_delivery}}', description: 'Estimated delivery date', example: 'January 20-22, 2025' },
    { key: '{{store_url}}', description: 'Store URL', example: 'https://mystore.com' },
    { key: '{{order_details_url}}', description: 'Link to view order details', example: 'https://mystore.com/order/12345' },
    { key: '{{current_year}}', description: 'Current year', example: '2025' }
  ]
};

/**
 * Get available variables for a specific email template type
 * @param {string} templateIdentifier - Email template identifier
 * @returns {Array} Array of variable objects
 */
function getVariablesForTemplate(templateIdentifier) {
  return EMAIL_VARIABLES[templateIdentifier] || [];
}

/**
 * Get all variable keys for a template (for validation)
 * @param {string} templateIdentifier - Email template identifier
 * @returns {Array<string>} Array of variable keys
 */
function getVariableKeys(templateIdentifier) {
  const variables = EMAIL_VARIABLES[templateIdentifier] || [];
  return variables.map(v => v.key);
}

/**
 * Render template by replacing variables with actual values
 * @param {string} template - Template string with {{variables}}
 * @param {Object} values - Object with variable values
 * @returns {string} Rendered template
 */
function renderTemplate(template, values) {
  if (!template) return '';

  let rendered = template;

  // Replace all variables
  Object.keys(values).forEach(key => {
    const placeholder = `{{${key}}}`;
    const value = values[key] !== undefined && values[key] !== null ? values[key] : '';
    rendered = rendered.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });

  // Remove any unreplaced variables
  rendered = rendered.replace(/\{\{.*?\}\}/g, '');

  return rendered;
}

/**
 * Generate example data for testing/preview
 * @param {string} templateIdentifier - Email template identifier
 * @returns {Object} Example data object
 */
function getExampleData(templateIdentifier) {
  const variables = EMAIL_VARIABLES[templateIdentifier] || [];
  const exampleData = {};

  variables.forEach(v => {
    const key = v.key.replace(/\{\{|\}\}/g, '');
    exampleData[key] = v.example;
  });

  return exampleData;
}

/**
 * Format order items as HTML table
 * @param {Array} items - Array of order items
 * @returns {string} HTML table
 */
function formatOrderItemsHtml(items) {
  if (!items || items.length === 0) {
    return '<p>No items</p>';
  }

  let html = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">';
  html += '<thead><tr style="background-color: #f8f9fa;">';
  html += '<th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Product</th>';
  html += '<th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Quantity</th>';
  html += '<th style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">Price</th>';
  html += '<th style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">Total</th>';
  html += '</tr></thead><tbody>';

  items.forEach(item => {
    html += '<tr>';
    html += `<td style="padding: 10px; border: 1px solid #dee2e6;">${item.product_name}</td>`;
    html += `<td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${item.quantity}</td>`;
    html += `<td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">$${parseFloat(item.unit_price).toFixed(2)}</td>`;
    html += `<td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">$${parseFloat(item.total_price).toFixed(2)}</td>`;
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
}

/**
 * Format address as string
 * @param {Object} address - Address object
 * @returns {string} Formatted address
 */
function formatAddress(address) {
  if (!address) return 'N/A';

  const parts = [
    address.street,
    address.street_2,
    address.city,
    address.state,
    address.postal_code,
    address.country
  ].filter(Boolean);

  return parts.join(', ');
}

module.exports = {
  EMAIL_VARIABLES,
  getVariablesForTemplate,
  getVariableKeys,
  renderTemplate,
  getExampleData,
  formatOrderItemsHtml,
  formatAddress
};
