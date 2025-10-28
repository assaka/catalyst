/**
 * Register Cart Hamid Widget in plugin_widgets table
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

async function registerWidget() {
  const client = await pool.connect();

  try {
    console.log('🎨 Registering Cart Hamid Widget...\n');

    const pluginId = 'eea24e22-7bc7-457e-8403-df53758ebf76'; // Cart Hamid plugin ID

    // Get the widget component code from plugin_scripts
    const widgetScript = await client.query(`
      SELECT file_content FROM plugin_scripts
      WHERE plugin_id = $1 AND file_name = 'components/CartHamidWidget.jsx'
    `, [pluginId]);

    if (widgetScript.rows.length === 0) {
      console.log('❌ Widget component not found in plugin_scripts!');
      return;
    }

    const componentCode = widgetScript.rows[0].file_content;

    // Register widget in plugin_widgets table
    await client.query(`
      INSERT INTO plugin_widgets (
        plugin_id,
        widget_id,
        widget_name,
        description,
        component_code,
        default_config,
        category,
        icon,
        is_enabled
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (plugin_id, widget_id) DO UPDATE
      SET component_code = EXCLUDED.component_code,
          updated_at = NOW()
    `, [
      pluginId,
      'cart-hamid-widget',
      'Cart Hamid Widget',
      'Displays cart visit counter with beautiful gradient design',
      componentCode,
      JSON.stringify({}),
      'functional',
      'BarChart3',
      true
    ]);

    console.log('✅ Widget registered in plugin_widgets table!');
    console.log('\n📋 How to use the widget:');
    console.log('  1. Go to Slot Editor (e.g., Cart Slots Editor)');
    console.log('  2. Click "Add Component" in any slot');
    console.log('  3. Find "Cart Hamid Widget" in the plugin widgets section');
    console.log('  4. Add it to the slot');
    console.log('  5. Widget will display on the cart page!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

registerWidget();
