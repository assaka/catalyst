const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const StoreDataMigration = require('../models/StoreDataMigration');
const StoreSupabaseConnection = require('../models/StoreSupabaseConnection');
const DataMigrationService = require('../services/data-migration-service');
const { 
  MIGRATION_TYPES, 
  getMigrationTypesByPriority, 
  getCriticalMigrationTypes,
  getTotalEstimatedSize 
} = require('../config/migration-types');

// All routes require authentication and store ownership
router.use(authMiddleware);
router.use(checkStoreOwnership);

/**
 * GET /api/stores/:store_id/data-migration/types
 * Get available migration types
 */
router.get('/types', async (req, res) => {
  try {
    const migrationTypes = getMigrationTypesByPriority();
    const criticalTypes = getCriticalMigrationTypes();
    const totalEstimatedSize = getTotalEstimatedSize();
    
    res.json({
      success: true,
      data: migrationTypes,
      meta: {
        total_types: migrationTypes.length,
        critical_types: criticalTypes.map(t => t.type),
        estimated_total_size_mb: totalEstimatedSize
      }
    });
  } catch (error) {
    console.error('Get migration types error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stores/:store_id/data-migration/status
 * Get migration status for all types
 */
router.get('/status', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    
    const stats = await StoreDataMigration.getMigrationStats(storeId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get migration status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stores/:store_id/data-migration/:migration_type
 * Get specific migration details
 */
router.get('/:migration_type', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { migration_type } = req.params;
    
    const migration = await StoreDataMigration.findByStoreAndType(storeId, migration_type);
    
    if (!migration) {
      return res.status(404).json({
        success: false,
        error: 'Migration not found'
      });
    }
    
    res.json({
      success: true,
      data: migration
    });
  } catch (error) {
    console.error('Get migration details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stores/:store_id/data-migration/setup
 * Setup a new data migration
 */
router.post('/setup', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { migration_type, target_system = 'supabase', migration_config = {} } = req.body;
    
    if (!migration_type) {
      return res.status(400).json({
        success: false,
        error: 'Migration type is required'
      });
    }
    
    // Get Supabase connection for the store
    const supabaseConnection = await StoreSupabaseConnection.findActiveByStore(storeId);
    
    if (target_system === 'supabase' && !supabaseConnection) {
      return res.status(400).json({
        success: false,
        error: 'Supabase connection is required for this migration. Please configure Supabase connection first.'
      });
    }
    
    // Create or update migration
    const migration = await StoreDataMigration.createOrUpdate(storeId, {
      migration_type,
      target_system,
      supabase_project_url: supabaseConnection?.project_url,
      supabase_anon_key: supabaseConnection?.anon_key,
      supabase_service_key: supabaseConnection?.service_key,
      migration_config
    });
    
    res.json({
      success: true,
      message: 'Migration setup completed',
      data: migration
    });
  } catch (error) {
    console.error('Setup migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stores/:store_id/data-migration/:migration_type/start
 * Start a comprehensive data migration using DataMigrationService
 */
router.post('/:migration_type/start', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { migration_type } = req.params;
    
    // Validate migration type
    if (!MIGRATION_TYPES[migration_type]) {
      return res.status(400).json({
        success: false,
        error: `Unknown migration type: ${migration_type}`
      });
    }
    
    // Check for existing migration record
    let migration = await StoreDataMigration.findByStoreAndType(storeId, migration_type);
    
    // Create migration record if it doesn't exist
    if (!migration) {
      migration = await StoreDataMigration.create({
        store_id: storeId,
        migration_type,
        target_system: 'supabase',
        migration_status: 'pending',
        migration_config: {
          preserve_relationships: true,
          include_metadata: true
        }
      });
    }
    
    if (migration.migration_status === 'in_progress') {
      return res.status(400).json({
        success: false,
        error: 'Migration is already in progress'
      });
    }
    
    // Start the migration using the comprehensive service
    const migrationService = new DataMigrationService();
    
    // Update status to in_progress
    await migration.updateStatus('in_progress');
    
    // Start background migration process
    process.nextTick(async () => {
      try {
        console.log(`🚀 Starting comprehensive migration for ${migration_type}`);
        
        const results = await migrationService.migrateMigrationType(
          storeId,
          migration_type,
          (progress) => {
            console.log(`📊 Migration progress:`, progress);
            // Could emit WebSocket events here for real-time updates
          }
        );
        
        await migration.updateStatus('completed', {
          results,
          completed_at: new Date()
        });
        
        console.log(`✅ Migration completed for ${migration_type}: ${results.totalMigrated} records`);
        
      } catch (migrationError) {
        console.error(`❌ Migration failed for ${migration_type}:`, migrationError);
        await migration.updateStatus('failed', {
          error: migrationError.message,
          failed_at: new Date()
        });
      }
    });
    
    res.json({
      success: true,
      message: `${migration_type} migration started successfully`,
      data: {
        migration_type,
        status: 'in_progress',
        estimated_records: MIGRATION_TYPES[migration_type].estimated_size_mb * 100, // Rough estimate
        tables: MIGRATION_TYPES[migration_type].tables
      }
    });
  } catch (error) {
    console.error('Start migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stores/:store_id/data-migration/:migration_type/pause
 * Pause a running migration
 */
router.post('/:migration_type/pause', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { migration_type } = req.params;
    const { reason } = req.body;
    
    const migration = await StoreDataMigration.findByStoreAndType(storeId, migration_type);
    
    if (!migration) {
      return res.status(404).json({
        success: false,
        error: 'Migration not found'
      });
    }
    
    if (migration.migration_status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        error: 'Cannot pause a migration that is not in progress'
      });
    }
    
    await migration.pause(reason);
    
    res.json({
      success: true,
      message: 'Migration paused successfully',
      data: migration
    });
  } catch (error) {
    console.error('Pause migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stores/:store_id/data-migration/:migration_type/reset
 * Reset a migration (clear progress and start over)
 */
router.post('/:migration_type/reset', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { migration_type } = req.params;
    
    const migration = await StoreDataMigration.findByStoreAndType(storeId, migration_type);
    
    if (!migration) {
      return res.status(404).json({
        success: false,
        error: 'Migration not found'
      });
    }
    
    await migration.resetMigration();
    
    res.json({
      success: true,
      message: 'Migration reset successfully',
      data: migration
    });
  } catch (error) {
    console.error('Reset migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/stores/:store_id/data-migration/:migration_type
 * Delete a migration configuration
 */
router.delete('/:migration_type', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { migration_type } = req.params;
    
    const migration = await StoreDataMigration.findByStoreAndType(storeId, migration_type);
    
    if (!migration) {
      return res.status(404).json({
        success: false,
        error: 'Migration not found'
      });
    }
    
    if (migration.migration_status === 'in_progress') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete a migration that is in progress. Pause it first.'
      });
    }
    
    await migration.destroy();
    
    res.json({
      success: true,
      message: 'Migration deleted successfully'
    });
  } catch (error) {
    console.error('Delete migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stores/:store_id/data-migration/migrate-all
 * Start migration for all configured types
 */
router.post('/migrate-all', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    
    const migrations = await StoreDataMigration.findByStore(storeId);
    const results = [];
    
    for (const migration of migrations) {
      if (migration.migration_status === 'pending' || migration.migration_status === 'failed') {
        try {
          await migration.start();
          await startMigrationProcess(migration);
          results.push({ type: migration.migration_type, status: 'started' });
        } catch (error) {
          await migration.fail(error.message);
          results.push({ type: migration.migration_type, status: 'failed', error: error.message });
        }
      } else {
        results.push({ type: migration.migration_type, status: 'skipped', reason: `Already ${migration.migration_status}` });
      }
    }
    
    res.json({
      success: true,
      message: `Processed ${results.length} migration(s)`,
      data: results
    });
  } catch (error) {
    console.error('Migrate all error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to start migration process
async function startMigrationProcess(migration) {
  try {
    const { sequelize } = require('../database/connection');
    const { createClient } = require('@supabase/supabase-js');
    
    // Create Supabase client
    const supabaseClient = createClient(
      migration.supabase_project_url,
      migration.supabase_service_key.replace('encrypted:', '') // Decrypt if needed
    );
    
    // Get migration type configuration
    const migrationTypes = StoreDataMigration.getMigrationTypes();
    const typeConfig = migrationTypes.find(t => t.type === migration.migration_type);
    
    if (!typeConfig) {
      throw new Error(`Unknown migration type: ${migration.migration_type}`);
    }
    
    const tablesToMigrate = typeConfig.tables;
    let completedTables = 0;
    
    // Migrate each table
    for (const tableName of tablesToMigrate) {
      try {
        console.log(`Starting migration of table: ${tableName}`);
        
        // Get data from source (Catalyst DB)
        const [sourceData] = await sequelize.query(`SELECT * FROM ${tableName} WHERE store_id = :storeId`, {
          replacements: { storeId: migration.store_id },
          type: sequelize.QueryTypes.SELECT
        });
        
        if (sourceData.length === 0) {
          console.log(`No data found in table: ${tableName}`);
          await migration.updateProgress(((completedTables + 1) / tablesToMigrate.length) * 100, tableName);
          completedTables++;
          continue;
        }
        
        // Create table in Supabase if it doesn't exist
        await createSupabaseTable(supabaseClient, tableName, sourceData[0]);
        
        // Insert data into Supabase
        const { error } = await supabaseClient
          .from(tableName)
          .upsert(sourceData, { onConflict: 'id' });
        
        if (error) {
          throw new Error(`Supabase insert error for ${tableName}: ${error.message}`);
        }
        
        console.log(`Successfully migrated ${sourceData.length} records from ${tableName}`);
        
        // Update progress
        completedTables++;
        await migration.updateProgress(((completedTables) / tablesToMigrate.length) * 100, tableName);
        
      } catch (tableError) {
        console.error(`Error migrating table ${tableName}:`, tableError);
        await migration.addError(`Table ${tableName}: ${tableError.message}`, { table: tableName });
        
        // Continue with other tables but log the error
        completedTables++;
        await migration.updateProgress(((completedTables) / tablesToMigrate.length) * 100);
      }
    }
    
    // Mark as completed
    await migration.complete();
    console.log(`Migration ${migration.migration_type} completed successfully`);
    
  } catch (error) {
    console.error('Migration process error:', error);
    await migration.fail(error.message);
    throw error;
  }
}

// Helper function to create table in Supabase
async function createSupabaseTable(supabaseClient, tableName, sampleData) {
  try {
    // This is a simplified approach - in production you'd want more sophisticated schema detection
    const columns = Object.keys(sampleData);
    
    // Check if table exists first
    const { data: existingTable } = await supabaseClient
      .from(tableName)
      .select('*')
      .limit(1);
    
    // If no error, table exists
    if (existingTable !== null) {
      console.log(`Table ${tableName} already exists in Supabase`);
      return;
    }
  } catch (error) {
    // Table doesn't exist, which is expected for first migration
    console.log(`Table ${tableName} will be created by Supabase automatically on first insert`);
  }
}

module.exports = router;