// Verify Cart Hamid Plugin components in database
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function verify() {
  try {
    console.log('🔍 Verifying Cart Hamid Plugin components in database...\n');

    // Check plugin exists
    const plugin = await sequelize.query(`
      SELECT id, name, version, status FROM plugin_registry
      WHERE id = '109c940f-5d33-472c-b7df-c48e68c35696'
    `, { type: sequelize.QueryTypes.SELECT });
    console.log('✅ Plugin:', plugin[0] ? plugin[0].name + ' (v' + plugin[0].version + ')' : 'NOT FOUND');

    // Check scripts
    const scripts = await sequelize.query(`
      SELECT file_name, scope FROM plugin_scripts
      WHERE plugin_id = '109c940f-5d33-472c-b7df-c48e68c35696'
    `, { type: sequelize.QueryTypes.SELECT });
    console.log('\n📄 Scripts (' + scripts.length + '):');
    scripts.forEach(s => console.log('   - ' + s.file_name + ' (' + s.scope + ')'));

    // Check events
    const events = await sequelize.query(`
      SELECT event_name FROM plugin_events
      WHERE plugin_id = '109c940f-5d33-472c-b7df-c48e68c35696'
    `, { type: sequelize.QueryTypes.SELECT });
    console.log('\n⚡ Events (' + events.length + '):');
    events.forEach(e => console.log('   - ' + e.event_name));

    // Check admin navigation
    const adminNav = await sequelize.query(`
      SELECT manifest->'adminNavigation' as admin_nav FROM plugin_registry
      WHERE id = '109c940f-5d33-472c-b7df-c48e68c35696'
    `, { type: sequelize.QueryTypes.SELECT });
    console.log('\n🧭 Admin Navigation:', adminNav[0] && adminNav[0].admin_nav ? '✅ CONFIGURED' : '❌ NOT SET');

    // Check hamid_cart table
    const tableExists = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'hamid_cart'
      )
    `, { type: sequelize.QueryTypes.SELECT });
    console.log('🗄️  hamid_cart table:', tableExists[0].exists ? '✅ EXISTS' : '❌ NOT FOUND');

    // Count cart visits
    if (tableExists[0].exists) {
      const count = await sequelize.query(`
        SELECT COUNT(*) as count FROM hamid_cart
      `, { type: sequelize.QueryTypes.SELECT });
      console.log('📊 Cart visits tracked:', count[0].count);
    }

    console.log('\n✅ Verification complete!\n');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verify();
