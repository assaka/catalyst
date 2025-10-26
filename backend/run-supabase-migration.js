#!/usr/bin/env node

/**
 * Supabase Performance Indexes Migration
 *
 * Run this to add performance indexes directly to your Supabase database
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const indexes = [
  {
    name: 'idx_products_slug',
    sql: 'CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);',
    description: 'Index on product slug for fast lookups'
  },
  {
    name: 'idx_products_sku',
    sql: 'CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);',
    description: 'Index on product SKU for fast lookups'
  },
  {
    name: 'idx_products_category_ids',
    sql: 'CREATE INDEX IF NOT EXISTS idx_products_category_ids ON products USING GIN (category_ids);',
    description: 'GIN index on category_ids JSONB for containment queries'
  },
  {
    name: 'idx_products_active_visible',
    sql: `CREATE INDEX IF NOT EXISTS idx_products_active_visible ON products(store_id, status, visibility) WHERE status = 'active' AND visibility = 'visible';`,
    description: 'Partial index for active visible products by store'
  },
  {
    name: 'idx_products_stock',
    sql: 'CREATE INDEX IF NOT EXISTS idx_products_stock ON products(manage_stock, stock_quantity, infinite_stock) WHERE manage_stock = true;',
    description: 'Index for stock filtering'
  },
  {
    name: 'idx_categories_slug',
    sql: 'CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);',
    description: 'Index on category slug for fast lookups'
  },
  {
    name: 'idx_categories_active_menu',
    sql: `CREATE INDEX IF NOT EXISTS idx_categories_active_menu ON categories(store_id, is_active, hide_in_menu, sort_order) WHERE is_active = true AND hide_in_menu = false;`,
    description: 'Partial index for active visible categories by store'
  },
  {
    name: 'idx_product_translations_search',
    sql: `CREATE INDEX IF NOT EXISTS idx_product_translations_search ON product_translations USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));`,
    description: 'Full-text search index on product translations'
  },
  {
    name: 'idx_product_translations_name',
    sql: 'CREATE INDEX IF NOT EXISTS idx_product_translations_name ON product_translations(name);',
    description: 'Index on product translations name for ILIKE queries'
  },
  {
    name: 'idx_category_translations_name',
    sql: 'CREATE INDEX IF NOT EXISTS idx_category_translations_name ON category_translations(name);',
    description: 'Index on category translations for search'
  },
  {
    name: 'idx_product_attribute_values_product',
    sql: 'CREATE INDEX IF NOT EXISTS idx_product_attribute_values_product ON product_attribute_values(product_id, attribute_id);',
    description: 'Index for product attribute lookups'
  },
  {
    name: 'idx_product_attribute_values_value',
    sql: 'CREATE INDEX IF NOT EXISTS idx_product_attribute_values_value ON product_attribute_values(attribute_id, value_id);',
    description: 'Index for attribute filtering'
  }
];

async function runMigration() {
  console.log('🚀 Starting Supabase Performance Indexes Migration\n');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}\n`);

  // Check if we need to use PostgreSQL client directly
  const { Client } = require('pg');
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env');
    console.error('Please add your Supabase PostgreSQL connection string');
    console.error('Format: postgresql://postgres:[password]@[host]:5432/postgres');
    process.exit(1);
  }

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database\n');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const index of indexes) {
    try {
      console.log(`📊 Creating: ${index.name}`);
      console.log(`   ${index.description}`);

      await client.query(index.sql);
      console.log(`   ✅ Created\n`);
      created++;
    } catch (error) {
      // Check if error is because index already exists
      if (error.message.includes('already exists')) {
        console.log(`   ⏭️  Already exists\n`);
        skipped++;
      } else {
        console.log(`   ❌ Failed: ${error.message}\n`);
        failed++;
      }
    }
  }

  console.log('===========================================');
  console.log('📊 Migration Summary');
  console.log('===========================================');
  console.log(`✅ Created: ${created}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`📝 Total:   ${indexes.length}`);

  if (failed === 0) {
    console.log('\n🎉 Migration completed successfully!');
  } else {
    console.log('\n⚠️  Some indexes failed to create.');
  }

  // Verify indexes
  console.log('\n===========================================');
  console.log('🔍 Verifying Indexes');
  console.log('===========================================\n');

  try {
    const result = await client.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename IN ('products', 'categories', 'product_translations', 'category_translations', 'product_attribute_values')
        AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);

    if (result.rows && result.rows.length > 0) {
      const grouped = {};
      result.rows.forEach(row => {
        if (!grouped[row.tablename]) grouped[row.tablename] = [];
        grouped[row.tablename].push(row.indexname);
      });

      Object.entries(grouped).forEach(([table, idxs]) => {
        console.log(`${table}:`);
        idxs.forEach(idx => console.log(`  ✓ ${idx}`));
        console.log('');
      });

      console.log(`Total indexes: ${result.rows.length}`);
    } else {
      console.log('No indexes found (this may indicate an issue)');
    }
  } catch (error) {
    console.log('⚠️  Could not verify indexes:', error.message);
  } finally {
    await client.end();
  }

  console.log('\n===========================================');
  process.exit(failed > 0 ? 1 : 0);
}

runMigration().catch(error => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});
