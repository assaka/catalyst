/**
 * ImportStatistic - Pure service class (NO SEQUELIZE)
 * Tenant data - uses ConnectionManager for database access
 */

const ImportStatistic = {};

ImportStatistic.getLatestStats = async function(storeId) {
  const ConnectionManager = require('../services/database/ConnectionManager');

  try {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data, error } = await tenantDb
      .from('import_statistics')
      .select('*')
      .eq('store_id', storeId)
      .order('import_date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching import statistics:', error);
      return [];
    }

    // Group by import_type and return latest for each
    const statsByType = {};
    (data || []).forEach(stat => {
      if (!statsByType[stat.import_type]) {
        statsByType[stat.import_type] = stat;
      }
    });

    return statsByType;
  } catch (error) {
    console.error('ImportStatistic.getLatestStats error:', error);
    return {};
  }
};

ImportStatistic.create = async function(storeId, statData) {
  const ConnectionManager = require('../services/database/ConnectionManager');
  const { v4: uuidv4 } = require('uuid');

  try {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data, error } = await tenantDb
      .from('import_statistics')
      .insert({
        id: uuidv4(),
        store_id: storeId,
        ...statData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('ImportStatistic.create error:', error);
    throw error;
  }
};

module.exports = ImportStatistic;
