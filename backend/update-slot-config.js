const { Pool } = require('pg');

async function updateSlotConfiguration() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('DATABASE_URL not configured');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Updating slot configuration with page_type...');
    
    // Get the existing configuration
    const result = await pool.query('SELECT id, configuration FROM slot_configurations WHERE is_active = true ORDER BY updated_at DESC LIMIT 1');
    
    if (result.rows.length === 0) {
      console.log('❌ No existing configuration found');
      return;
    }
    
    const configId = result.rows[0].id;
    const existingConfig = result.rows[0].configuration;
    
    console.log('📋 Current config keys:', Object.keys(existingConfig));
    
    // Create updated configuration with page_type
    const updatedConfig = {
      ...existingConfig,
      page_name: 'Cart',
      page_type: 'cart', 
      slot_type: 'cart_layout',
      timestamp: new Date().toISOString()
    };
    
    // Update the configuration in database
    await pool.query(
      'UPDATE slot_configurations SET configuration = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(updatedConfig), configId]
    );
    
    console.log('✅ Updated slot configuration successfully!');
    console.log('📝 Added fields:');
    console.log('  - page_type: cart');
    console.log('  - page_name: Cart');
    console.log('  - slot_type: cart_layout');
    console.log('  - timestamp: updated');
    
    // Verify the update
    const verifyResult = await pool.query('SELECT configuration FROM slot_configurations WHERE id = $1', [configId]);
    const verifiedConfig = verifyResult.rows[0].configuration;
    
    console.log('🔍 Verification:');
    console.log('  - Has page_type:', !!verifiedConfig.page_type);
    console.log('  - page_type value:', verifiedConfig.page_type);
    console.log('  - Has slotContent:', !!verifiedConfig.slotContent);
    console.log('  - SlotContent keys:', Object.keys(verifiedConfig.slotContent || {}).length);
    console.log('  - Has :', !!verifiedConfig.);
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error updating configuration:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  updateSlotConfiguration();
}

module.exports = updateSlotConfiguration;