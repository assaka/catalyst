#!/usr/bin/env node

/**
 * Translation Text Extraction Script
 *
 * This script scans your codebase for translatable text strings and generates:
 * 1. A JSON file with all extracted strings
 * 2. A SQL migration to seed the translations table
 * 3. A summary report
 *
 * Usage:
 *   node scripts/extract-translations.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Directories to scan
  scanDirs: [
    'src/pages',
    'src/components',
  ],

  // File extensions to scan
  extensions: ['.jsx', '.js', '.tsx', '.ts'],

  // Patterns to extract
  patterns: [
    // Button text, labels, placeholders
    /(?:placeholder|label|title|aria-label)=["']([^"']+)["']/gi,

    // Text content in JSX
    />([A-Z][^<>{}&]+)</g,

    // Common UI patterns
    /(?:button|Button).*?>([^<>{}&]+)</gi,
    /(?:span|div|p|h[1-6]).*?>([^<>{}&]+)</gi,

    // Error/success messages
    /(?:message|text|error|success):\s*["']([^"']+)["']/gi,
  ],

  // Words/phrases to ignore
  ignore: [
    // Technical terms
    'API', 'HTTP', 'URL', 'ID', 'UUID', 'JSON', 'SQL',

    // Single letters or numbers
    /^[a-z0-9]$/i,

    // Code-like strings
    /^[a-z_]+$/,  // snake_case variables
    /^\$\{.*\}$/, // template literals
    /^\d+$/,      // numbers only

    // Common JSX props
    'className', 'onClick', 'onChange', 'onSubmit',
  ],

  // Output files
  outputDir: 'scripts/output',
  translationsJson: 'extracted-translations.json',
  migrationSql: 'seed-translations.sql',
  reportTxt: 'extraction-report.txt',
};

// Categories for organizing translations
const CATEGORIES = {
  common: ['add', 'edit', 'delete', 'save', 'cancel', 'submit', 'close', 'back', 'next', 'previous', 'search', 'filter', 'sort', 'loading', 'error', 'success', 'warning'],
  navigation: ['home', 'dashboard', 'products', 'categories', 'orders', 'customers', 'settings', 'logout', 'profile'],
  product: ['price', 'stock', 'sku', 'description', 'image', 'variant', 'attribute', 'category'],
  checkout: ['cart', 'checkout', 'payment', 'shipping', 'billing', 'order', 'total', 'subtotal', 'tax'],
  account: ['login', 'register', 'password', 'email', 'username', 'profile', 'account'],
  admin: ['manage', 'create', 'update', 'delete', 'view', 'list', 'details'],
};

// Store for extracted strings
const extractedStrings = new Map();
let fileCount = 0;
let stringCount = 0;

/**
 * Check if a string should be ignored
 */
function shouldIgnore(text) {
  if (!text || typeof text !== 'string') return true;

  const trimmed = text.trim();

  // Too short or too long
  if (trimmed.length < 2 || trimmed.length > 200) return true;

  // Contains code patterns
  if (trimmed.includes('function') ||
      trimmed.includes('=>') ||
      trimmed.includes('const ') ||
      trimmed.includes('import ') ||
      trimmed.includes('export ')) {
    return true;
  }

  // Check ignore list
  for (const ignorePattern of CONFIG.ignore) {
    if (ignorePattern instanceof RegExp) {
      if (ignorePattern.test(trimmed)) return true;
    } else if (trimmed === ignorePattern) {
      return true;
    }
  }

  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(trimmed)) return true;

  return false;
}

/**
 * Determine category for a string
 */
function determineCategory(text) {
  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }

  return 'common';
}

/**
 * Generate a key from text
 */
function generateKey(text, category) {
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 50);

  return `${category}.${cleaned}`;
}

/**
 * Scan a file for translatable strings
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(process.cwd(), filePath);

    let fileStrings = 0;

    for (const pattern of CONFIG.patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(content)) !== null) {
        const text = match[1];

        if (shouldIgnore(text)) continue;

        const trimmed = text.trim();
        const category = determineCategory(trimmed);
        const key = generateKey(trimmed, category);

        if (!extractedStrings.has(key)) {
          extractedStrings.set(key, {
            key,
            value: trimmed,
            category,
            files: [relativePath],
          });
          fileStrings++;
          stringCount++;
        } else {
          // Add file reference
          const existing = extractedStrings.get(key);
          if (!existing.files.includes(relativePath)) {
            existing.files.push(relativePath);
          }
        }
      }
    }

    if (fileStrings > 0) {
      console.log(`  ✓ ${relativePath}: ${fileStrings} strings`);
    }

    return fileStrings;
  } catch (error) {
    console.error(`  ✗ Error scanning ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and build directories
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') {
        continue;
      }
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (CONFIG.extensions.includes(ext)) {
        fileCount++;
        scanFile(fullPath);
      }
    }
  }
}

/**
 * Generate JSON output
 */
function generateJSON() {
  const output = {
    generated: new Date().toISOString(),
    totalStrings: extractedStrings.size,
    categories: {},
  };

  // Group by category
  for (const [key, data] of extractedStrings.entries()) {
    if (!output.categories[data.category]) {
      output.categories[data.category] = [];
    }
    output.categories[data.category].push({
      key: data.key,
      value: data.value,
      files: data.files,
    });
  }

  return JSON.stringify(output, null, 2);
}

/**
 * Generate SQL migration
 */
function generateSQL() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

  let sql = `-- Translation Seeds Migration
-- Generated: ${new Date().toISOString()}
-- Total strings: ${extractedStrings.size}

BEGIN;

-- Insert UI labels for English (en)
INSERT INTO translations (key, language_code, value, category, created_at, updated_at)
VALUES\n`;

  const values = [];
  for (const [key, data] of extractedStrings.entries()) {
    const escapedKey = data.key.replace(/'/g, "''");
    const escapedValue = data.value.replace(/'/g, "''");
    const escapedCategory = data.category.replace(/'/g, "''");

    values.push(`  ('${escapedKey}', 'en', '${escapedValue}', '${escapedCategory}', NOW(), NOW())`);
  }

  sql += values.join(',\n');
  sql += `\nON CONFLICT (key, language_code) DO UPDATE
  SET value = EXCLUDED.value,
      category = EXCLUDED.category,
      updated_at = NOW();

COMMIT;

-- Summary:
-- Total translations: ${extractedStrings.size}
`;

  // Add category breakdown
  const categoryCount = {};
  for (const [, data] of extractedStrings.entries()) {
    categoryCount[data.category] = (categoryCount[data.category] || 0) + 1;
  }

  sql += `-- By category:\n`;
  for (const [category, count] of Object.entries(categoryCount).sort((a, b) => b[1] - a[1])) {
    sql += `--   ${category}: ${count}\n`;
  }

  return sql;
}

/**
 * Generate report
 */
function generateReport() {
  const categoryCount = {};
  for (const [, data] of extractedStrings.entries()) {
    categoryCount[data.category] = (categoryCount[data.category] || 0) + 1;
  }

  let report = `Translation Extraction Report
Generated: ${new Date().toISOString()}

========================================
SUMMARY
========================================
Files scanned: ${fileCount}
Unique strings found: ${extractedStrings.size}
Total string occurrences: ${stringCount}

========================================
BY CATEGORY
========================================
`;

  for (const [category, count] of Object.entries(categoryCount).sort((a, b) => b[1] - a[1])) {
    report += `${category.padEnd(15)} ${count}\n`;
  }

  report += `\n========================================
TOP 20 STRINGS
========================================
`;

  let i = 0;
  for (const [key, data] of extractedStrings.entries()) {
    if (i++ >= 20) break;
    report += `\nKey: ${data.key}\n`;
    report += `Value: ${data.value}\n`;
    report += `Category: ${data.category}\n`;
    report += `Files: ${data.files.length}\n`;
  }

  report += `\n========================================
NEXT STEPS
========================================
1. Review the extracted strings in: ${CONFIG.translationsJson}
2. Run the migration to seed the database: ${CONFIG.migrationSql}
3. Use the admin Translations page to manage and translate strings
4. Replace hardcoded strings in code with t() function calls

Example:
  Before: <button>Save Changes</button>
  After:  <button>{t('common.save_changes')}</button>
`;

  return report;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Translation Text Extraction Tool\n');
  console.log('📂 Scanning directories...\n');

  // Create output directory
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // Scan directories
  for (const dir of CONFIG.scanDirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`📁 Scanning: ${dir}`);
      scanDirectory(fullPath);
    } else {
      console.log(`⚠️  Directory not found: ${dir}`);
    }
  }

  console.log(`\n✅ Scan complete!`);
  console.log(`   Files scanned: ${fileCount}`);
  console.log(`   Strings found: ${extractedStrings.size}\n`);

  // Generate outputs
  console.log('📝 Generating outputs...\n');

  const jsonPath = path.join(CONFIG.outputDir, CONFIG.translationsJson);
  fs.writeFileSync(jsonPath, generateJSON());
  console.log(`  ✓ JSON: ${jsonPath}`);

  const sqlPath = path.join(CONFIG.outputDir, CONFIG.migrationSql);
  fs.writeFileSync(sqlPath, generateSQL());
  console.log(`  ✓ SQL: ${sqlPath}`);

  const reportPath = path.join(CONFIG.outputDir, CONFIG.reportTxt);
  fs.writeFileSync(reportPath, generateReport());
  console.log(`  ✓ Report: ${reportPath}`);

  console.log('\n🎉 Extraction complete!\n');
  console.log('📋 Next steps:');
  console.log('   1. Review extracted strings in:', CONFIG.translationsJson);
  console.log('   2. Run SQL migration:', CONFIG.migrationSql);
  console.log('   3. Visit /admin/translations to manage translations');
  console.log('   4. Use AI Translate All button to translate to other languages\n');
}

// Run
main();
