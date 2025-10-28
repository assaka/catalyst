/**
 * Migrate plugins → plugin_registry
 * Keep plugin_registry as the primary table
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

async function migratePluginsToRegistry() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting migration: plugins → plugin_registry\n');
    console.log('   plugin_registry will be the primary table\n');

    // 1. Add missing columns to plugin_registry
    console.log('📋 Step 1: Adding missing columns to plugin_registry...');

    try {
      await client.query(`
        ALTER TABLE plugin_registry
        ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES users(id),
        ADD COLUMN IF NOT EXISTS is_installed BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS slug VARCHAR(255)
      `);
      console.log('  ✅ Added creator_id, is_installed, is_enabled, slug columns');
    } catch (error) {
      console.log('  ⚠️  Columns may already exist:', error.message);
    }

    // 2. Load plugins from plugins table
    console.log('\n📦 Step 2: Loading plugins from plugins table...');
    const pluginsData = await client.query(`
      SELECT * FROM plugins
      ORDER BY created_at ASC
    `);
    console.log(`  Found ${pluginsData.rows.length} plugins`);

    // 3. Migrate each plugin
    console.log('\n🔄 Step 3: Migrating to plugin_registry...');
    let migratedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const plugin of pluginsData.rows) {
      // Check if plugin exists in registry
      const existing = await client.query(`
        SELECT id FROM plugin_registry WHERE id = $1
      `, [plugin.id]);

      // Map status back
      let registryStatus = 'inactive';
      if (plugin.status === 'active' && plugin.is_enabled) {
        registryStatus = 'active';
      }

      if (existing.rows.length > 0) {
        // Update existing
        try {
          await client.query(`
            UPDATE plugin_registry
            SET
              name = $2,
              slug = $3,
              version = $4,
              description = $5,
              author = $6,
              category = $7,
              type = $8,
              status = $9,
              creator_id = $10,
              is_installed = $11,
              is_enabled = $12,
              manifest = $13,
              permissions = $14,
              dependencies = $15,
              updated_at = $16
            WHERE id = $1
          `, [
            plugin.id,
            plugin.name,
            plugin.slug,
            plugin.version,
            plugin.description,
            plugin.author,
            plugin.category,
            plugin.type,
            registryStatus,
            plugin.creator_id,
            plugin.is_installed,
            plugin.is_enabled,
            plugin.manifest,
            plugin.permissions,
            plugin.dependencies,
            plugin.updated_at || new Date()
          ]);

          console.log(`  ✅ Updated: ${plugin.name} (${plugin.id})`);
          updatedCount++;
        } catch (error) {
          console.log(`  ❌ Error updating ${plugin.name}:`, error.message);
        }
      } else {
        // Insert new
        try {
          await client.query(`
            INSERT INTO plugin_registry (
              id, name, slug, version, description, author, category, type,
              status, creator_id, is_installed, is_enabled,
              manifest, permissions, dependencies,
              created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          `, [
            plugin.id,
            plugin.name,
            plugin.slug,
            plugin.version,
            plugin.description,
            plugin.author,
            plugin.category,
            plugin.type,
            registryStatus,
            plugin.creator_id,
            plugin.is_installed,
            plugin.is_enabled,
            plugin.manifest,
            plugin.permissions,
            plugin.dependencies,
            plugin.created_at || new Date(),
            plugin.updated_at || new Date()
          ]);

          console.log(`  ✅ Migrated: ${plugin.name} (${plugin.id})`);
          migratedCount++;
        } catch (error) {
          console.log(`  ❌ Error migrating ${plugin.name}:`, error.message);
        }
      }
    }

    // 4. Fix orphaned plugin_scripts and plugin_events references
    console.log('\n🔧 Step 4: Identifying orphaned references...');

    // Find scripts with non-UUID plugin_ids
    const orphanedScripts = await client.query(`
      SELECT DISTINCT plugin_id
      FROM plugin_scripts
      WHERE plugin_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    `);

    if (orphanedScripts.rows.length > 0) {
      console.log(`  Found ${orphanedScripts.rows.length} non-UUID plugin_ids in plugin_scripts:`);
      orphanedScripts.rows.forEach(row => {
        console.log(`    - ${row.plugin_id}`);
      });
      console.log('  ⚠️  These need manual fixing or plugin creation');
    }

    // Find events with non-UUID plugin_ids
    const orphanedEvents = await client.query(`
      SELECT DISTINCT plugin_id
      FROM plugin_events
      WHERE plugin_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    `);

    if (orphanedEvents.rows.length > 0) {
      console.log(`  Found ${orphanedEvents.rows.length} non-UUID plugin_ids in plugin_events:`);
      orphanedEvents.rows.forEach(row => {
        console.log(`    - ${row.plugin_id}`);
      });
    }

    // 5. Summary
    console.log('\n📊 Migration Summary:');
    console.log(`  ✅ Migrated: ${migratedCount} new plugins`);
    console.log(`  🔄 Updated: ${updatedCount} existing plugins`);
    console.log(`  📦 Total: ${migratedCount + updatedCount}`);

    // 6. Verification
    console.log('\n🔍 Step 5: Final verification...');
    const registryCount = await client.query('SELECT COUNT(*) FROM plugin_registry');
    console.log(`  plugin_registry table: ${registryCount.rows[0].count} rows`);

    const pluginsCount = await client.query('SELECT COUNT(*) FROM plugins');
    console.log(`  plugins table: ${pluginsCount.rows[0].count} rows`);

    // 7. Next Steps
    console.log('\n💡 Next Steps:');
    console.log('  1. Update /api/plugins endpoints to query plugin_registry');
    console.log('  2. Update DeveloperPluginEditor to use plugin_registry');
    console.log('  3. Test all functionality');
    console.log('  4. Fix orphaned references (1760827872546-clock, customer-service-chat)');
    console.log('  5. Once verified, drop plugins table:');
    console.log('     DROP TABLE plugins CASCADE;');
    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

migratePluginsToRegistry();
