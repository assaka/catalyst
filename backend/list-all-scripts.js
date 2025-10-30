require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function listAllScripts() {
  try {
    const scripts = await sequelize.query(`
      SELECT plugin_id, file_name, scope, script_type,
             LEFT(file_content, 150) as preview
      FROM plugin_scripts
      ORDER BY plugin_id, file_name
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`Total scripts: ${scripts.length}\n`);

    scripts.forEach(s => {
      console.log(`File: ${s.file_name}`);
      console.log(`Plugin: ${s.plugin_id}`);
      console.log(`Scope: ${s.scope}, Type: ${s.script_type}`);
      console.log(`Preview: ${s.preview}...`);
      console.log('---\n');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

listAllScripts();
