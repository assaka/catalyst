const BaseJobHandler = require('./BaseJobHandler');
const PluginManager = require('../PluginManager');
const PluginModel = require('../../models/Plugin');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Background job handler for plugin installations
 */
class PluginInstallJob extends BaseJobHandler {
  async execute() {
    this.log('Starting plugin installation job');

    const payload = this.getPayload();
    const {
      pluginIdentifier,
      installationSource, // 'marketplace', 'github', 'local'
      sourceUrl,
      version = 'latest',
      storeId,
      userId,
      installOptions = {}
    } = payload;

    if (!pluginIdentifier) {
      throw new Error('pluginIdentifier is required in job payload');
    }

    if (!installationSource) {
      throw new Error('installationSource is required in job payload');
    }

    let pluginRecord;
    let installationPath;

    try {
      await this.updateProgress(5, 'Validating plugin installation request...');

      // Check if plugin is already installed
      const existingPlugin = await PluginModel.findBySlug(pluginIdentifier);
      if (existingPlugin && existingPlugin.status === 'installed') {
        throw new Error(`Plugin ${pluginIdentifier} is already installed`);
      }

      await this.updateProgress(10, 'Initializing plugin manager...');

      // Ensure plugin manager is initialized
      await PluginManager.initialize();

      await this.updateProgress(15, 'Preparing installation environment...');

      // Create plugin record in database
      pluginRecord = await PluginModel.create({
        name: pluginIdentifier, // Will be updated after manifest is read
        slug: pluginIdentifier,
        version: version,
        status: 'installing',
        source_type: installationSource,
        source_url: sourceUrl,
        installation_date: new Date(),
        metadata: {
          install_job_id: this.job.id,
          install_options: installOptions
        }
      });

      this.log(`Created plugin record with ID: ${pluginRecord.id}`);

      // Determine installation method
      switch (installationSource) {
        case 'github':
          await this.installFromGitHub(pluginRecord, sourceUrl);
          break;
        case 'marketplace':
          await this.installFromMarketplace(pluginRecord, pluginIdentifier);
          break;
        case 'local':
          await this.installFromLocal(pluginRecord, payload.localPath);
          break;
        default:
          throw new Error(`Unsupported installation source: ${installationSource}`);
      }

      await this.updateProgress(90, 'Finalizing plugin installation...');

      // Update plugin status to installed
      await pluginRecord.update({
        status: 'installed',
        installation_completed_at: new Date()
      });

      // Reload plugin in manager
      await PluginManager.loadPlugin(pluginRecord.slug, installationPath);

      await this.updateProgress(100, 'Plugin installation completed');

      const result = {
        success: true,
        message: `Plugin ${pluginRecord.name} installed successfully`,
        plugin: {
          id: pluginRecord.id,
          name: pluginRecord.name,
          slug: pluginRecord.slug,
          version: pluginRecord.version,
          source: installationSource,
          installationPath
        }
      };

      this.log(`Plugin installation completed: ${JSON.stringify(result.plugin)}`);
      return result;

    } catch (error) {
      this.log(`Plugin installation failed: ${error.message}`, 'error');

      // Clean up on failure
      if (pluginRecord) {
        await pluginRecord.update({
          status: 'failed',
          installation_failed_at: new Date(),
          error_message: error.message
        });
      }

      // Clean up installation directory if it exists
      if (installationPath) {
        try {
          await fs.rmdir(installationPath, { recursive: true });
          this.log(`Cleaned up installation directory: ${installationPath}`, 'debug');
        } catch (cleanupError) {
          this.log(`Failed to clean up installation directory: ${cleanupError.message}`, 'warn');
        }
      }

      throw error;
    }
  }

  /**
   * Install plugin from GitHub repository
   */
  async installFromGitHub(pluginRecord, githubUrl) {
    this.log(`Installing plugin from GitHub: ${githubUrl}`);

    await this.updateProgress(20, 'Cloning repository from GitHub...');

    // Validate GitHub URL
    const urlMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) {
      throw new Error('Invalid GitHub URL format');
    }

    const [, owner, repo] = urlMatch;
    const cleanRepoName = repo.replace(/\.git$/, '');
    const pluginDir = path.join(PluginManager.pluginDirectory, pluginRecord.slug);

    try {
      // Clone the repository
      await this.executeWithTimeout(
        () => execAsync(`git clone ${githubUrl} "${pluginDir}"`, { 
          timeout: 300000 // 5 minutes
        }),
        300000
      );

      installationPath = pluginDir;
      await this.updateProgress(40, 'Repository cloned successfully');

      // Read and validate manifest
      const manifest = await this.readAndValidateManifest(pluginDir);
      
      await this.updateProgress(50, 'Installing dependencies...');

      // Install npm dependencies if package.json exists
      const packageJsonPath = path.join(pluginDir, 'package.json');
      try {
        await fs.access(packageJsonPath);
        this.log('Found package.json, installing dependencies...');
        
        await this.executeWithTimeout(
          () => execAsync('npm ci --production', { 
            cwd: pluginDir,
            timeout: 600000 // 10 minutes
          }),
          600000
        );

        await this.updateProgress(70, 'Dependencies installed');
      } catch (packageError) {
        this.log('No package.json found or dependency installation skipped', 'debug');
        await this.updateProgress(70, 'No dependencies to install');
      }

      // Update plugin record with manifest data
      await pluginRecord.update({
        name: manifest.name || pluginRecord.slug,
        version: manifest.version || 'unknown',
        description: manifest.description,
        author: manifest.author,
        metadata: {
          ...pluginRecord.metadata,
          manifest,
          github_owner: owner,
          github_repo: cleanRepoName
        }
      });

      await this.updateProgress(80, 'Plugin validated and configured');

    } catch (error) {
      this.log(`GitHub installation failed: ${error.message}`, 'error');
      throw new Error(`Failed to install from GitHub: ${error.message}`);
    }
  }

  /**
   * Install plugin from marketplace
   */
  async installFromMarketplace(pluginRecord, pluginIdentifier) {
    this.log(`Installing plugin from marketplace: ${pluginIdentifier}`);

    await this.updateProgress(20, 'Fetching plugin from marketplace...');

    // Get plugin info from marketplace
    const marketplacePlugin = PluginManager.marketplace.get(pluginIdentifier);
    if (!marketplacePlugin) {
      throw new Error(`Plugin ${pluginIdentifier} not found in marketplace`);
    }

    if (marketplacePlugin.sourceType === 'github' && marketplacePlugin.sourceUrl) {
      // Delegate to GitHub installation
      await this.installFromGitHub(pluginRecord, marketplacePlugin.sourceUrl);
    } else {
      throw new Error(`Unsupported marketplace plugin source: ${marketplacePlugin.sourceType}`);
    }

    await this.updateProgress(80, 'Marketplace plugin installed');
  }

  /**
   * Install plugin from local directory
   */
  async installFromLocal(pluginRecord, localPath) {
    this.log(`Installing plugin from local path: ${localPath}`);

    await this.updateProgress(20, 'Copying plugin from local directory...');

    if (!localPath) {
      throw new Error('localPath is required for local installation');
    }

    const pluginDir = path.join(PluginManager.pluginDirectory, pluginRecord.slug);

    try {
      // Copy local directory to plugin directory
      await this.executeWithTimeout(
        () => this.copyDirectory(localPath, pluginDir),
        60000 // 1 minute
      );

      installationPath = pluginDir;
      await this.updateProgress(50, 'Plugin files copied');

      // Read and validate manifest
      const manifest = await this.readAndValidateManifest(pluginDir);

      // Update plugin record
      await pluginRecord.update({
        name: manifest.name || pluginRecord.slug,
        version: manifest.version || 'unknown',
        description: manifest.description,
        author: manifest.author,
        metadata: {
          ...pluginRecord.metadata,
          manifest,
          local_source: localPath
        }
      });

      await this.updateProgress(80, 'Local plugin installed and configured');

    } catch (error) {
      this.log(`Local installation failed: ${error.message}`, 'error');
      throw new Error(`Failed to install from local directory: ${error.message}`);
    }
  }

  /**
   * Read and validate plugin manifest
   */
  async readAndValidateManifest(pluginDir) {
    const manifestPath = path.join(pluginDir, 'manifest.json');
    
    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);

      // Basic validation
      if (!manifest.name) {
        throw new Error('Plugin manifest must include a name');
      }

      if (!manifest.version) {
        throw new Error('Plugin manifest must include a version');
      }

      this.log(`Validated plugin manifest: ${manifest.name} v${manifest.version}`, 'debug');
      return manifest;

    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Plugin manifest.json not found');
      }
      throw new Error(`Invalid plugin manifest: ${error.message}`);
    }
  }

  /**
   * Copy directory recursively
   */
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
}

module.exports = PluginInstallJob;