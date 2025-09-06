const { Pool } = require('pg');

async function createSlotConfigurationsTable() {
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
    console.log('🚀 Creating slot_configurations table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS slot_configurations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE ON UPDATE CASCADE,
        configuration JSON NOT NULL,
        version VARCHAR(255) NOT NULL DEFAULT '1.0',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE UNIQUE INDEX IF NOT EXISTS unique_user_store_config 
      ON slot_configurations (user_id, store_id);
      
      CREATE INDEX IF NOT EXISTS idx_store_id 
      ON slot_configurations (store_id);
      
      CREATE INDEX IF NOT EXISTS idx_is_active 
      ON slot_configurations (is_active);
    `;
    
    await pool.query(createTableSQL);
    console.log('✅ slot_configurations table created successfully!');
    
    // Check if table exists and has correct structure
    const checkResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'slot_configurations'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Table structure:');
    checkResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    await pool.end();
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createSlotConfigurationsTable();
}

module.exports = createSlotConfigurationsTable;