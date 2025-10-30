// Migration endpoint - run database migrations on production
const express = require('express');
const router = express.Router();
const { sequelize } = require('../database/connection');

/**
 * POST /api/migrations/make-creator-id-nullable
 * Make creator_id nullable in plugin_registry table
 */
router.post('/make-creator-id-nullable', async (req, res) => {
  try {
    console.log('🔄 Running migration: make creator_id nullable...');

    // Check if already nullable
    const [columns] = await sequelize.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'plugin_registry'
      AND column_name = 'creator_id'
    `);

    if (columns[0]?.is_nullable === 'YES') {
      return res.json({
        success: true,
        message: 'creator_id is already nullable',
        column: columns[0]
      });
    }

    // Make nullable
    await sequelize.query(`
      ALTER TABLE plugin_registry
      ALTER COLUMN creator_id DROP NOT NULL
    `);

    // Verify
    const [updated] = await sequelize.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'plugin_registry'
      AND column_name = 'creator_id'
    `);

    console.log('✅ Migration completed');

    res.json({
      success: true,
      message: 'creator_id is now nullable',
      before: columns[0],
      after: updated[0]
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
