const BaseJobHandler = require('./BaseJobHandler');
const AkeneoIntegration = require('../../services/akeneo-integration');
const IntegrationConfig = require('../../models/IntegrationConfig');
const ImportStatistic = require('../../models/ImportStatistic');

/**
 * Background job handler for Akeneo family imports
 */
class AkeneoImportFamiliesJob extends BaseJobHandler {
  async execute() {
    this.log('Starting Akeneo families import job');

    const payload = this.getPayload();
    const {
      storeId,
      locale = 'en_US',
      dryRun = false,
      filters = {}
    } = payload;

    if (!storeId) {
      throw new Error('storeId is required in job payload');
    }

    // Validate dependencies
    await this.validateDependencies([
      {
        name: 'Akeneo Integration Config',
        check: async () => {
          const config = await IntegrationConfig.findByStoreAndType(storeId, 'akeneo');
          return !!config;
        },
        message: 'Akeneo integration not configured for this store'
      }
    ]);

    let akeneoIntegration;
    let importStats = {
      total: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    try {
      await this.updateProgress(10, 'Initializing Akeneo integration...');

      // Initialize Akeneo integration
      const config = await IntegrationConfig.findByStoreAndType(storeId, 'akeneo');
      akeneoIntegration = new AkeneoIntegration(config.getDecryptedConfig());

      // Test connection
      const connectionTest = await akeneoIntegration.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Akeneo connection failed: ${connectionTest.message}`);
      }

      await this.updateProgress(20, 'Importing families from Akeneo...');

      // Import families using the existing method
      const result = await akeneoIntegration.importFamilies(storeId, {
        locale,
        dryRun,
        filters
      });

      // Extract stats from result
      if (result.stats) {
        importStats = {
          total: result.stats.families.total,
          imported: result.stats.families.imported,
          skipped: result.stats.families.skipped,
          failed: result.stats.families.failed,
          errors: result.stats.errors || []
        };
      }

      await this.updateProgress(90, 'Saving import statistics...');

      // Save import statistics
      await ImportStatistic.saveImportResults(storeId, 'families', {
        totalProcessed: importStats.total,
        successfulImports: importStats.imported,
        failedImports: importStats.failed,
        skippedImports: importStats.skipped,
        errorDetails: importStats.errors.length > 0 ? JSON.stringify(importStats.errors) : null,
        importMethod: 'background_job'
      });

      await this.updateProgress(100, 'Families import completed');

      const finalResult = {
        success: result.success,
        message: `Import completed: ${importStats.imported} imported, ${importStats.skipped} skipped, ${importStats.failed} failed`,
        stats: importStats,
        dryRun,
        locale,
        filters
      };

      this.log(`Families import completed: ${JSON.stringify(finalResult.stats)}`);
      return finalResult;

    } catch (error) {
      // Save partial statistics if available
      if (importStats.total > 0) {
        await ImportStatistic.saveImportResults(storeId, 'families', {
          totalProcessed: importStats.total,
          successfulImports: importStats.imported,
          failedImports: importStats.failed,
          skippedImports: importStats.skipped,
          errorDetails: importStats.errors.length > 0 ? JSON.stringify(importStats.errors) : error.message,
          importMethod: 'background_job'
        });
      }

      throw error;
    }
  }
}

module.exports = AkeneoImportFamiliesJob;