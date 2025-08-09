// Set environment variables before requiring database connection
process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = 'postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres';

const { sequelize } = require('./src/database/connection.js');

(async () => {
  try {
    console.log('Creating akeneo_custom_mappings table...');
    
    // Create table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS akeneo_custom_mappings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        mapping_type VARCHAR(50) NOT NULL,
        mappings JSON NOT NULL DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE(store_id, mapping_type)
      )
    `);
    
    console.log('Table created successfully!');
    
    // Create index
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_akeneo_custom_mappings_store_id ON akeneo_custom_mappings(store_id)');
    console.log('Index created successfully!');
    
    // Verify the table was created
    const [results] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'akeneo_custom_mappings' ORDER BY ordinal_position;");
    
    if (results.length > 0) {
      console.log('✅ Table columns:', results.map(r => r.column_name).join(', '));
    } else {
      console.log('❌ Table was not created');
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    await sequelize.close();
    process.exit(1);
  }
})();