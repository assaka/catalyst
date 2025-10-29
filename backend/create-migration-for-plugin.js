/**
 * Create and insert a migration for a specific plugin
 * Usage: node create-migration-for-plugin.js <plugin-id>
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

async function createMigration() {
  const pluginId = process.argv[2] || 'eea24e22-7bc7-457e-8403-df53758ebf76';

  const client = await pool.connect();

  try {
    // Get plugin details
    const plugin = await client.query(`
      SELECT id, name, slug FROM plugin_registry WHERE id = $1
    `, [pluginId]);

    if (plugin.rows.length === 0) {
      console.error(`❌ Plugin not found: ${pluginId}`);
      process.exit(1);
    }

    const pluginData = plugin.rows[0];
    console.log(`📦 Plugin: ${pluginData.name} (${pluginData.slug})`);

    // Get all entities for this plugin
    const entities = await client.query(`
      SELECT entity_name, table_name, create_table_sql, drop_table_sql
      FROM plugin_entities
      WHERE plugin_id = $1
    `, [pluginId]);

    console.log(`\n🗄️  Found ${entities.rows.length} entities`);

    if (entities.rows.length === 0) {
      console.log('❌ No entities found - nothing to migrate');
      process.exit(0);
    }

    // Generate migration version
    const timestamp = Date.now();
    const migrationVersion = `${timestamp}_create_${pluginData.slug.replace(/-/g, '_')}_tables`;

    console.log(`\n📝 Migration Version: ${migrationVersion}`);

    // Build migration SQL from entity's create_table_sql
    let upSQL = `-- Migration: ${migrationVersion}\n`;
    upSQL += `-- Plugin: ${pluginData.name}\n`;
    upSQL += `-- Created: ${new Date().toISOString()}\n\n`;

    let downSQL = `-- Rollback migration: ${migrationVersion}\n`;
    downSQL += `-- Plugin: ${pluginData.name}\n\n`;

    for (const entity of entities.rows) {
      upSQL += `-- Create table for ${entity.entity_name}\n`;
      upSQL += entity.create_table_sql;
      upSQL += `\n\n`;

      downSQL += `-- Drop table for ${entity.entity_name}\n`;
      downSQL += entity.drop_table_sql;
      downSQL += `\n\n`;
    }

    console.log('\n📄 UP Migration SQL (CREATE):');
    console.log('─'.repeat(60));
    console.log(upSQL);
    console.log('─'.repeat(60));

    console.log('\n📄 DOWN Migration SQL (ROLLBACK):');
    console.log('─'.repeat(60));
    console.log(downSQL);
    console.log('─'.repeat(60));

    // Insert into plugin_migrations
    await client.query(`
      INSERT INTO plugin_migrations (
        plugin_id,
        plugin_name,
        migration_name,
        migration_version,
        migration_description,
        status,
        up_sql,
        down_sql,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, NOW(), NOW())
    `, [
      pluginId,
      pluginData.name,
      `create_${pluginData.slug.replace(/-/g, '_')}_tables`,
      migrationVersion,
      `Create tables for ${pluginData.name} entities`,
      upSQL,
      downSQL
    ]);

    console.log(`\n✅ Migration inserted into plugin_migrations table`);
    console.log(`   Status: pending`);
    console.log(`   Version: ${migrationVersion}`);
    console.log(`\n🔄 To run this migration:`);
    console.log(`   POST /api/plugins/${pluginId}/run-migration`);
    console.log(`   Body: { "migration_version": "${migrationVersion}" }`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

createMigration();
