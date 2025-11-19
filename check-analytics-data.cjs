/**
 * Diagnostic script to check customer_activities data
 * Run with: node check-analytics-data.js
 */

const { CustomerActivity } = require('./backend/src/models');
const { Op } = require('sequelize');

async function checkData() {
  try {
    console.log('Checking customer_activities data...\n');

    // Get total count
    const total = await CustomerActivity.count();
    console.log(`Total activities: ${total}`);

    if (total === 0) {
      console.log('No activities found!');
      return;
    }

    // Check user_agent data
    const withUserAgent = await CustomerActivity.count({
      where: {
        user_agent: { [Op.ne]: null }
      }
    });
    console.log(`Activities with user_agent: ${withUserAgent} (${((withUserAgent/total)*100).toFixed(1)}%)`);

    // Check geographic data
    const withCountry = await CustomerActivity.count({
      where: {
        country_name: { [Op.ne]: null }
      }
    });
    console.log(`Activities with country_name: ${withCountry} (${((withCountry/total)*100).toFixed(1)}%)`);

    const withCity = await CustomerActivity.count({
      where: {
        city: { [Op.ne]: null }
      }
    });
    console.log(`Activities with city: ${withCity} (${((withCity/total)*100).toFixed(1)}%)`);

    const withLanguage = await CustomerActivity.count({
      where: {
        language: { [Op.ne]: null }
      }
    });
    console.log(`Activities with language: ${withLanguage} (${((withLanguage/total)*100).toFixed(1)}%)`);

    // Sample data
    console.log('\nSample activity record:');
    const sample = await CustomerActivity.findOne({
      order: [['created_at', 'DESC']]
    });

    if (sample) {
      console.log({
        id: sample.id,
        session_id: sample.session_id,
        activity_type: sample.activity_type,
        user_agent: sample.user_agent ? sample.user_agent.substring(0, 50) + '...' : 'NULL',
        country_name: sample.country_name || 'NULL',
        city: sample.city || 'NULL',
        language: sample.language || 'NULL',
        created_at: sample.created_at
      });
    }

    // Check last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentCount = await CustomerActivity.count({
      where: {
        created_at: { [Op.gte]: sevenDaysAgo }
      }
    });
    console.log(`\nActivities in last 7 days: ${recentCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
