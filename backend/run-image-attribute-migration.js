const { sequelize } = require('./src/database/connection.js');
const fs = require('fs');
const path = require('path');

async function runImageAttributeMigration() {
  try {
    console.log('🚀 Running image attribute type migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'src/database/migrations/add-image-attribute-type.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await sequelize.query(sql);
    
    console.log('✅ Image attribute type migration completed successfully!');
    
    // Verify the migration
    console.log('🔍 Verifying migration...');
    
    // Check if image type is now available
    const [enumValues] = await sequelize.query(`
      SELECT e.enumlabel 
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'enum_attributes_type'
      ORDER BY e.enumlabel;
    `);
    
    console.log('📋 Available attribute types:', enumValues.map(v => v.enumlabel));
    
    // Check how many base image attributes were created
    const [baseImageAttrs] = await sequelize.query(`
      SELECT COUNT(*) as count, store_id
      FROM attributes 
      WHERE code = 'base_image' AND type = 'image'
      GROUP BY store_id;
    `);
    
    console.log(`📊 Created base image attributes for ${baseImageAttrs.length} stores`);
    baseImageAttrs.forEach(attr => {
      console.log(`  - Store ${attr.store_id}: ${attr.count} base image attribute(s)`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

runImageAttributeMigration();