/**
 * Comprehensive Translation Audit Script
 *
 * This script:
 * 1. Scans all frontend code for t('key', 'fallback value') usage
 * 2. Extracts both the key AND the fallback value
 * 3. Compares with actual database translations
 * 4. Reports mismatches where:
 *    - Key doesn't exist in database
 *    - Key exists but value doesn't match fallback
 *    - Multiple keys have same value (duplicates)
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

// Regex to match t('key') or t('key', 'fallback') or t("key", "fallback")
const tFunctionRegex = /t\s*\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]*)['"]\s*)?\)/g;

// Scan directory for .jsx, .js, .tsx, .ts files
function scanDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and .git
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'build') {
        scanDirectory(filePath, fileList);
      }
    } else if (/\.(jsx|js|tsx|ts)$/.test(file)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Extract all t() calls from a file
function extractTranslationCalls(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = [];
  let match;

  while ((match = tFunctionRegex.exec(content)) !== null) {
    const [fullMatch, key, fallbackValue] = match;
    matches.push({
      file: filePath.replace(/\\/g, '/'),
      key,
      fallbackValue: fallbackValue || null,
      fullMatch
    });
  }

  return matches;
}

async function runAudit() {
  console.log('🔍 Starting Comprehensive Translation Audit...\n');

  // Step 1: Scan all frontend files
  console.log('📂 Scanning frontend files...');
  const srcDir = path.join(__dirname, '..', 'src');
  const files = scanDirectory(srcDir);
  console.log(`✅ Found ${files.length} files to scan\n`);

  // Step 2: Extract all t() usage
  console.log('🔎 Extracting translation keys from code...');
  let allTranslationCalls = [];
  files.forEach(file => {
    const calls = extractTranslationCalls(file);
    allTranslationCalls = allTranslationCalls.concat(calls);
  });

  console.log(`✅ Found ${allTranslationCalls.length} translation calls in code\n`);

  // Get unique keys with their fallback values
  const codeKeys = new Map();
  allTranslationCalls.forEach(call => {
    if (!codeKeys.has(call.key)) {
      codeKeys.set(call.key, {
        key: call.key,
        fallbackValue: call.fallbackValue,
        usages: []
      });
    }
    codeKeys.get(call.key).usages.push({
      file: call.file.replace(__dirname, ''),
      fallback: call.fallbackValue
    });
  });

  console.log(`📊 Unique keys used in code: ${codeKeys.size}\n`);

  // Step 3: Get all translations from database
  console.log('💾 Fetching translations from database...');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const result = await client.query(`
    SELECT DISTINCT key, value, language_code, category
    FROM translations
    WHERE language_code = 'en'
    ORDER BY key
  `);

  const dbKeys = new Map();
  result.rows.forEach(row => {
    dbKeys.set(row.key, {
      key: row.key,
      value: row.value,
      category: row.category
    });
  });

  console.log(`✅ Found ${dbKeys.size} unique keys in database (EN)\n`);

  // Step 4: Analyze mismatches
  console.log('🔍 Analyzing mismatches...\n');

  const missingInDb = [];
  const valueMismatches = [];
  const perfectMatches = [];

  for (const [key, codeData] of codeKeys) {
    const dbData = dbKeys.get(key);

    if (!dbData) {
      missingInDb.push({
        key,
        fallbackValue: codeData.fallbackValue,
        usageCount: codeData.usages.length,
        files: codeData.usages.slice(0, 3).map(u => u.file) // Show first 3 files
      });
    } else if (codeData.fallbackValue && dbData.value !== codeData.fallbackValue) {
      // Check if it's just punctuation difference
      const codeValueNorm = (codeData.fallbackValue || '').trim().replace(/[.!?]+$/, '');
      const dbValueNorm = (dbData.value || '').trim().replace(/[.!?]+$/, '');

      if (codeValueNorm !== dbValueNorm) {
        valueMismatches.push({
          key,
          codeValue: codeData.fallbackValue,
          dbValue: dbData.value,
          category: dbData.category,
          usageCount: codeData.usages.length
        });
      } else {
        perfectMatches.push(key);
      }
    } else {
      perfectMatches.push(key);
    }
  }

  // Step 5: Find unused keys in database
  const unusedInCode = [];
  for (const [key, dbData] of dbKeys) {
    if (!codeKeys.has(key)) {
      unusedInCode.push({
        key,
        value: dbData.value,
        category: dbData.category
      });
    }
  }

  // Step 6: Find duplicate values
  const valueMap = new Map();
  for (const [key, dbData] of dbKeys) {
    if (!valueMap.has(dbData.value)) {
      valueMap.set(dbData.value, []);
    }
    valueMap.get(dbData.value).push(key);
  }

  const duplicateValues = [];
  for (const [value, keys] of valueMap) {
    if (keys.length > 1) {
      duplicateValues.push({
        value: value.substring(0, 60) + (value.length > 60 ? '...' : ''),
        keys,
        count: keys.length
      });
    }
  }

  // Generate Report
  console.log('═══════════════════════════════════════════════════════════');
  console.log('          TRANSLATION AUDIT REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📊 Summary:`);
  console.log(`   ✅ Perfect matches: ${perfectMatches.length}`);
  console.log(`   ❌ Missing in DB: ${missingInDb.length}`);
  console.log(`   ⚠️  Value mismatches: ${valueMismatches.length}`);
  console.log(`   🗑️  Unused in code: ${unusedInCode.length}`);
  console.log(`   🔄 Duplicate values: ${duplicateValues.length}\n`);

  if (missingInDb.length > 0) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('❌ KEYS USED IN CODE BUT MISSING IN DATABASE');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.table(missingInDb.slice(0, 20)); // Show first 20
    if (missingInDb.length > 20) {
      console.log(`... and ${missingInDb.length - 20} more\n`);
    }
  }

  if (valueMismatches.length > 0) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('⚠️  KEYS WITH VALUE MISMATCHES');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.table(valueMismatches.slice(0, 20));
    if (valueMismatches.length > 20) {
      console.log(`... and ${valueMismatches.length - 20} more\n`);
    }
  }

  if (duplicateValues.length > 0) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔄 DUPLICATE VALUES (Multiple keys, same text)');
    console.log('═══════════════════════════════════════════════════════════\n');
    const sorted = duplicateValues.sort((a, b) => b.count - a.count);
    console.table(sorted.slice(0, 30));
    if (sorted.length > 30) {
      console.log(`... and ${sorted.length - 30} more\n`);
    }
  }

  // Save detailed report to file
  const reportData = {
    summary: {
      perfectMatches: perfectMatches.length,
      missingInDb: missingInDb.length,
      valueMismatches: valueMismatches.length,
      unusedInCode: unusedInCode.length,
      duplicateValues: duplicateValues.length
    },
    missingInDb,
    valueMismatches,
    duplicateValues: duplicateValues.sort((a, b) => b.count - a.count),
    unusedInCode: unusedInCode.slice(0, 100) // Limit to first 100
  };

  fs.writeFileSync(
    path.join(__dirname, '..', 'TRANSLATION_AUDIT_REPORT.json'),
    JSON.stringify(reportData, null, 2)
  );

  console.log('═══════════════════════════════════════════════════════════');
  console.log('💾 Detailed report saved to: TRANSLATION_AUDIT_REPORT.json');
  console.log('═══════════════════════════════════════════════════════════\n');

  await client.end();
}

runAudit().catch(err => {
  console.error('❌ Audit failed:', err);
  process.exit(1);
});
