const BaseJobHandler = require('./BaseJobHandler');
const PluginManager = require('../PluginManager');
const PluginModel = require('../../models/Plugin');

/**
 * Background job handler for plugin uninstallation
 */
class PluginUninstallJob extends BaseJobHandler {
  async execute() {
    this.log('Starting plugin uninstall job');

    const payload = this.getPayload();
    const { pluginId, forceUninstall = false, cleanupData = true } = payload;

    if (!pluginId) {
      throw new Error('pluginId is required in job payload');
    }

    try {
      await this.updateProgress(10, 'Loading plugin information...');

      // Get plugin from database
      const plugin = await PluginModel.findByPk(pluginId);
      if (!plugin) {
        throw new Error(`Plugin with ID ${pluginId} not found`);
      }

      if (plugin.status !== 'installed' && !forceUninstall) {
        throw new Error(`Plugin ${plugin.name} is not installed`);
      }

      await this.updateProgress(20, 'Preparing uninstallation...');

      // Ensure plugin manager is initialized
      await PluginManager.initialize();

      await this.updateProgress(30, 'Disabling plugin...');

      // Disable plugin first if it's enabled
      if (plugin.is_enabled) {
        await PluginManager.disablePlugin(plugin.slug);
      }

      await this.updateProgress(50, 'Removing plugin files...');

      // Use the uninstaller from PluginManager
      const uninstallResult = await PluginManager.uninstaller.uninstallPlugin(plugin.slug, {
        cleanupData
      });

      if (!uninstallResult.success && !forceUninstall) {
        throw new Error(`Uninstallation failed: ${uninstallResult.message}`);
      }

      await this.updateProgress(80, 'Updating database records...');

      // Update plugin status
      await plugin.update({
        status: 'uninstalled',
        is_enabled: false,
        uninstallation_date: new Date(),
        metadata: {
          ...plugin.metadata,
          uninstall_job_id: this.job.id,
          cleanup_data: cleanupData,
          force_uninstall: forceUninstall
        }
      });

      await this.updateProgress(100, 'Plugin uninstalled successfully');

      const result = {
        success: true,
        message: `Plugin ${plugin.name} uninstalled successfully`,
        plugin: {
          id: plugin.id,
          name: plugin.name,
          slug: plugin.slug
        },
        cleanupData,
        forceUninstall
      };

      this.log(`Plugin uninstalled: ${JSON.stringify(result.plugin)}`);
      return result;

    } catch (error) {
      this.log(`Plugin uninstall failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

module.exports = PluginUninstallJob;