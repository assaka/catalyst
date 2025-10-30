require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function removeComponentScripts() {
  try {
    console.log('🗑️  Removing React component scripts from plugin_scripts...\n');

    const result = await sequelize.query(`
      DELETE FROM plugin_scripts
      WHERE scope = 'frontend'
      AND (file_name LIKE '%/%.jsx' OR file_name LIKE 'components/%')
      RETURNING plugin_id, file_name
    `, {
      type: sequelize.QueryTypes.DELETE
    });

    console.log(`✅ Deleted ${result[0].length} component script(s):\n`);

    result[0].forEach(s => {
      console.log(`   - ${s.file_name} (plugin: ${s.plugin_id})`);
    });

    console.log('\n💡 React components should NOT be in plugin_scripts.');
    console.log('   They contain JSX which can\'t run in the browser!');
    console.log('\n🔄 Refresh your browser now!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

removeComponentScripts();
