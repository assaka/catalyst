require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function findJSXScripts() {
  try {
    console.log('🔍 Finding JSX in plugin_scripts...\n');

    const scripts = await sequelize.query(`
      SELECT plugin_id, file_name,
             SUBSTRING(file_content, 1, 300) as preview,
             LENGTH(file_content) as len
      FROM plugin_scripts
      WHERE scope = 'frontend'
      AND (file_content LIKE '%<%' OR file_content LIKE '%React%')
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${scripts.length} scripts with JSX/React:\n`);

    scripts.forEach(s => {
      console.log(`File: ${s.file_name}`);
      console.log(`Plugin: ${s.plugin_id}`);
      console.log(`Length: ${s.len} chars`);
      console.log(`Preview:`);
      console.log(s.preview);
      console.log('---\n');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

findJSXScripts();
