/**
 * Check what plugin ID 109c940f-5d33-472c-b7df-c48e68c35696 is
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

async function checkPlugin() {
  const client = await pool.connect();

  try {
    const pluginId = '109c940f-5d33-472c-b7df-c48e68c35696';

    const plugin = await client.query(`
      SELECT id, name, slug, description, category, author
      FROM plugin_registry
      WHERE id = $1
    `, [pluginId]);

    if (plugin.rows.length === 0) {
      console.log('❌ Plugin not found');
      return;
    }

    const p = plugin.rows[0];
    console.log('📋 Plugin Info:');
    console.log(`   ID: ${p.id}`);
    console.log(`   Name: ${p.name}`);
    console.log(`   Slug: ${p.slug}`);
    console.log(`   Description: ${p.description}`);
    console.log(`   Category: ${p.category}`);
    console.log(`   Author: ${p.author}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPlugin();
