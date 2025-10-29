// Run migration to create hamid_cart table
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function runMigration() {
  try {
    console.log('🚀 Running hamid_cart table migration...\n');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS hamid_cart (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        session_id VARCHAR(255),
        cart_items_count INTEGER DEFAULT 0,
        cart_subtotal DECIMAL(10, 2) DEFAULT 0.00,
        cart_total DECIMAL(10, 2) DEFAULT 0.00,
        user_agent TEXT,
        ip_address VARCHAR(45),
        referrer_url TEXT,
        visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_hamid_cart_user ON hamid_cart(user_id);
      CREATE INDEX IF NOT EXISTS idx_hamid_cart_session ON hamid_cart(session_id);
      CREATE INDEX IF NOT EXISTS idx_hamid_cart_visited_at ON hamid_cart(visited_at DESC);

      COMMENT ON TABLE hamid_cart IS 'Tracks cart page visits for analytics (Cart Hamid Plugin)';
    `);

    console.log('✅ hamid_cart table created successfully!');
    console.log('📊 Ready to track cart visits!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

runMigration();
