/**
 * Import a plugin package
 * Installs a plugin from a JSON package file
 */

const { Pool } = require('pg');
const { randomUUID } = require('crypto');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function importPlugin(packageFilePath, creatorEmail = null) {
  const client = await pool.connect();

  try {
    console.log(`📥 Importing plugin package...\n`);

    // 1. Load package file
    if (!fs.existsSync(packageFilePath)) {
      console.log(`❌ Package file not found: ${packageFilePath}`);
      return;
    }

    const packageData = JSON.parse(fs.readFileSync(packageFilePath, 'utf8'));
    console.log(`✅ Loaded package: ${packageData.plugin.name}`);
    console.log(`   Version: ${packageData.plugin.version}`);
    console.log(`   Exported: ${packageData.exportedAt}`);

    // 2. Get creator ID
    let creatorId = null;
    if (creatorEmail) {
      const user = await client.query(`
        SELECT id FROM users WHERE email = $1
      `, [creatorEmail]);

      if (user.rows.length > 0) {
        creatorId = user.rows[0].id;
        console.log(`   Creator: ${creatorEmail} (${creatorId})`);
      }
    }

    if (!creatorId) {
      // Use first user as default
      const firstUser = await client.query('SELECT id FROM users LIMIT 1');
      creatorId = firstUser.rows[0]?.id;
      console.log(`   Creator: Default user (${creatorId})`);
    }

    // 3. Generate new plugin ID
    const pluginId = randomUUID();
    console.log(`   New Plugin ID: ${pluginId}\n`);

    // 4. Create plugin_registry entry
    console.log('📋 Creating plugin_registry entry...');
    await client.query(`
      INSERT INTO plugin_registry (
        id, name, slug, version, description, author, category, type, framework,
        status, creator_id, is_installed, is_enabled,
        manifest, permissions, dependencies, tags,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
    `, [
      pluginId,
      packageData.plugin.name,
      packageData.plugin.slug,
      packageData.plugin.version,
      packageData.plugin.description,
      packageData.plugin.author,
      packageData.plugin.category,
      packageData.plugin.type,
      packageData.plugin.framework || 'react',
      'active',
      creatorId,
      true,
      true,
      JSON.stringify(packageData.plugin.manifest),
      JSON.stringify(packageData.plugin.permissions),
      JSON.stringify(packageData.plugin.dependencies),
      JSON.stringify(packageData.plugin.tags)
    ]);
    console.log('  ✅ Plugin entry created');

    // 5. Import files (scripts)
    console.log(`\n📜 Importing ${packageData.files.length} files...`);
    for (const file of packageData.files) {
      await client.query(`
        INSERT INTO plugin_scripts (
          plugin_id, file_name, file_content, script_type, scope, load_priority, is_enabled
        )
        VALUES ($1, $2, $3, $4, $5, $6, true)
      `, [
        pluginId,
        file.name,
        file.content,
        file.type || 'js',
        file.scope || 'frontend',
        file.priority || 0
      ]);
      console.log(`  ✅ ${file.name}`);
    }

    // 6. Import events
    console.log(`\n📡 Importing ${packageData.events.length} events...`);
    for (const event of packageData.events) {
      await client.query(`
        INSERT INTO plugin_events (
          plugin_id, event_name, listener_function, priority, is_enabled
        )
        VALUES ($1, $2, $3, $4, true)
      `, [
        pluginId,
        event.eventName,
        event.listenerCode,
        event.priority || 10
      ]);
      console.log(`  ✅ ${event.eventName}`);
    }

    // 7. Import hooks
    if (packageData.hooks && packageData.hooks.length > 0) {
      console.log(`\n🪝 Importing ${packageData.hooks.length} hooks...`);
      for (const hook of packageData.hooks) {
        await client.query(`
          INSERT INTO plugin_hooks (
            plugin_id, hook_name, hook_type, handler_function, priority, is_enabled
          )
          VALUES ($1, $2, $3, $4, $5, true)
        `, [
          pluginId,
          hook.hookName,
          hook.hookType || 'filter',
          hook.handlerCode,
          hook.priority || 10
        ]);
        console.log(`  ✅ ${hook.hookName}`);
      }
    }

    // 8. Import widgets
    if (packageData.widgets && packageData.widgets.length > 0) {
      console.log(`\n🎨 Importing ${packageData.widgets.length} widgets...`);
      for (const widget of packageData.widgets) {
        await client.query(`
          INSERT INTO plugin_widgets (
            plugin_id, widget_id, widget_name, description, component_code,
            default_config, category, icon, is_enabled
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        `, [
          pluginId,
          widget.widgetId,
          widget.widgetName,
          widget.description,
          widget.componentCode,
          JSON.stringify(widget.defaultConfig || {}),
          widget.category || 'functional',
          widget.icon || 'Box'
        ]);
        console.log(`  ✅ ${widget.widgetName} (${widget.widgetId})`);
      }
    }

    // 9. Summary
    console.log('\n✅ Plugin imported successfully!');
    console.log(`\n📊 Import Summary:`);
    console.log(`   Plugin ID: ${pluginId}`);
    console.log(`   Name: ${packageData.plugin.name}`);
    console.log(`   Files: ${packageData.files.length}`);
    console.log(`   Events: ${packageData.events.length}`);
    console.log(`   Hooks: ${packageData.hooks.length}`);
    console.log(`   Widgets: ${packageData.widgets.length}`);
    console.log(`   Status: active`);
    console.log(`   Installed: true`);
    console.log(`   Enabled: true`);

    console.log('\n📋 Plugin is now available in:');
    console.log('   - My Plugins page');
    console.log('   - DeveloperPluginEditor (for editing)');
    console.log('   - Storefront (if active)');

    return pluginId;

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Usage: node import-plugin-package.js <package-file> [creator-email]
const packageFile = process.argv[2];
const creatorEmail = process.argv[3];

if (!packageFile) {
  console.log('Usage: node import-plugin-package.js <package-file.json> [creator-email]');
  console.log('Example: node import-plugin-package.js plugin-packages/cart-hamid-plugin-package.json info@itomoti.com');
  process.exit(1);
}

importPlugin(packageFile, creatorEmail);
