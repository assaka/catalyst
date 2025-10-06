const { Pool } = require('pg');

const connectionString = "postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";
const pool = new Pool({ connectionString });

(async () => {
  try {
    // Get current settings
    const currentResult = await pool.query(
      "SELECT settings FROM stores WHERE id = $1",
      ['157d4590-49bf-4b0b-bd77-abe131909528']
    );

    const currentSettings = currentResult.rows[0].settings;

    // Add product tabs theme properties
    const updatedSettings = {
      ...currentSettings,
      theme: {
        ...(currentSettings.theme || {}),
        product_tabs_title_color: '#DC2626',
        product_tabs_title_size: '1.875rem',
        product_tabs_content_bg: '#EFF6FF',
        product_tabs_attribute_label_color: '#16A34A'
      }
    };

    // Update database
    await pool.query(
      "UPDATE stores SET settings = $1 WHERE id = $2",
      [JSON.stringify(updatedSettings), '157d4590-49bf-4b0b-bd77-abe131909528']
    );

    console.log('✅ Successfully updated theme settings with product tabs properties');
    console.log('Updated theme:', JSON.stringify(updatedSettings.theme, null, 2));

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
