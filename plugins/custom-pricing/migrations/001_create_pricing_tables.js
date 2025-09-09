/**
 * Migration: Create Custom Pricing Tables
 * Stores all pricing rules and logic in database
 */

exports.up = async function(knex) {
  console.log('🗄️ Creating Custom Pricing Plugin tables...');
  
  // Pricing Rules Table
  await knex.schema.createTable('plugin_custom_pricing_rules', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('type').notNullable(); // 'volume', 'loyalty', 'bundle', 'coupon'
    table.boolean('enabled').defaultTo(true);
    table.integer('priority').defaultTo(10);
    table.json('conditions'); // Store conditions as JSON
    table.json('actions'); // Store actions as JSON
    table.string('store_id');
    table.timestamps(true, true);
    
    table.index(['type', 'enabled']);
    table.index(['store_id']);
  });
  
  // Discount Rules Table
  await knex.schema.createTable('plugin_custom_pricing_discounts', (table) => {
    table.increments('id').primary();
    table.integer('rule_id').references('id').inTable('plugin_custom_pricing_rules').onDelete('CASCADE');
    table.string('discount_type').notNullable(); // 'percentage', 'fixed', 'buy_x_get_y'
    table.decimal('discount_value', 10, 2);
    table.decimal('minimum_amount', 10, 2).nullable();
    table.integer('minimum_quantity').nullable();
    table.string('applies_to'); // 'item', 'cart', 'shipping'
    table.json('conditions');
    table.boolean('stackable').defaultTo(false);
    table.timestamps(true, true);
  });
  
  // Pricing Logs Table for analytics
  await knex.schema.createTable('plugin_custom_pricing_logs', (table) => {
    table.increments('id').primary();
    table.integer('rule_id').references('id').inTable('plugin_custom_pricing_rules');
    table.string('event_type'); // 'applied', 'skipped', 'error'
    table.decimal('original_price', 10, 2);
    table.decimal('final_price', 10, 2);
    table.decimal('discount_amount', 10, 2).defaultTo(0);
    table.string('customer_id').nullable();
    table.string('product_id').nullable();
    table.json('context'); // Store context data
    table.timestamps(true, true);
    
    table.index(['event_type', 'created_at']);
    table.index(['rule_id']);
  });
  
  console.log('✅ Custom Pricing Plugin tables created');
};

exports.down = async function(knex) {
  console.log('🗄️ Dropping Custom Pricing Plugin tables...');
  
  await knex.schema.dropTableIfExists('plugin_custom_pricing_logs');
  await knex.schema.dropTableIfExists('plugin_custom_pricing_discounts');
  await knex.schema.dropTableIfExists('plugin_custom_pricing_rules');
  
  console.log('✅ Custom Pricing Plugin tables dropped');
};