const { sequelize } = require('./src/database/connection');

async function runConsentMigration() {
  try {
    console.log('🔄 Running consent logs migration...');
    
    // Just sync the ConsentLog model without altering existing tables
    const { ConsentLog } = require('./src/models');
    
    await ConsentLog.sync({ force: false });
    console.log('✅ ConsentLog table created/synced successfully');
    
    // Test the table exists
    const result = await sequelize.query("SELECT COUNT(*) FROM consent_logs WHERE 1=0");
    console.log('✅ ConsentLog table is accessible');
    
  } catch (error) {
    console.error('❌ ConsentLog migration failed:', error);
    
    // Try manual table creation if sync fails
    try {
      console.log('🔄 Attempting manual table creation...');
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS consent_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id VARCHAR(255) NOT NULL,
          user_id UUID,
          store_id UUID NOT NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          consent_given BOOLEAN NOT NULL,
          categories_accepted JSONB NOT NULL DEFAULT '[]'::jsonb,
          country_code VARCHAR(2),
          consent_method VARCHAR(20) NOT NULL,
          page_url TEXT,
          created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT fk_consent_logs_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
          CONSTRAINT fk_consent_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          CONSTRAINT chk_consent_method CHECK (consent_method IN ('accept_all', 'reject_all', 'custom'))
        );
      `);
      console.log('✅ Manual table creation successful');
    } catch (manualError) {
      console.error('❌ Manual table creation also failed:', manualError);
      throw error;
    }
  } finally {
    await sequelize.close();
  }
}

// Run the migration
if (require.main === module) {
  runConsentMigration()
    .then(() => {
      console.log('✅ ConsentLog migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ ConsentLog migration failed:', error);
      process.exit(1);
    });
}

module.exports = runConsentMigration;