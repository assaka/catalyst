/**
 * Extract all table schemas from existing tenant database
 * Generates CREATE TABLE statements for tenant migration
 */

require('dotenv').config();
const { Client } = require('pg');

async function extractSchemas() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to tenant database\n');

    // Get all tables
    const tablesResult = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
      ORDER BY tablename
    `);

    console.log(`Found ${tablesResult.rows.length} tables:\n`);

    const createStatements = [];

    for (const table of tablesResult.rows) {
      const tableName = table.tablename;
      console.log(`Extracting: ${tableName}...`);

      // Get table structure
      const schemaResult = await client.query(`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          column_default,
          is_nullable,
          udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      // Get primary key
      const pkResult = await client.query(`
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass
        AND i.indisprimary
      `, [tableName]);

      const primaryKey = pkResult.rows.map(r => r.attname);

      // Generate CREATE TABLE statement
      let createTable = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;

      const columns = [];
      for (const col of schemaResult.rows) {
        let colDef = `  ${col.column_name} `;

        // Data type
        if (col.data_type === 'USER-DEFINED') {
          colDef += col.udt_name;
        } else if (col.data_type === 'character varying') {
          colDef += `VARCHAR(${col.character_maximum_length || 255})`;
        } else if (col.data_type === 'timestamp without time zone') {
          colDef += 'TIMESTAMP';
        } else {
          colDef += col.data_type.toUpperCase();
        }

        // Primary key
        if (primaryKey.includes(col.column_name)) {
          colDef += ' PRIMARY KEY';
        }

        // Default
        if (col.column_default) {
          if (col.column_default.includes('uuid') || col.column_default.includes('gen_random')) {
            colDef += ' DEFAULT gen_random_uuid()';
          } else if (col.column_default.includes('now()') || col.column_default.includes('CURRENT_TIMESTAMP')) {
            colDef += ' DEFAULT NOW()';
          } else if (!col.column_default.includes('nextval')) {
            colDef += ` DEFAULT ${col.column_default}`;
          }
        }

        // Nullable
        if (col.is_nullable === 'NO' && !primaryKey.includes(col.column_name)) {
          colDef += ' NOT NULL';
        }

        columns.push(colDef);
      }

      createTable += columns.join(',\n');
      createTable += '\n);\n';

      createStatements.push(createTable);
    }

    // Write to file
    const fs = require('fs');
    const output = `-- ============================================
-- TENANT DATABASE COMPLETE SCHEMA
-- Auto-generated from existing database
-- ============================================

${createStatements.join('\n')}

-- ============================================
-- SCHEMA EXTRACTION COMPLETE
-- ${createStatements.length} tables
-- ============================================
`;

    fs.writeFileSync(
      'src/database/schemas/tenant/001-create-tenant-tables-complete.sql',
      output
    );

    console.log(`\n✅ Schema extracted to: backend/src/database/schemas/tenant/001-create-tenant-tables-complete.sql`);
    console.log(`Total tables: ${createStatements.length}`);

    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

extractSchemas();
