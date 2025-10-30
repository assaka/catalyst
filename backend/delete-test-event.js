require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function deleteTestEvent() {
  try {
    console.log('🗑️  Deleting test event...\n');

    await sequelize.query(`
      DELETE FROM plugin_events
      WHERE event_name = 'test' AND file_name = 'test.js'
    `, {
      type: sequelize.QueryTypes.DELETE
    });

    console.log('✅ Test event deleted!');
    console.log('\n🔄 Refresh your browser now!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

deleteTestEvent();
