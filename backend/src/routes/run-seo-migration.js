const express = require('express');
const { runPendingMigrations, MigrationTracker } = require('../database/migrations/migration-tracker');

const router = express.Router();

// @route   POST /api/run-seo-migration
// @desc    Run all pending database migrations
// @access  Public (for now - this is a maintenance endpoint)
router.post('/', async (req, res) => {
  try {
    console.log('🚀 Manual migration endpoint called');
    
    // Run all pending migrations
    const result = await runPendingMigrations();
    
    if (result.success) {
      res.json({
        success: true,
        message: `Database migrations completed successfully! ${result.migrationsRun} migrations executed.`,
        migrationsRun: result.migrationsRun,
        totalPending: result.totalPending,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Some database migrations failed',
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Manual migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database migration failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/run-seo-migration/status
// @desc    Check migration status and list pending migrations
// @access  Public
router.get('/status', async (req, res) => {
  try {
    const tracker = new MigrationTracker();
    
    // Ensure migrations table exists
    await tracker.ensureMigrationsTable();
    
    // Get migration status
    const executedMigrations = await tracker.getExecutedMigrations();
    const availableMigrations = tracker.getAvailableMigrations();
    const pendingMigrations = availableMigrations.filter(
      migration => !executedMigrations.includes(migration)
    );
    
    // Check SEO specific columns
    let seoColumnsStatus = null;
    try {
      const { sequelize } = require('../database/connection');
      const tableDescription = await sequelize.getQueryInterface().describeTable('seo_settings');
      
      seoColumnsStatus = {
        hasDefaultMetaTitle: !!tableDescription.default_meta_title,
        hasCanonicalBaseUrl: !!tableDescription.canonical_base_url,
        hasRobotsTxtContent: !!tableDescription.robots_txt_content,
        hasHreflangSettings: !!tableDescription.hreflang_settings,
        totalColumns: Object.keys(tableDescription).length,
        availableColumns: Object.keys(tableDescription)
      };
    } catch (tableError) {
      seoColumnsStatus = { error: 'Could not check seo_settings table', message: tableError.message };
    }
    
    res.json({
      success: true,
      migrationStatus: {
        totalAvailable: availableMigrations.length,
        totalExecuted: executedMigrations.length,
        totalPending: pendingMigrations.length,
        isUpToDate: pendingMigrations.length === 0
      },
      availableMigrations,
      executedMigrations,
      pendingMigrations,
      seoColumnsStatus,
      message: pendingMigrations.length === 0 ? 'All migrations are up to date' : `${pendingMigrations.length} migrations pending`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Migration status check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check migration status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;