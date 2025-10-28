/**
 * Check Cart Hamid plugin ID in database
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

async function checkCartHamid() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking Cart Hamid in database...\n');

    const result = await client.query(`
      SELECT id, name, slug, creator_id
      FROM plugin_registry
      WHERE name = 'Cart Hamid'
    `);

    if (result.rows.length === 0) {
      console.log('❌ Cart Hamid not found!');
      return;
    }

    const plugin = result.rows[0];
    console.log('📋 Cart Hamid data:');
    console.log(`   ID: ${plugin.id} (${typeof plugin.id})`);
    console.log(`   Name: ${plugin.name}`);
    console.log(`   Slug: ${plugin.slug}`);
    console.log(`   Creator: ${plugin.creator_id}`);

    console.log('\n🔍 Checking if ID is valid UUID...');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(plugin.id);
    console.log(`   Valid UUID: ${isValidUUID ? '✅ YES' : '❌ NO'}`);

    if (!isValidUUID) {
      console.log(`\n⚠️  ID is not a UUID! It's: "${plugin.id}"`);
      console.log('   This will cause errors when DeveloperPluginEditor tries to load it.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCartHamid();
