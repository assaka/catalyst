const express = require('express');
const runSeoSchemaMigration = require('../database/migrations/run-seo-schema-migration');

const router = express.Router();

// @route   POST /api/run-seo-migration
// @desc    Run SEO schema migration to add missing columns
// @access  Public (for now - this is a one-time migration)
router.post('/', async (req, res) => {
  try {
    console.log('🚀 SEO Migration endpoint called');
    
    // Run the migration
    await runSeoSchemaMigration();
    
    res.json({
      success: true,
      message: 'SEO schema migration completed successfully!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ SEO Migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'SEO schema migration failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/run-seo-migration/status
// @desc    Check if SEO migration is needed
// @access  Public
router.get('/status', async (req, res) => {
  try {
    const { sequelize } = require('../database/connection');
    
    // Check if the new columns exist by trying to describe the table
    const tableDescription = await sequelize.getQueryInterface().describeTable('seo_settings');
    
    const hasNewColumns = !!(
      tableDescription.default_meta_title &&
      tableDescription.canonical_base_url &&
      tableDescription.robots_txt_content
    );
    
    res.json({
      success: true,
      migrationNeeded: !hasNewColumns,
      hasNewColumns,
      availableColumns: Object.keys(tableDescription),
      message: hasNewColumns ? 'SEO schema is up to date' : 'SEO schema migration is needed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ SEO Migration status check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check SEO migration status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;