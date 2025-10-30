// Remove React component scripts that cause JSX errors
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function removeJSXComponents() {
  try {
    console.log('🗑️  Finding and removing JSX component scripts...\n');

    // First, find them
    const components = await sequelize.query(`
      SELECT plugin_id, file_name
      FROM plugin_scripts
      WHERE scope = 'frontend'
      AND (file_name LIKE '%.jsx' OR file_name LIKE 'components/%')
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${components.length} component script(s):\n`);

    components.forEach(c => {
      console.log(`   - ${c.file_name} (plugin: ${c.plugin_id})`);
    });

    if (components.length === 0) {
      console.log('\n✅ No component scripts to remove!');
      return;
    }

    console.log('\n🗑️  Deleting...\n');

    // Delete them
    const result = await sequelize.query(`
      DELETE FROM plugin_scripts
      WHERE scope = 'frontend'
      AND (file_name LIKE '%.jsx' OR file_name LIKE 'components/%')
    `, {
      type: sequelize.QueryTypes.DELETE
    });

    console.log(`✅ Deleted ${result[1]} component script(s)!`);
    console.log('\n💡 Reason: React components (.jsx) contain JSX that can\'t run in browser');
    console.log('   They should only be in FileTree, not loaded as scripts.');
    console.log('\n🔄 Refresh your browser - the syntax error should be gone!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

removeJSXComponents();
