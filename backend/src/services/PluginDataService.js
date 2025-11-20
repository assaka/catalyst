// backend/src/services/PluginDataService.js
const ConnectionManager = require('./database/ConnectionManager');
const { QueryTypes } = require('sequelize');

class PluginDataService {

  /**
   * Store plugin data (tenant-isolated)
   */
  async setData(storeId, pluginId, key, value, dataType = 'user_data') {
    const connection = await ConnectionManager.getStoreConnection(storeId);
    try {
      const result = await connection.query(`
        INSERT INTO plugin_data (plugin_id, data_key, data_value, data_type)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (plugin_id, data_key) DO UPDATE SET
          data_value = EXCLUDED.data_value,
          updated_at = NOW()
        RETURNING *
      `, {
        bind: [pluginId, key, JSON.stringify(value), dataType],
        type: QueryTypes.INSERT
      });

      return result[0];
    } catch (error) {
      console.error('Failed to set plugin data:', error);
      throw error;
    }
  }

  /**
   * Get plugin data
   */
  async getData(storeId, pluginId, key) {
    const connection = await ConnectionManager.getStoreConnection(storeId);
    try {
      const result = await connection.query(`
        SELECT data_value FROM plugin_data
        WHERE plugin_id = $1 AND data_key = $2
      `, {
        bind: [pluginId, key],
        type: QueryTypes.SELECT
      });

      if (!result[0]) {
        return null;
      }

      return result[0].data_value;
    } catch (error) {
      console.error('Failed to get plugin data:', error);
      throw error;
    }
  }

  /**
   * Get all data for a plugin
   */
  async getAllData(storeId, pluginId, dataType = null) {
    const connection = await ConnectionManager.getStoreConnection(storeId);
    try {
      const query = dataType
        ? `SELECT * FROM plugin_data WHERE plugin_id = $1 AND data_type = $2`
        : `SELECT * FROM plugin_data WHERE plugin_id = $1`;

      const params = dataType ? [pluginId, dataType] : [pluginId];

      const result = await connection.query(query, {
        bind: params,
        type: QueryTypes.SELECT
      });

      const data = {};
      result.forEach(row => {
        data[row.data_key] = row.data_value;
      });

      return data;
    } catch (error) {
      console.error('Failed to get all plugin data:', error);
      throw error;
    }
  }

  /**
   * Delete plugin data
   */
  async deleteData(storeId, pluginId, key) {
    const connection = await ConnectionManager.getStoreConnection(storeId);
    try {
      await connection.query(`
        DELETE FROM plugin_data
        WHERE plugin_id = $1 AND data_key = $2
      `, {
        bind: [pluginId, key],
        type: QueryTypes.DELETE
      });

      return true;
    } catch (error) {
      console.error('Failed to delete plugin data:', error);
      throw error;
    }
  }

  /**
   * Delete all data for a plugin
   */
  async deleteAllData(storeId, pluginId) {
    const connection = await ConnectionManager.getStoreConnection(storeId);
    try {
      await connection.query(`
        DELETE FROM plugin_data WHERE plugin_id = $1
      `, {
        bind: [pluginId],
        type: QueryTypes.DELETE
      });

      return true;
    } catch (error) {
      console.error('Failed to delete all plugin data:', error);
      throw error;
    }
  }

  /**
   * Update plugin configuration
   */
  async updateConfig(storeId, pluginId, config) {
    const connection = await ConnectionManager.getStoreConnection(storeId);
    try {
      await connection.query(`
        UPDATE plugins
        SET configuration = $1, updated_at = NOW()
        WHERE id = $2
      `, {
        bind: [JSON.stringify(config), pluginId],
        type: QueryTypes.UPDATE
      });

      return config;
    } catch (error) {
      console.error('Failed to update plugin config:', error);
      throw error;
    }
  }

  /**
   * Get plugin configuration
   */
  async getConfig(storeId, pluginId) {
    const connection = await ConnectionManager.getStoreConnection(storeId);
    try {
      const result = await connection.query(`
        SELECT configuration FROM plugins WHERE id = $1
      `, {
        bind: [pluginId],
        type: QueryTypes.SELECT
      });

      if (!result[0]) {
        throw new Error('Plugin not found');
      }

      return result[0].configuration || {};
    } catch (error) {
      console.error('Failed to get plugin config:', error);
      throw error;
    }
  }
}

module.exports = new PluginDataService();
