/**
 * Comprehensive audit of all plugin tables
 * - Check actual columns vs expected schema
 * - Check for any old/obsolete data
 * - Verify data integrity
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function auditTables() {
  const client = await pool.connect();

  try {
    console.log('🔍 Auditing all plugin tables...\n');

    const tables = [
      'plugin_registry',
      'plugin_scripts',
      'plugin_hooks',
      'plugin_events',
      'plugin_dependencies',
      'plugin_data'
    ];

    for (const table of tables) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 TABLE: ${table}`);
      console.log('='.repeat(60));

      // 1. Get column schema
      const schemaResult = await client.query(`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      console.log('\n📋 Current Schema:');
      schemaResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const def = col.column_default ? ` DEFAULT ${col.column_default.substring(0, 30)}...` : '';
        console.log(`  - ${col.column_name.padEnd(25)} ${col.data_type.padEnd(25)} ${nullable}${def}`);
      });

      // 2. Get row count
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      const rowCount = parseInt(countResult.rows[0].count);
      console.log(`\n📈 Row Count: ${rowCount}`);

      // 3. Check for problematic data
      if (rowCount > 0) {
        console.log('\n🔎 Data Sample:');

        if (table === 'plugin_registry') {
          const data = await client.query(`
            SELECT
              id,
              name,
              version,
              type,
              category,
              status,
              jsonb_object_keys(manifest) as manifest_keys
            FROM ${table}
            LIMIT 5
          `);

          console.log('\n  Plugins:');
          const plugins = await client.query('SELECT id, name, version, status FROM plugin_registry');
          plugins.rows.forEach(p => {
            console.log(`    - ${p.name} (${p.id}) v${p.version} [${p.status}]`);
          });

          // Check manifest for any code remnants
          console.log('\n  Checking manifest for code remnants...');
          const manifestCheck = await client.query('SELECT id, name, manifest FROM plugin_registry');
          manifestCheck.rows.forEach(p => {
            const hasCodeRemnants =
              p.manifest?.generatedFiles ||
              p.manifest?.generatedCode ||
              p.manifest?.models ||
              p.manifest?.controllers ||
              p.manifest?.components ||
              p.manifest?.hooks ||
              p.manifest?.events ||
              p.manifest?.endpoints;

            if (hasCodeRemnants) {
              console.log(`    ❌ ${p.name}: Still has code in manifest!`);
            } else {
              console.log(`    ✅ ${p.name}: Clean (metadata only)`);
            }
          });
        }

        if (table === 'plugin_scripts') {
          const data = await client.query(`
            SELECT
              plugin_id,
              file_name,
              script_type,
              scope,
              load_priority,
              is_enabled,
              LENGTH(file_content) as code_length
            FROM ${table}
          `);

          console.log('\n  Scripts:');
          data.rows.forEach(s => {
            console.log(`    - ${s.file_name} (${s.script_type}, ${s.scope}) ${s.code_length} chars [${s.is_enabled ? 'enabled' : 'disabled'}]`);
          });
        }

        if (table === 'plugin_hooks') {
          const data = await client.query(`
            SELECT
              plugin_id,
              hook_name,
              priority,
              is_enabled,
              LENGTH(handler_function) as code_length
            FROM ${table}
          `);

          if (data.rows.length > 0) {
            console.log('\n  Hooks:');
            data.rows.forEach(h => {
              console.log(`    - ${h.hook_name} (priority ${h.priority}) ${h.code_length} chars [${h.is_enabled ? 'enabled' : 'disabled'}]`);
            });
          } else {
            console.log('    (No hooks registered yet)');
          }
        }

        if (table === 'plugin_events') {
          const data = await client.query(`
            SELECT
              plugin_id,
              event_name,
              priority,
              is_enabled,
              LENGTH(listener_function) as code_length
            FROM ${table}
          `);

          if (data.rows.length > 0) {
            console.log('\n  Events:');
            data.rows.forEach(e => {
              console.log(`    - ${e.event_name} (priority ${e.priority}) ${e.code_length} chars [${e.is_enabled ? 'enabled' : 'disabled'}]`);
            });
          } else {
            console.log('    (No events registered yet)');
          }
        }

        if (table === 'plugin_dependencies') {
          const data = await client.query(`
            SELECT
              plugin_id,
              package_name,
              version,
              LENGTH(bundled_code) as code_length
            FROM ${table}
          `);

          if (data.rows.length > 0) {
            console.log('\n  Dependencies:');
            data.rows.forEach(d => {
              console.log(`    - ${d.package_name}@${d.version} ${d.code_length} chars`);
            });
          } else {
            console.log('    (No dependencies registered yet)');
          }
        }

        if (table === 'plugin_data') {
          const data = await client.query(`
            SELECT
              plugin_id,
              data_key,
              data_value
            FROM ${table}
            LIMIT 5
          `);

          if (data.rows.length > 0) {
            console.log('\n  Plugin Data:');
            data.rows.forEach(d => {
              const valuePreview = JSON.stringify(d.data_value).substring(0, 50);
              console.log(`    - ${d.data_key}: ${valuePreview}...`);
            });
          } else {
            console.log('    (No plugin data stored yet)');
          }
        }
      }

      // 4. Check for foreign key constraints
      const fkResult = await client.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.table_name = $1
        AND tc.constraint_type = 'FOREIGN KEY'
      `, [table]);

      if (fkResult.rows.length > 0) {
        console.log('\n🔗 Foreign Keys:');
        fkResult.rows.forEach(fk => {
          console.log(`  - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Audit Complete!');
    console.log('='.repeat(60));

    // Summary
    console.log('\n📊 SUMMARY:');
    for (const table of tables) {
      const count = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      const rowCount = parseInt(count.rows[0].count);
      const status = rowCount > 0 ? '✅ IN USE' : '⚪ EMPTY';
      console.log(`  ${status.padEnd(12)} ${table.padEnd(25)} ${rowCount} rows`);
    }

  } catch (error) {
    console.error('❌ Error during audit:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

auditTables()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
