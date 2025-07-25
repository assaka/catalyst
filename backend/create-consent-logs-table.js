const { sequelize } = require('./src/database/connection');

async function createConsentLogsTable() {
  try {
    console.log('🔄 Creating consent_logs table...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS consent_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255) NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        consent_given BOOLEAN NOT NULL,
        categories_accepted JSONB NOT NULL DEFAULT '[]',
        country_code VARCHAR(2),
        consent_method VARCHAR(20) NOT NULL CHECK (consent_method IN ('accept_all', 'reject_all', 'custom')),
        page_url TEXT,
        created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    console.log('✅ consent_logs table created successfully');
    
    // Create index for better performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_consent_logs_store_id ON consent_logs(store_id);
      CREATE INDEX IF NOT EXISTS idx_consent_logs_created_date ON consent_logs(created_date);
      CREATE INDEX IF NOT EXISTS idx_consent_logs_session_id ON consent_logs(session_id);
    `);
    
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Failed to create consent_logs table:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
if (require.main === module) {
  createConsentLogsTable()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createConsentLogsTable;