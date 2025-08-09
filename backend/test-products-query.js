const { sequelize } = require('./src/database/connection');
const { QueryTypes } = require('sequelize');
const { Product } = require('./src/models');

async function testProductsQuery() {
  try {
    const userId = 'cbca0a20-973d-4a33-85fc-d84d461d1372'; // info@itomoti.com
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    console.log('🔍 Testing products query for user:', userId);
    console.log('🔍 Store ID:', storeId);
    
    // 1. Check if user owns the store
    const storeCheck = await sequelize.query(
      'SELECT id, name, user_id FROM stores WHERE id = :storeId',
      { replacements: { storeId }, type: QueryTypes.SELECT }
    );
    
    console.log('\n1. Store ownership check:');
    if (storeCheck.length > 0) {
      console.log('   Store found:', storeCheck[0].name);
      console.log('   Owner ID:', storeCheck[0].user_id);
      console.log('   User owns store:', storeCheck[0].user_id === userId);
    }
    
    // 2. Test getUserStoresForDropdown function
    console.log('\n2. Testing getUserStoresForDropdown:');
    const { getUserStoresForDropdown } = require('./src/utils/storeAccess');
    const accessibleStores = await getUserStoresForDropdown(userId);
    console.log('   Accessible stores:', accessibleStores.length);
    accessibleStores.forEach(s => console.log('   -', s.name, '(ID:', s.id + ')'));
    
    const userStoreIds = accessibleStores.map(store => store.id);
    console.log('   User store IDs:', userStoreIds);
    console.log('   Requested store in list:', userStoreIds.includes(storeId));
    
    // 3. Test the actual products query
    console.log('\n3. Testing products query:');
    
    // Direct SQL query
    const directProducts = await sequelize.query(
      'SELECT COUNT(*) as count FROM products WHERE store_id = :storeId',
      { replacements: { storeId }, type: QueryTypes.SELECT }
    );
    console.log('   Direct SQL count:', directProducts[0].count);
    
    // Sequelize model query (as used in the route)
    const { count, rows } = await Product.findAndCountAll({
      where: { store_id: storeId },
      limit: 5
    });
    console.log('   Sequelize model count:', count);
    console.log('   First 5 products:');
    rows.forEach(p => console.log('     -', p.name, '(SKU:', p.sku + ')'));
    
    // 4. Test with the exact where clause from the route
    console.log('\n4. Testing with route logic:');
    const where = {};
    
    if (userStoreIds.includes(storeId)) {
      where.store_id = storeId;
      console.log('   ✅ Store access granted, where clause:', where);
    } else {
      console.log('   ❌ Store access denied - would return empty array');
    }
    
    const routeQuery = await Product.findAndCountAll({
      where,
      limit: 5,
      order: [['created_at', 'DESC']]
    });
    
    console.log('   Route query count:', routeQuery.count);
    console.log('   Route query products:', routeQuery.rows.length);
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await sequelize.close();
  }
}

testProductsQuery();