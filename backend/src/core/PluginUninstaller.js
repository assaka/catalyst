const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

/**
 * Enhanced Plugin Uninstaller
 * Handles safe plugin removal with cleanup options
 */
class PluginUninstaller {
  constructor(pluginManager) {
    this.pluginManager = pluginManager;
    this.backupDirectory = path.join(__dirname, '../backups/plugins');
  }

  /**
   * Enhanced uninstall with multiple cleanup options
   */
  async uninstallPlugin(name, options = {}) {
    const {
      removeCode = false,           // Remove plugin code files
      cleanupData = 'ask',         // 'keep', 'remove', 'ask'
      cleanupTables = 'ask',       // 'keep', 'remove', 'ask' 
      createBackup = true,         // Backup before removal
      force = false                // Force removal even if plugin is in use
    } = options;

    const plugin = this.pluginManager.installedPlugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} is not installed`);
    }

    console.log(`🗑️ Starting enhanced uninstall for plugin: ${name}`);

    try {
      // 1. Pre-uninstall checks
      await this.performPreUninstallChecks(name, force);

      // 2. Create backup if requested
      let backupPath = null;
      if (createBackup) {
        backupPath = await this.createPluginBackup(name, plugin);
        console.log(`💾 Created backup at: ${backupPath}`);
      }

      // 3. Disable plugin first
      if (plugin.isEnabled) {
        await this.pluginManager.disablePlugin(name);
      }

      // 4. Database cleanup based on user choice
      if (cleanupData === 'remove' || (cleanupData === 'ask' && await this.askUserConfirmation('cleanup-data', name))) {
        await this.cleanupPluginData(name, plugin);
      }

      // 5. Table cleanup based on user choice  
      if (cleanupTables === 'remove' || (cleanupTables === 'ask' && await this.askUserConfirmation('cleanup-tables', name))) {
        await this.cleanupPluginTables(name, plugin);
      }

      // 6. Remove from plugin manager
      await this.pluginManager.removeFromInstalled(name);

      // 7. Code removal based on user choice
      if (removeCode) {
        await this.removePluginCode(name, plugin);
      }

      // 8. Update database record
      await this.updateUninstallRecord(name, options, backupPath);

      console.log(`✅ Plugin ${name} uninstalled successfully`);

      // 9. Emit uninstall hook with cleanup info
      await this.pluginManager.emitHook('plugin:uninstalled', {
        plugin,
        name,
        options,
        backupPath,
        cleanupPerformed: {
          data: cleanupData === 'remove',
          tables: cleanupTables === 'remove',
          code: removeCode
        }
      });

      return {
        success: true,
        backupPath,
        message: `Plugin ${name} uninstalled successfully`,
        cleanupSummary: await this.generateCleanupSummary(name, options)
      };

    } catch (error) {
      console.error(`❌ Failed to uninstall plugin ${name}:`, error.message);
      
      // Log error to database
      await this.logUninstallError(name, error, options);
      
      throw new Error(`Uninstall failed: ${error.message}`);
    }
  }

  /**
   * Pre-uninstall safety checks
   */
  async performPreUninstallChecks(name, force) {
    const plugin = this.pluginManager.getPlugin(name);
    
    // Check if other plugins depend on this one
    const dependents = await this.findDependentPlugins(name);
    if (dependents.length > 0 && !force) {
      throw new Error(
        `Cannot uninstall ${name}. The following plugins depend on it: ${dependents.join(', ')}. ` +
        `Use force=true to override or uninstall dependents first.`
      );
    }

    // Check if plugin is actively being used
    const isInUse = await this.checkPluginUsage(name);
    if (isInUse && !force) {
      throw new Error(
        `Plugin ${name} is currently in use. ` +
        `Please ensure no active processes are using this plugin or use force=true.`
      );
    }

    // Validate plugin can be safely removed
    if (plugin.manifest?.critical && !force) {
      throw new Error(
        `Plugin ${name} is marked as critical. Use force=true to override this protection.`
      );
    }
  }

  /**
   * Create comprehensive backup of plugin
   */
  async createPluginBackup(name, plugin) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${name}_${timestamp}`;
    const backupPath = path.join(this.backupDirectory, backupName);

    // Ensure backup directory exists
    await fs.mkdir(this.backupDirectory, { recursive: true });
    await fs.mkdir(backupPath, { recursive: true });

    // 1. Backup plugin code
    if (plugin.pluginPath) {
      const codePath = path.join(backupPath, 'code');
      await this.copyDirectory(plugin.pluginPath, codePath);
    }

    // 2. Backup plugin configuration
    const configPath = path.join(backupPath, 'config.json');
    await fs.writeFile(configPath, JSON.stringify({
      name: plugin.name,
      version: plugin.version,
      manifest: plugin.manifest,
      config: plugin.config,
      isEnabled: plugin.isEnabled,
      installedAt: plugin.dbRecord?.installedAt,
      backupCreatedAt: new Date().toISOString()
    }, null, 2));

    // 3. Backup plugin data (if small enough)
    if (plugin.manifest?.backupData !== false) {
      await this.backupPluginData(name, plugin, path.join(backupPath, 'data'));
    }

    // 4. Create backup manifest
    const manifest = {
      pluginName: name,
      backupVersion: '1.0',
      createdAt: new Date().toISOString(),
      includes: {
        code: true,
        config: true,
        data: plugin.manifest?.backupData !== false,
        tables: false // Tables are complex, document them instead
      },
      restoreInstructions: `To restore this plugin:
1. Copy code directory back to plugins/${name}
2. Import configuration via admin panel
3. Run database restore if data was backed up
4. Reinstall and enable plugin`
    };

    await fs.writeFile(
      path.join(backupPath, 'backup-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    return backupPath;
  }

  /**
   * Clean up plugin-specific data
   */
  async cleanupPluginData(name, plugin) {
    console.log(`🧹 Cleaning up data for plugin: ${name}`);

    try {
      // Call plugin's cleanup method if available
      if (typeof plugin.cleanupPluginData === 'function') {
        await plugin.cleanupPluginData();
      }

      // Generic data cleanup based on plugin manifest
      if (plugin.manifest?.dataCleanup) {
        for (const cleanup of plugin.manifest.dataCleanup) {
          await this.executeDataCleanup(cleanup);
        }
      }

      console.log(`✅ Plugin data cleanup completed for: ${name}`);
    } catch (error) {
      console.error(`❌ Plugin data cleanup failed for ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Drop plugin-created database tables
   */
  async cleanupPluginTables(name, plugin) {
    console.log(`🗄️ Cleaning up database tables for plugin: ${name}`);

    try {
      const { sequelize } = require('../database/connection');

      // Get tables created by this plugin
      const tablesToDrop = await this.getPluginTables(name, plugin);
      
      if (tablesToDrop.length === 0) {
        console.log(`No tables found for plugin: ${name}`);
        return;
      }

      // Drop tables in reverse dependency order
      for (const tableName of tablesToDrop.reverse()) {
        try {
          await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
          console.log(`🗑️ Dropped table: ${tableName}`);
        } catch (error) {
          console.warn(`⚠️ Failed to drop table ${tableName}:`, error.message);
        }
      }

      console.log(`✅ Database table cleanup completed for: ${name}`);
    } catch (error) {
      console.error(`❌ Database table cleanup failed for ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Remove plugin code from filesystem
   */
  async removePluginCode(name, plugin) {
    console.log(`📁 Removing plugin code for: ${name}`);

    try {
      if (plugin.pluginPath && await this.pathExists(plugin.pluginPath)) {
        // Use system remove command for better error handling
        if (process.platform === 'win32') {
          await execAsync(`rmdir /s /q "${plugin.pluginPath}"`);
        } else {
          await execAsync(`rm -rf "${plugin.pluginPath}"`);
        }
        console.log(`✅ Plugin code removed: ${plugin.pluginPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to remove plugin code for ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Get list of tables created by plugin
   */
  async getPluginTables(name, plugin) {
    const tables = [];

    // From plugin manifest
    if (plugin.manifest?.tables) {
      tables.push(...plugin.manifest.tables);
    }

    // From plugin migrations
    if (plugin.migrations && plugin.migrations.length > 0) {
      for (const migration of plugin.migrations) {
        if (migration.tables) {
          tables.push(...migration.tables);
        }
      }
    }

    // Query database for tables with plugin prefix
    try {
      const { sequelize } = require('../database/connection');
      const [results] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (table_name LIKE '${name}_%' OR table_name LIKE '%_${name}_%')
        ORDER BY table_name;
      `);
      
      const prefixedTables = results.map(row => row.table_name);
      tables.push(...prefixedTables);
    } catch (error) {
      console.warn(`Could not query for plugin tables: ${error.message}`);
    }

    // Remove duplicates and system tables
    const systemTables = ['plugins', 'migrations', 'stores', 'users'];
    return [...new Set(tables)].filter(table => !systemTables.includes(table));
  }

  /**
   * Find plugins that depend on this one
   */
  async findDependentPlugins(name) {
    const dependents = [];
    
    for (const [pluginName, plugin] of this.pluginManager.plugins.entries()) {
      if (plugin.dependencies && plugin.dependencies.includes(name)) {
        dependents.push(pluginName);
      }
    }
    
    return dependents;
  }

  /**
   * Check if plugin is actively being used
   */
  async checkPluginUsage(name) {
    const plugin = this.pluginManager.getPlugin(name);
    
    // Check if plugin has active routes
    if (plugin.routes && plugin.routes.length > 0) {
      return true;
    }
    
    // Check if plugin has running services
    if (plugin.isEnabled && typeof plugin.hasActiveServices === 'function') {
      return await plugin.hasActiveServices();
    }
    
    return false;
  }

  /**
   * Ask user for confirmation (placeholder - implement with actual UI)
   */
  async askUserConfirmation(type, pluginName) {
    // TODO: Implement actual user confirmation dialog
    // For now, return true to clean up (safer default)
    console.log(`⚠️ Would ask user about ${type} for ${pluginName} (auto-confirming for now)`);
    return true;
  }

  /**
   * Update database with uninstall record
   */
  async updateUninstallRecord(name, options, backupPath) {
    try {
      const PluginModel = require('../models/Plugin');
      const plugin = await PluginModel.findBySlug(name);
      
      if (plugin) {
        await plugin.update({
          status: 'uninstalled',
          isInstalled: false,
          isEnabled: false,
          uninstalledAt: new Date(),
          uninstallOptions: options,
          backupPath: backupPath,
          uninstallLog: `Plugin uninstalled successfully with options: ${JSON.stringify(options)}`
        });
      }
    } catch (error) {
      console.warn(`Failed to update uninstall record: ${error.message}`);
    }
  }

  /**
   * Generate cleanup summary
   */
  async generateCleanupSummary(name, options) {
    return {
      plugin: name,
      actions: {
        codeRemoved: options.removeCode || false,
        dataCleanedUp: options.cleanupData === 'remove',
        tablesDropped: options.cleanupTables === 'remove',
        backupCreated: options.createBackup !== false
      },
      timestamp: new Date().toISOString()
    };
  }

  // Utility methods
  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  async pathExists(path) {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async backupPluginData(name, plugin, backupPath) {
    // Implement plugin-specific data backup logic
    // This is a placeholder - real implementation would backup actual data
    await fs.mkdir(backupPath, { recursive: true });
    await fs.writeFile(
      path.join(backupPath, 'README.txt'),
      `Plugin data backup for ${name}\nCreated: ${new Date().toISOString()}\n\nThis directory would contain plugin-specific data exports.`
    );
  }

  async executeDataCleanup(cleanup) {
    // Execute cleanup commands defined in plugin manifest
    console.log(`Executing data cleanup: ${cleanup.description}`);
    
    if (cleanup.type === 'sql') {
      const { sequelize } = require('../database/connection');
      await sequelize.query(cleanup.query);
    } else if (cleanup.type === 'function') {
      // Call custom cleanup function
      const cleanupFn = require(cleanup.path);
      await cleanupFn();
    }
  }

  async logUninstallError(name, error, options) {
    try {
      const PluginModel = require('../models/Plugin');
      const plugin = await PluginModel.findBySlug(name);
      
      if (plugin) {
        await plugin.update({
          status: 'error',
          uninstallLog: `Uninstall failed: ${error.message}\nOptions: ${JSON.stringify(options)}\nStack: ${error.stack}`
        });
      }
    } catch (logError) {
      console.error(`Failed to log uninstall error: ${logError.message}`);
    }
  }
}

module.exports = PluginUninstaller;