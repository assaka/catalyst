/**
 * Export a plugin as a downloadable package
 * Creates a complete JSON package with all files, events, scripts, and metadata
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function exportPlugin(pluginId, outputDir = './plugin-packages') {
  const client = await pool.connect();

  try {
    console.log(`📦 Exporting plugin: ${pluginId}\n`);

    // 1. Get plugin metadata from plugin_registry
    console.log('📋 Loading plugin metadata...');
    const plugin = await client.query(`
      SELECT * FROM plugin_registry WHERE id = $1
    `, [pluginId]);

    if (plugin.rows.length === 0) {
      console.log('❌ Plugin not found!');
      return;
    }

    const pluginData = plugin.rows[0];
    console.log(`  ✅ Plugin: ${pluginData.name} v${pluginData.version}`);

    // 2. Get plugin scripts from plugin_scripts
    console.log('\n📜 Loading scripts...');
    const scripts = await client.query(`
      SELECT file_name, file_content, script_type, scope, load_priority
      FROM plugin_scripts
      WHERE plugin_id = $1
      ORDER BY file_name ASC
    `, [pluginId]);

    console.log(`  ✅ Found ${scripts.rows.length} script files`);

    // 3. Get plugin events from plugin_events
    console.log('\n📡 Loading events...');
    const events = await client.query(`
      SELECT event_name, listener_function, priority
      FROM plugin_events
      WHERE plugin_id = $1
      ORDER BY event_name ASC
    `, [pluginId]);

    console.log(`  ✅ Found ${events.rows.length} event listeners`);

    // 4. Get plugin hooks from plugin_hooks
    console.log('\n🪝 Loading hooks...');
    const hooks = await client.query(`
      SELECT hook_name, hook_type, handler_function, priority
      FROM plugin_hooks
      WHERE plugin_id = $1
      ORDER BY hook_name ASC
    `, [pluginId]);

    console.log(`  ✅ Found ${hooks.rows.length} hooks`);

    // 5. Get plugin widgets from plugin_widgets
    console.log('\n🎨 Loading widgets...');
    const widgets = await client.query(`
      SELECT widget_id, widget_name, description, component_code, default_config, category, icon
      FROM plugin_widgets
      WHERE plugin_id = $1
    `, [pluginId]);

    console.log(`  ✅ Found ${widgets.rows.length} widgets`);

    // 6. Build the package
    console.log('\n📦 Building package...');

    const packageData = {
      // Package metadata
      packageVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: 'export-plugin-package.js',

      // Plugin metadata (excluding internal IDs)
      plugin: {
        name: pluginData.name,
        slug: pluginData.slug,
        version: pluginData.version,
        description: pluginData.description,
        author: pluginData.author,
        category: pluginData.category,
        type: pluginData.type,
        framework: pluginData.framework,
        manifest: pluginData.manifest,
        permissions: pluginData.permissions,
        dependencies: pluginData.dependencies,
        tags: pluginData.tags
      },

      // Files (scripts)
      files: scripts.rows.map(s => ({
        name: s.file_name,
        content: s.file_content,
        type: s.script_type,
        scope: s.scope,
        priority: s.load_priority
      })),

      // Event listeners
      events: events.rows.map(e => ({
        eventName: e.event_name,
        listenerCode: e.listener_function,
        priority: e.priority
      })),

      // Hooks
      hooks: hooks.rows.map(h => ({
        hookName: h.hook_name,
        hookType: h.hook_type,
        handlerCode: h.handler_function,
        priority: h.priority
      })),

      // Widgets
      widgets: widgets.rows.map(w => ({
        widgetId: w.widget_id,
        widgetName: w.widget_name,
        description: w.description,
        componentCode: w.component_code,
        defaultConfig: w.default_config,
        category: w.category,
        icon: w.icon
      })),

      // Installation instructions
      installation: {
        instructions: [
          '1. Run the import script with this package file',
          '2. Plugin will be created with a new UUID',
          '3. All files, events, hooks, and widgets will be installed',
          '4. Plugin will be set to active status',
          '5. Refresh your application to see the plugin'
        ],
        command: 'node import-plugin-package.js <package-file.json>'
      }
    };

    // 7. Save to file
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `${pluginData.slug || pluginData.name.toLowerCase().replace(/\s+/g, '-')}-plugin-package.json`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(packageData, null, 2));

    console.log(`\n✅ Package exported successfully!`);
    console.log(`\n📄 File: ${filePath}`);
    console.log(`📊 Package contents:`);
    console.log(`   - Plugin: ${packageData.plugin.name}`);
    console.log(`   - Files: ${packageData.files.length}`);
    console.log(`   - Events: ${packageData.events.length}`);
    console.log(`   - Hooks: ${packageData.hooks.length}`);
    console.log(`   - Widgets: ${packageData.widgets.length}`);

    console.log(`\n📋 Package size: ${(JSON.stringify(packageData).length / 1024).toFixed(2)} KB`);

    console.log('\n💡 Next steps:');
    console.log('   1. Share this package file with others');
    console.log('   2. Use import-plugin-package.js to install');
    console.log('   3. Add to plugin marketplace');
    console.log('   4. Use as starter template');

  } catch (error) {
    console.error('❌ Export failed:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Export Cart Hamid plugin
const pluginId = process.argv[2] || 'eea24e22-7bc7-457e-8403-df53758ebf76'; // Cart Hamid
exportPlugin(pluginId);
