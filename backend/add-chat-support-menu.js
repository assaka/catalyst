/**
 * Add Chat Support menu item to admin navigation
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function addChatSupportMenu() {
  const client = await pool.connect();

  try {
    console.log('📋 Adding Chat Support menu item...\n');

    // First, check if Sales category exists
    const categoryCheck = await client.query(`
      SELECT id FROM admin_menu_categories WHERE key = 'Sales'
    `);

    let categoryId;
    if (categoryCheck.rows.length === 0) {
      // Create Sales category if it doesn't exist
      const categoryResult = await client.query(`
        INSERT INTO admin_menu_categories (key, label, icon, position)
        VALUES ('Sales', 'Sales', 'ShoppingBag', 3)
        RETURNING id
      `);
      categoryId = categoryResult.rows[0].id;
      console.log('✅ Created Sales category');
    } else {
      categoryId = categoryCheck.rows[0].id;
      console.log('✅ Found existing Sales category');
    }

    // Check if Chat Support menu item already exists
    const existingItem = await client.query(`
      SELECT id FROM admin_menu_items WHERE path = '/admin/chat-support'
    `);

    if (existingItem.rows.length > 0) {
      console.log('⚠️  Chat Support menu item already exists');
      return;
    }

    // Add Chat Support menu item
    await client.query(`
      INSERT INTO admin_menu_items (
        category_id,
        parent_key,
        key,
        label,
        path,
        icon,
        position,
        visible
      ) VALUES (
        $1,
        'Sales',
        'chat-support',
        'Chat Support',
        '/admin/chat-support',
        'MessageSquare',
        50,
        true
      )
    `, [categoryId]);

    console.log('✅ Added Chat Support menu item under Sales');
    console.log('\n🎉 Done! Refresh your browser to see the new menu item.');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addChatSupportMenu()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
