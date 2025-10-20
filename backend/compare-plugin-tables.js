const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function compareTables() {
  try {
    await sequelize.authenticate();

    console.log('\n=== PLUGINS TABLE (File-based plugins) ===');
    const [plugins] = await sequelize.query(`
      SELECT name, slug, status, is_enabled
      FROM plugins
      ORDER BY name
    `);
    if (plugins.length === 0) {
      console.log('  (empty)');
    } else {
      plugins.forEach(p => console.log(`  - ${p.name} (${p.slug}) - ${p.status} - enabled: ${p.is_enabled}`));
    }

    console.log('\n=== PLUGIN_REGISTRY TABLE (Database-driven plugins) ===');
    const [registry] = await sequelize.query(`
      SELECT name, id, status, type
      FROM plugin_registry
      ORDER BY name
    `);
    if (registry.length === 0) {
      console.log('  (empty)');
    } else {
      registry.forEach(p => console.log(`  - ${p.name} (${p.id}) - ${p.status} - type: ${p.type}`));
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

compareTables();
