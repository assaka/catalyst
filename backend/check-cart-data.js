// Check cart data in database
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function checkCartData() {
  try {
    console.log('🔍 Checking cart data in database...\n');

    // Get all carts with details
    const [carts] = await sequelize.query(`
      SELECT
        id,
        session_id,
        store_id,
        user_id,
        json_array_length(items::json) as item_count,
        created_at,
        updated_at
      FROM carts
      ORDER BY created_at DESC
      LIMIT 20;
    `);

    console.log('Recent carts (last 20):');
    console.table(carts);

    // Check for duplicate session_ids
    const [duplicates] = await sequelize.query(`
      SELECT
        session_id,
        COUNT(*) as count,
        array_agg(store_id) as store_ids
      FROM carts
      WHERE session_id IS NOT NULL
      GROUP BY session_id
      HAVING COUNT(*) > 1
      ORDER BY count DESC;
    `);

    if (duplicates.length > 0) {
      console.log('\n⚠️  Found duplicate session_ids (same session with multiple stores):');
      console.table(duplicates);
    } else {
      console.log('\n✅ No duplicate session_ids found');
    }

    // Check for carts with items
    const [cartsWithItems] = await sequelize.query(`
      SELECT
        COUNT(*) as total_carts,
        COUNT(CASE WHEN json_array_length(items::json) > 0 THEN 1 END) as carts_with_items,
        COUNT(CASE WHEN json_array_length(items::json) = 0 THEN 1 END) as empty_carts
      FROM carts;
    `);

    console.log('\nCart statistics:');
    console.table(cartsWithItems);

  } catch (error) {
    console.error('❌ Check failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

checkCartData();
