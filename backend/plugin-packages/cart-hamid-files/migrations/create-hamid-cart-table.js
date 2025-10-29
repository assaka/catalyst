// Migration script to create hamid_cart table
// This should be run once during plugin installation

module.exports = {
  async up(sequelize) {
    await sequelize.query(`
      -- Create hamid_cart table for tracking cart visits
      CREATE TABLE IF NOT EXISTS hamid_cart (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        -- Visit Information
        user_id UUID,
        session_id VARCHAR(255),

        -- Cart Details at Time of Visit
        cart_items_count INTEGER DEFAULT 0,
        cart_subtotal DECIMAL(10, 2) DEFAULT 0.00,
        cart_total DECIMAL(10, 2) DEFAULT 0.00,

        -- Additional Context
        user_agent TEXT,
        ip_address VARCHAR(45),
        referrer_url TEXT,

        -- Timestamps
        visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_hamid_cart_user ON hamid_cart(user_id);
      CREATE INDEX IF NOT EXISTS idx_hamid_cart_session ON hamid_cart(session_id);
      CREATE INDEX IF NOT EXISTS idx_hamid_cart_visited_at ON hamid_cart(visited_at DESC);

      -- Add comment
      COMMENT ON TABLE hamid_cart IS 'Tracks cart page visits for analytics (Cart Hamid Plugin)';
    `);

    console.log('✅ hamid_cart table created successfully');
  },

  async down(sequelize) {
    await sequelize.query(`DROP TABLE IF EXISTS hamid_cart CASCADE;`);
    console.log('✅ hamid_cart table dropped');
  }
};
