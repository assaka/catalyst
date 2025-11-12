const BaseJobHandler = require('./BaseJobHandler');
const AmazonExportService = require('../../services/amazon-export-service');

/**
 * Amazon Sync Inventory Job
 *
 * Syncs inventory levels to Amazon
 */
class AmazonSyncInventoryJob extends BaseJobHandler {
  async execute() {
    const { storeId, productIds } = this.job.payload;

    this.log(`Starting Amazon inventory sync for store ${storeId}`);
    await this.updateProgress(20, 'Initializing Amazon connection...');

    const exportService = new AmazonExportService(storeId);
    await exportService.initialize();

    await this.updateProgress(50, 'Syncing inventory...');

    const result = await exportService.syncInventory(productIds);

    await this.updateProgress(100, 'Inventory sync completed');

    this.log(`Inventory sync complete: ${result.itemCount} items`);

    return result;
  }

  log(message) {
    console.log(`[AmazonSyncInventoryJob ${this.job.id}] ${message}`);
  }
}

module.exports = AmazonSyncInventoryJob;
