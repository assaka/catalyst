#!/usr/bin/env node

/**
 * Baseline Population Script
 * Scans source files and stores them as baselines for patch system
 * Usage: node scripts/populate-baselines.js [--store-id=uuid] [--version=version]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { glob } = require('glob');
const { sequelize } = require('../backend/src/database/connection');

class BaselinePopulator {
  constructor() {
    this.DEFAULT_STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';
    this.DEFAULT_VERSION = 'latest';
    this.SOURCE_PATTERNS = [
      'src/**/*.jsx',
      'src/**/*.js', 
      'src/**/*.tsx',
      'src/**/*.ts',
      'src/**/*.vue',
      'src/**/*.css',
      'src/**/*.scss',
      'src/**/*.less'
    ];
    this.stats = {
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };
  }

  /**
   * Generate SHA256 hash for file content
   */
  generateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get file type from extension
   */
  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const typeMap = {
      '.jsx': 'jsx',
      '.js': 'js',
      '.tsx': 'tsx', 
      '.ts': 'ts',
      '.vue': 'vue',
      '.css': 'css',
      '.scss': 'scss',
      '.less': 'less'
    };
    return typeMap[ext] || 'unknown';
  }

  /**
   * Normalize file path for cross-platform compatibility
   */
  normalizePath(filePath) {
    return filePath.replace(/\\/g, '/');
  }

  /**
   * Check if baseline already exists and is up-to-date
   */
  async checkExistingBaseline(storeId, filePath, codeHash, version) {
    try {
      const [existing] = await sequelize.query(`
        SELECT code_hash, last_modified 
        FROM file_baselines 
        WHERE store_id = :storeId 
          AND file_path = :filePath 
          AND version = :version
        LIMIT 1
      `, {
        replacements: { storeId, filePath, version },
        type: sequelize.QueryTypes.SELECT
      });

      return existing && existing.code_hash === codeHash ? existing : null;
    } catch (error) {
      console.error(`❌ Error checking existing baseline for ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Create or update baseline for a single file
   */
  async processFile(filePath, storeId, version) {
    try {
      this.stats.processed++;
      
      // Read file content
      const fullPath = path.resolve(filePath);
      if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        this.stats.skipped++;
        return;
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      const normalizedPath = this.normalizePath(filePath);
      const codeHash = this.generateHash(content);
      const fileType = this.getFileType(filePath);
      const fileSize = content.length;

      // Check if baseline already exists and is current
      const existing = await this.checkExistingBaseline(storeId, normalizedPath, codeHash, version);
      if (existing) {
        console.log(`✅ ${normalizedPath} (unchanged)`);
        this.stats.skipped++;
        return;
      }

      // Insert or update baseline
      const [result] = await sequelize.query(`
        INSERT INTO file_baselines (
          store_id, file_path, baseline_code, code_hash, version, 
          file_type, file_size, last_modified
        ) VALUES (
          :storeId, :filePath, :baselineCode, :codeHash, :version,
          :fileType, :fileSize, CURRENT_TIMESTAMP
        )
        ON CONFLICT (store_id, file_path, version) 
        DO UPDATE SET
          baseline_code = EXCLUDED.baseline_code,
          code_hash = EXCLUDED.code_hash,
          file_type = EXCLUDED.file_type,
          file_size = EXCLUDED.file_size,
          last_modified = CURRENT_TIMESTAMP
        RETURNING id, (xmax = 0) AS inserted
      `, {
        replacements: {
          storeId,
          filePath: normalizedPath,
          baselineCode: content,
          codeHash,
          version,
          fileType,
          fileSize
        },
        type: sequelize.QueryTypes.SELECT
      });

      const isInsert = result.inserted;
      if (isInsert) {
        console.log(`📄 ${normalizedPath} (created - ${fileSize} chars)`);
        this.stats.created++;
      } else {
        console.log(`📝 ${normalizedPath} (updated - ${fileSize} chars)`);
        this.stats.updated++;
      }

    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      this.stats.errors++;
    }
  }

  /**
   * Find all source files matching patterns
   */
  async findSourceFiles() {
    try {
      console.log('🔍 Finding source files...');
      
      const allFiles = [];
      for (const pattern of this.SOURCE_PATTERNS) {
        const files = await glob(pattern, { 
          cwd: process.cwd(),
          ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**']
        });
        allFiles.push(...files);
      }

      // Remove duplicates and sort
      const uniqueFiles = [...new Set(allFiles)].sort();
      console.log(`📋 Found ${uniqueFiles.length} source files`);
      
      return uniqueFiles;
    } catch (error) {
      console.error('❌ Error finding source files:', error.message);
      return [];
    }
  }

  /**
   * Populate baselines for all source files
   */
  async populateBaselines(storeId = this.DEFAULT_STORE_ID, version = this.DEFAULT_VERSION) {
    console.log('🚀 Starting baseline population...');
    console.log(`   Store ID: ${storeId}`);
    console.log(`   Version: ${version}`);
    
    try {
      // Test database connection
      await sequelize.authenticate();
      console.log('✅ Database connection verified');

      // Find all source files
      const sourceFiles = await this.findSourceFiles();
      if (sourceFiles.length === 0) {
        console.log('⚠️  No source files found');
        return;
      }

      // Process each file
      console.log(`\n📦 Processing ${sourceFiles.length} files...`);
      for (let i = 0; i < sourceFiles.length; i++) {
        const file = sourceFiles[i];
        const progress = `[${i + 1}/${sourceFiles.length}]`;
        process.stdout.write(`${progress} `);
        await this.processFile(file, storeId, version);
      }

      // Print final statistics
      console.log('\n🎯 Baseline population complete!');
      console.log(`📊 Statistics:`);
      console.log(`   Files processed: ${this.stats.processed}`);
      console.log(`   Baselines created: ${this.stats.created}`);
      console.log(`   Baselines updated: ${this.stats.updated}`);
      console.log(`   Files skipped: ${this.stats.skipped}`);
      console.log(`   Errors: ${this.stats.errors}`);

      if (this.stats.errors > 0) {
        console.log('⚠️  Some files had errors - check logs above');
        process.exit(1);
      } else {
        console.log('✅ All files processed successfully');
      }

    } catch (error) {
      console.error('❌ Fatal error during baseline population:', error.message);
      process.exit(1);
    }
  }

  /**
   * Clean up orphaned baselines (files that no longer exist)
   */
  async cleanupOrphanedBaselines(storeId = this.DEFAULT_STORE_ID, version = this.DEFAULT_VERSION) {
    try {
      console.log('🧹 Cleaning up orphaned baselines...');

      // Get all baselines from database
      const [existingBaselines] = await sequelize.query(`
        SELECT file_path FROM file_baselines 
        WHERE store_id = :storeId AND version = :version
      `, {
        replacements: { storeId, version },
        type: sequelize.QueryTypes.SELECT
      });

      let cleaned = 0;
      for (const baseline of existingBaselines) {
        const filePath = baseline.file_path;
        const fullPath = path.resolve(filePath);
        
        if (!fs.existsSync(fullPath)) {
          console.log(`🗑️  Removing orphaned baseline: ${filePath}`);
          await sequelize.query(`
            DELETE FROM file_baselines 
            WHERE store_id = :storeId AND file_path = :filePath AND version = :version
          `, {
            replacements: { storeId, filePath, version }
          });
          cleaned++;
        }
      }

      console.log(`✅ Cleaned up ${cleaned} orphaned baselines`);
    } catch (error) {
      console.error('❌ Error cleaning up orphaned baselines:', error.message);
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    storeId: null,
    version: 'latest',
    cleanup: false
  };

  for (const arg of args) {
    if (arg.startsWith('--store-id=')) {
      options.storeId = arg.split('=')[1];
    } else if (arg.startsWith('--version=')) {
      options.version = arg.split('=')[1];
    } else if (arg === '--cleanup') {
      options.cleanup = true;
    } else if (arg === '--help') {
      console.log(`
📚 Baseline Population Script Usage:

  node scripts/populate-baselines.js [options]

Options:
  --store-id=<uuid>   Store ID to populate baselines for
  --version=<version> Version name for baselines (default: latest)
  --cleanup           Remove orphaned baselines for files that no longer exist
  --help              Show this help message

Examples:
  node scripts/populate-baselines.js
  node scripts/populate-baselines.js --store-id=abc-123 --version=v2.0.0
  node scripts/populate-baselines.js --cleanup
`);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();
  const populator = new BaselinePopulator();

  try {
    if (options.cleanup) {
      await populator.cleanupOrphanedBaselines(options.storeId, options.version);
    }
    
    await populator.populateBaselines(options.storeId, options.version);
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    try {
      await sequelize.close();
    } catch (error) {
      // Ignore connection close errors
    }
  }
}

// Run script if called directly
if (require.main === module) {
  main();
}

module.exports = BaselinePopulator;