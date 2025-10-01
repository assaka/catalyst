const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres'
});

(async () => {
  try {
    await client.connect();

    // Get current settings
    const storeRes = await client.query(
      'SELECT id, settings FROM stores WHERE id = $1',
      ['157d4590-49bf-4b0b-bd77-abe131909528']
    );

    if (storeRes.rows.length === 0) {
      console.log('Store not found');
      await client.end();
      return;
    }

    const store = storeRes.rows[0];
    const settings = store.settings || {};

    // Update add_to_cart_button_color to brown
    if (!settings.theme) {
      settings.theme = {};
    }
    const oldColor = settings.theme.add_to_cart_button_color;
    settings.theme.add_to_cart_button_color = '#8B4513'; // Brown color

    // Save back to database
    await client.query(
      'UPDATE stores SET settings = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(settings), store.id]
    );

    console.log('✅ Updated add_to_cart_button_color to brown (#8B4513)');
    console.log('Old color:', oldColor || 'Not set');
    console.log('New color:', settings.theme.add_to_cart_button_color);

    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    await client.end();
  }
})();
