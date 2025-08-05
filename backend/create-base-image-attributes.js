const { sequelize } = require('./src/database/connection.js');

async function createBaseImageAttributes() {
  try {
    console.log('🏪 Creating base image attributes for existing stores...');
    
    // Create base image attributes for stores that don't have one
    await sequelize.query(`
      INSERT INTO attributes (id, name, code, type, is_required, is_filterable, is_searchable, is_usable_in_conditions, file_settings, sort_order, store_id, created_at, updated_at)
      SELECT 
          gen_random_uuid(),
          'Base Image',
          'base_image',
          'image',
          false,
          false,
          false,
          false,
          '{"allowed_extensions": ["jpg", "jpeg", "png", "gif", "webp", "svg"], "max_file_size": 10}',
          0,
          s.id,
          NOW(),
          NOW()
      FROM stores s
      WHERE NOT EXISTS (
          SELECT 1 FROM attributes a 
          WHERE a.store_id = s.id 
          AND a.code = 'base_image'
          AND a.type IN ('image', 'file')
      );
    `);
    
    console.log('✅ Created base image attributes');
    
    // Check what was created
    const [baseImageAttrs] = await sequelize.query(`
      SELECT COUNT(*) as count, store_id
      FROM attributes 
      WHERE code = 'base_image' AND type = 'image'
      GROUP BY store_id;
    `);
    
    console.log(`📊 Base image attributes for ${baseImageAttrs.length} stores:`);
    baseImageAttrs.forEach(attr => {
      console.log(`  - Store ${attr.store_id}: ${attr.count} base image attribute(s)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

createBaseImageAttributes();