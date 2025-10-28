/**
 * Migrate plugin_registry to plugins table
 * Consolidate two tables into one unified system
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

async function migrateRegistryToPlugins() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting migration: plugin_registry → plugins\n');

    // 1. Get all plugins from plugin_registry
    console.log('📋 Step 1: Loading plugins from plugin_registry...');
    const registryPlugins = await client.query(`
      SELECT * FROM plugin_registry
      ORDER BY created_at ASC
    `);
    console.log(`  Found ${registryPlugins.rows.length} plugins in plugin_registry`);

    // 2. Get default creator (first user)
    const defaultUser = await client.query(`
      SELECT id FROM users LIMIT 1
    `);
    const defaultCreatorId = defaultUser.rows[0]?.id;
    console.log(`  Using default creator_id: ${defaultCreatorId}\n`);

    // 3. Migrate each plugin
    console.log('📦 Step 2: Migrating plugins...');
    let migratedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    for (const plugin of registryPlugins.rows) {
      // Check if plugin already exists in plugins table
      const existing = await client.query(`
        SELECT id FROM plugins WHERE id = $1
      `, [plugin.id]);

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Skipped: ${plugin.name} (already exists)`);
        skippedCount++;
        continue;
      }

      // Determine status mapping
      // plugin_registry: active/inactive
      // plugins: available/installed/active
      let newStatus = 'available';
      let isInstalled = false;
      let isEnabled = false;

      if (plugin.status === 'active') {
        newStatus = 'active';
        isInstalled = true;
        isEnabled = true;
      } else if (plugin.status === 'inactive') {
        newStatus = 'installed';
        isInstalled = true;
        isEnabled = false;
      }

      // Insert into plugins table
      try {
        await client.query(`
          INSERT INTO plugins (
            id, name, slug, version, description, author, category, type,
            status, is_installed, is_enabled, creator_id,
            manifest, permissions, dependencies,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `, [
          plugin.id,
          plugin.name,
          plugin.name.toLowerCase().replace(/\s+/g, '-'),
          plugin.version,
          plugin.description,
          plugin.author,
          plugin.category,
          plugin.type || 'utility',
          newStatus,
          isInstalled,
          isEnabled,
          defaultCreatorId,
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

    // 4. Verify plugin_scripts and plugin_events references
    console.log('\n📜 Step 3: Verifying plugin_scripts references...');
    const orphanedScripts = await client.query(`
      SELECT ps.plugin_id, COUNT(*) as count
      FROM plugin_scripts ps
      LEFT JOIN plugins p ON ps.plugin_id::text = p.id::text
      WHERE p.id IS NULL
      GROUP BY ps.plugin_id
    `);

    if (orphanedScripts.rows.length > 0) {
      console.log(`  ⚠️  Found ${orphanedScripts.rows.length} orphaned plugin_id references:`);
      orphanedScripts.rows.forEach(row => {
        console.log(`     - ${row.plugin_id}: ${row.count} scripts`);
      });
    } else {
      console.log('  ✅ All plugin_scripts references are valid');
    }

    console.log('\n📡 Step 4: Verifying plugin_events references...');
    const orphanedEvents = await client.query(`
      SELECT pe.plugin_id, COUNT(*) as count
      FROM plugin_events pe
      LEFT JOIN plugins p ON pe.plugin_id::text = p.id::text
      WHERE p.id IS NULL
      GROUP BY pe.plugin_id
    `);

    if (orphanedEvents.rows.length > 0) {
      console.log(`  ⚠️  Found ${orphanedEvents.rows.length} orphaned plugin_id references:`);
      orphanedEvents.rows.forEach(row => {
        console.log(`     - ${row.plugin_id}: ${row.count} events`);
      });

      console.log('\n  💡 These need to be fixed manually or plugins created with matching IDs');
    } else {
      console.log('  ✅ All plugin_events references are valid');
    }

    // 5. Summary
    console.log('\n📊 Migration Summary:');
    console.log(`  ✅ Migrated: ${migratedCount} plugins`);
    console.log(`  ⏭️  Skipped: ${skippedCount} plugins (already exist)`);
    console.log(`  📦 Total in plugins table: ${migratedCount + skippedCount}`);

    // 6. Verification
    console.log('\n🔍 Step 5: Final verification...');
    const finalCount = await client.query('SELECT COUNT(*) FROM plugins');
    console.log(`  plugins table: ${finalCount.rows[0].count} rows`);

    const registryCount = await client.query('SELECT COUNT(*) FROM plugin_registry');
    console.log(`  plugin_registry table: ${registryCount.rows[0].count} rows`);

    // 7. Recommendations
    console.log('\n💡 Next Steps:');
    console.log('  1. Update API endpoints to use plugins table');
    console.log('  2. Update DeveloperPluginEditor to use plugins table');
    console.log('  3. Test all plugin functionality');
    console.log('  4. Once verified, drop plugin_registry table:');
    console.log('     DROP TABLE plugin_registry CASCADE;');
    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateRegistryToPlugins();
