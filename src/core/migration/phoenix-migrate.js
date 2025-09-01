#!/usr/bin/env node

/**
 * Phoenix Migration CLI Tool
 * Automates the migration from diff-based to slot-based customizations
 * 
 * Usage:
 *   node phoenix-migrate.js migrate-user --user-id=123
 *   node phoenix-migrate.js validate --config-file=config.json
 *   node phoenix-migrate.js rollout --phase=pilot
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');

// Import our migration components (in a real app these would be properly imported)
class PhoenixMigrationCLI {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      success: 0,
      errors: 0,
      warnings: 0
    };
  }

  /**
   * Main entry point
   */
  async run() {
    program
      .name('phoenix-migrate')
      .description('Phoenix Migration Tool - Migrate from diffs to slots')
      .version('1.0.0');

    // Migrate single user command
    program
      .command('migrate-user')
      .description('Migrate a single user\'s diffs to slot configuration')
      .requiredOption('-u, --user-id <id>', 'User ID to migrate')
      .option('-d, --dry-run', 'Perform dry run without saving changes')
      .option('-v, --verbose', 'Verbose output')
      .action(this.migrateUser.bind(this));

    // Batch migrate users
    program
      .command('migrate-batch')
      .description('Migrate multiple users in batch')
      .requiredOption('-f, --file <path>', 'File containing user IDs (one per line)')
      .option('-c, --concurrency <num>', 'Number of concurrent migrations', '5')
      .option('-d, --dry-run', 'Perform dry run without saving changes')
      .action(this.migrateBatch.bind(this));

    // Validate configuration
    program
      .command('validate')
      .description('Validate slot configuration')
      .requiredOption('-c, --config-file <path>', 'Configuration file to validate')
      .option('-s, --schema <path>', 'Custom schema file')
      .action(this.validateConfig.bind(this));

    // Rollout management
    program
      .command('rollout')
      .description('Manage phased rollout')
      .requiredOption('-p, --phase <phase>', 'Rollout phase: pilot|beta|production')
      .option('-r, --rollback', 'Rollback to previous version')
      .action(this.manageRollout.bind(this));

    // Statistics and reporting
    program
      .command('stats')
      .description('Show migration statistics')
      .option('-d, --detailed', 'Show detailed statistics')
      .action(this.showStatistics.bind(this));

    await program.parseAsync(process.argv);
  }

  /**
   * Migrate a single user's customizations
   */
  async migrateUser(options) {
    console.log(`🚀 Starting migration for user ${options.userId}`);
    
    try {
      // Step 1: Fetch user's current diffs
      console.log('📋 Fetching user diffs...');
      const userDiffs = await this.fetchUserDiffs(options.userId);
      
      if (!userDiffs || userDiffs.length === 0) {
        console.log('ℹ️ No diffs found for user');
        return;
      }

      console.log(`Found ${userDiffs.length} diffs to migrate`);

      // Step 2: Translate each diff to slot configuration
      console.log('🔄 Translating diffs to slot configuration...');
      const slotConfig = await this.translateDiffsToSlots(userDiffs);

      // Step 3: Validate the generated configuration
      console.log('✅ Validating generated configuration...');
      const validation = await this.validateSlotConfig(slotConfig);
      
      if (!validation.valid) {
        console.error('❌ Generated configuration is invalid:', validation.errors);
        this.results.errors++;
        return;
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ Configuration warnings:', validation.warnings);
        this.results.warnings += validation.warnings.length;
      }

      // Step 4: Save or preview the configuration
      if (options.dryRun) {
        console.log('🔍 DRY RUN - Configuration would be:');
        console.log(JSON.stringify(slotConfig, null, 2));
      } else {
        await this.saveUserSlotConfig(options.userId, slotConfig);
        await this.markDiffsAsMigrated(options.userId, userDiffs);
        console.log('✅ Migration completed successfully');
      }

      this.results.success++;

    } catch (error) {
      console.error(`❌ Migration failed for user ${options.userId}:`, error.message);
      this.results.errors++;
      
      if (options.verbose) {
        console.error(error.stack);
      }
    }
  }

  /**
   * Migrate multiple users in batch
   */
  async migrateBatch(options) {
    console.log(`🚀 Starting batch migration from file: ${options.file}`);
    
    try {
      // Read user IDs from file
      const fileContent = await fs.readFile(options.file, 'utf-8');
      const userIds = fileContent.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      console.log(`Found ${userIds.length} users to migrate`);

      // Process in batches with concurrency limit
      const concurrency = parseInt(options.concurrency);
      const batches = [];
      
      for (let i = 0; i < userIds.length; i += concurrency) {
        batches.push(userIds.slice(i, i + concurrency));
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} users)`);

        const promises = batch.map(userId => 
          this.migrateUser({ userId, dryRun: options.dryRun })
            .catch(error => {
              console.error(`Error migrating user ${userId}:`, error.message);
              this.results.errors++;
            })
        );

        await Promise.all(promises);
      }

      this.printSummary();

    } catch (error) {
      console.error('❌ Batch migration failed:', error.message);
    }
  }

  /**
   * Validate slot configuration
   */
  async validateConfig(options) {
    console.log(`🔍 Validating configuration: ${options.configFile}`);
    
    try {
      const configContent = await fs.readFile(options.configFile, 'utf-8');
      const config = JSON.parse(configContent);
      
      const validation = await this.validateSlotConfig(config);
      
      if (validation.valid) {
        console.log('✅ Configuration is valid');
        if (validation.warnings.length > 0) {
          console.warn('⚠️ Warnings:', validation.warnings);
        }
      } else {
        console.error('❌ Configuration is invalid:');
        validation.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Manage phased rollout
   */
  async manageRollout(options) {
    console.log(`🎯 Managing rollout for phase: ${options.phase}`);
    
    try {
      if (options.rollback) {
        await this.performRollback(options.phase);
      } else {
        await this.performRollout(options.phase);
      }

    } catch (error) {
      console.error(`❌ Rollout management failed:`, error.message);
      process.exit(1);
    }
  }

  /**
   * Show migration statistics
   */
  async showStatistics(options) {
    console.log('📊 Migration Statistics');
    console.log('========================');
    
    try {
      const stats = await this.gatherStatistics();
      
      console.log(`Total users: ${stats.totalUsers}`);
      console.log(`Migrated users: ${stats.migratedUsers} (${((stats.migratedUsers / stats.totalUsers) * 100).toFixed(1)}%)`);
      console.log(`Pending migrations: ${stats.pendingMigrations}`);
      console.log(`Failed migrations: ${stats.failedMigrations}`);
      console.log(`Average diffs per user: ${stats.averageDiffsPerUser.toFixed(1)}`);
      console.log(`Most customized component: ${stats.mostCustomizedComponent}`);
      
      if (options.detailed) {
        console.log('\nDetailed Breakdown:');
        console.log('-------------------');
        stats.componentBreakdown.forEach(comp => {
          console.log(`${comp.component}: ${comp.customizations} customizations`);
        });
      }

    } catch (error) {
      console.error('❌ Failed to gather statistics:', error.message);
    }
  }

  /**
   * Fetch user diffs from database
   */
  async fetchUserDiffs(userId) {
    // Simulate API call - in real implementation this would connect to your database
    console.log(`  → Fetching diffs for user ${userId}`);
    
    // Mock data - replace with actual database query
    return [
      {
        id: 1,
        filePath: 'src/components/storefront/ProductCard.jsx',
        diff: `--- a/src/components/storefront/ProductCard.jsx
+++ b/src/components/storefront/ProductCard.jsx
@@ -215,7 +215,7 @@ const ProductCard = ({ product, settings, className = "" }) => {
             >
               <ShoppingCart className="w-4 h-4 mr-2" />
-              Add to Cart
+              Buy Now
             </Button>`
      }
    ];
  }

  /**
   * Translate diffs to slot configuration
   */
  async translateDiffsToSlots(userDiffs) {
    const slotConfig = {
      version: '1.0',
      slots: {},
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'phoenix-migrate-cli'
      }
    };

    for (const diff of userDiffs) {
      console.log(`  → Translating ${diff.filePath}`);
      
      // Simulate diff translation - in real implementation use DiffToSlotTranslator
      const translation = this.simulateTranslation(diff);
      
      // Merge into slot config
      Object.assign(slotConfig.slots, translation.slots);
    }

    return slotConfig;
  }

  /**
   * Simulate diff translation (replace with actual DiffToSlotTranslator)
   */
  simulateTranslation(diff) {
    // Simple pattern matching for demo
    if (diff.diff.includes('Add to Cart') && diff.diff.includes('Buy Now')) {
      return {
        slots: {
          'product.card.add_to_cart': {
            enabled: true,
            order: 6,
            props: {
              text: 'Buy Now'
            }
          }
        }
      };
    }

    return { slots: {} };
  }

  /**
   * Validate slot configuration
   */
  async validateSlotConfig(config) {
    const errors = [];
    const warnings = [];

    // Basic validation
    if (!config.version) {
      warnings.push('Missing version field');
    }

    if (!config.slots || typeof config.slots !== 'object') {
      errors.push('Missing or invalid slots configuration');
    } else {
      // Validate each slot
      Object.entries(config.slots).forEach(([slotId, slotConfig]) => {
        if (!this.isValidSlotId(slotId)) {
          errors.push(`Invalid slot ID: ${slotId}`);
        }
        
        if (typeof slotConfig !== 'object') {
          errors.push(`Invalid configuration for slot ${slotId}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate slot ID format
   */
  isValidSlotId(slotId) {
    const parts = slotId.split('.');
    return parts.length >= 3 && parts.every(part => part.length > 0);
  }

  /**
   * Save user slot configuration
   */
  async saveUserSlotConfig(userId, slotConfig) {
    console.log(`  → Saving slot configuration for user ${userId}`);
    
    // In real implementation, save to database
    const configPath = path.join(__dirname, '..', '..', 'temp', `user-${userId}-slots.json`);
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(slotConfig, null, 2));
    
    console.log(`  ✅ Configuration saved to ${configPath}`);
  }

  /**
   * Mark diffs as migrated
   */
  async markDiffsAsMigrated(userId, diffs) {
    console.log(`  → Marking ${diffs.length} diffs as migrated`);
    // In real implementation, update database
  }

  /**
   * Perform rollout for a phase
   */
  async performRollout(phase) {
    const phaseConfig = {
      pilot: { percentage: 5, criteria: 'internal_users' },
      beta: { percentage: 25, criteria: 'beta_users' },
      production: { percentage: 100, criteria: 'all_users' }
    };

    const config = phaseConfig[phase];
    if (!config) {
      throw new Error(`Unknown phase: ${phase}`);
    }

    console.log(`Rolling out to ${config.percentage}% of users (${config.criteria})`);
    
    // In real implementation, update feature flags or database
    console.log('✅ Rollout completed successfully');
  }

  /**
   * Perform rollback
   */
  async performRollback(phase) {
    console.log(`Rolling back phase: ${phase}`);
    
    // In real implementation, restore previous configuration
    console.log('✅ Rollback completed successfully');
  }

  /**
   * Gather migration statistics
   */
  async gatherStatistics() {
    // Mock statistics - replace with actual database queries
    return {
      totalUsers: 1250,
      migratedUsers: 312,
      pendingMigrations: 938,
      failedMigrations: 23,
      averageDiffsPerUser: 3.2,
      mostCustomizedComponent: 'ProductCard',
      componentBreakdown: [
        { component: 'ProductCard', customizations: 892 },
        { component: 'MiniCart', customizations: 445 },
        { component: 'Checkout', customizations: 289 }
      ]
    };
  }

  /**
   * Print migration summary
   */
  printSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    console.log('\n📊 Migration Summary');
    console.log('===================');
    console.log(`Duration: ${duration}s`);
    console.log(`Successful: ${this.results.success}`);
    console.log(`Errors: ${this.results.errors}`);
    console.log(`Warnings: ${this.results.warnings}`);
    
    if (this.results.errors > 0) {
      console.log('❌ Some migrations failed. Check logs above.');
      process.exit(1);
    } else {
      console.log('✅ All migrations completed successfully');
    }
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new PhoenixMigrationCLI();
  cli.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = PhoenixMigrationCLI;