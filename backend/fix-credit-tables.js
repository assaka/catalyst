const { sequelize } = require('./src/database/connection.js');

(async () => {
  try {
    console.log('🔧 Fixing credit system tables...');
    
    // Drop existing tables to recreate with correct schema
    console.log('Dropping existing tables...');
    await sequelize.query('DROP TABLE IF EXISTS credit_transactions CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS credit_usage CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS credits CASCADE;');
    
    // Create credits table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS credits (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          total_purchased DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          total_used DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, store_id)
      );
    `);
    console.log('✅ Created credits table');

    // Create credit_transactions table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS credit_transactions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase', 'bonus', 'refund')),
          amount_usd DECIMAL(10,2) NOT NULL,
          credits_purchased DECIMAL(10,2) NOT NULL,
          stripe_payment_intent_id VARCHAR(255),
          stripe_charge_id VARCHAR(255),
          status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created credit_transactions table');

    // Create credit_usage table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS credit_usage (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          credits_used DECIMAL(10,2) NOT NULL,
          usage_type VARCHAR(50) NOT NULL CHECK (usage_type IN ('akeneo_schedule', 'akeneo_manual', 'other')),
          reference_id UUID NULL,
          reference_type VARCHAR(50) NULL,
          description TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created credit_usage table');

    // Add columns to akeneo_schedules if not exists
    try {
      await sequelize.query(`
        ALTER TABLE akeneo_schedules 
        ADD COLUMN IF NOT EXISTS credit_cost DECIMAL(5,3) NOT NULL DEFAULT 0.1,
        ADD COLUMN IF NOT EXISTS last_credit_usage UUID REFERENCES credit_usage(id);
      `);
      console.log('✅ Added credit columns to akeneo_schedules');
    } catch (error) {
      console.log('ℹ️ akeneo_schedules columns already exist or table not found');
    }

    // Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_credits_user_store ON credits(user_id, store_id);
      CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_credit_transactions_status ON credit_transactions(status);
      CREATE INDEX IF NOT EXISTS idx_credit_usage_user_store ON credit_usage(user_id, store_id);
      CREATE INDEX IF NOT EXISTS idx_credit_usage_created_at ON credit_usage(created_at);
      CREATE INDEX IF NOT EXISTS idx_credit_usage_reference ON credit_usage(reference_id, reference_type);
    `);
    console.log('✅ Created indexes');

    console.log('✅ Credit system tables fixed successfully!');
    
    // Verify tables exist
    const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_name IN ('credits', 'credit_transactions', 'credit_usage') AND table_schema = 'public';");
    
    console.log('📋 Created tables:');
    results.forEach(table => console.log('  - ' + table.table_name));
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    await sequelize.close();
    process.exit(1);
  }
})();