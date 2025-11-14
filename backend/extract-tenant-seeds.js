/**
 * Extract seed data from existing tenant database
 * Generates INSERT statements for default data
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

const SEED_TABLES = [
  'admin_navigation_registry',
  'cms_pages',
  'cms_page_translations',
  'cookie_consent_settings',
  'cookie_consent_settings_translations',
  'email_templates',
  'email_template_translations',
  'languages',
  'payment_methods',
  'payment_method_translations',
  'pdf_templates',
  'pdf_template_translations',
  'shipping_methods',
  'shipping_method_translations',
  'translations'
];

async function extractSeeds() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to tenant database\n');

    const insertStatements = [];

    for (const tableName of SEED_TABLES) {
      console.log(`Extracting data from: ${tableName}...`);

      try {
        // Get all columns
        const columnsResult = await client.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);

        const columns = columnsResult.rows.map(r => r.column_name);

        // Get all data
        const dataResult = await client.query(`SELECT * FROM ${tableName}`);

        if (dataResult.rows.length === 0) {
          console.log(`  → No data (skipping)`);
          continue;
        }

        console.log(`  → Found ${dataResult.rows.length} rows`);

        // Generate INSERT statements
        const values = [];

        for (const row of dataResult.rows) {
          const valuesList = columns.map(col => {
            const value = row[col];

            if (value === null) {
              return 'NULL';
            } else if (typeof value === 'string') {
              // Escape single quotes
              const escaped = value.replace(/'/g, "''");
              return `'${escaped}'`;
            } else if (typeof value === 'boolean') {
              return value ? 'true' : 'false';
            } else if (typeof value === 'object') {
              // JSONB
              const escaped = JSON.stringify(value).replace(/'/g, "''");
              return `'${escaped}'::jsonb`;
            } else if (value instanceof Date) {
              return `'${value.toISOString()}'`;
            } else {
              return value;
            }
          });

          values.push(`  (${valuesList.join(', ')})`);
        }

        const insertStmt = `-- ${tableName} (${dataResult.rows.length} rows)\n` +
                          `INSERT INTO ${tableName} (${columns.join(', ')})\nVALUES\n` +
                          values.join(',\n') +
                          '\nON CONFLICT DO NOTHING;\n';

        insertStatements.push(insertStmt);

      } catch (tableError) {
        console.log(`  → Error: ${tableError.message} (skipping)`);
      }
    }

    // Write to file
    const output = `-- ============================================
-- TENANT DATABASE SEED DATA
-- Default data for new tenant databases
-- Auto-generated from existing database
-- ============================================

-- Tables with seed data:
${SEED_TABLES.map(t => `--   - ${t}`).join('\n')}

-- ============================================
-- SEED DATA
-- ============================================

${insertStatements.join('\n\n')}

-- ============================================
-- SEED DATA COMPLETE
-- ${insertStatements.length} tables seeded
-- ============================================
`;

    fs.writeFileSync(
      'src/database/schemas/tenant/002-tenant-seed-data.sql',
      output
    );

    console.log(`\n✅ Seed data extracted to: backend/src/database/schemas/tenant/002-tenant-seed-data.sql`);
    console.log(`Tables with data: ${insertStatements.length}`);

    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

extractSeeds();
