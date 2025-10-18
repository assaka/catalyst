// backend/src/services/PluginDataService.js
const { sequelize } = require('../database/connection');

class PluginDataService {

  /**
   * Store plugin data (tenant-isolated)
   */
  async setData(pluginId, key, value, dataType = 'user_data') {
    try {
      const [result] = await sequelize.query(`
        INSERT INTO plugin_data (plugin_id, data_key, data_value, data_type)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (plugin_id, data_key) DO UPDATE SET
          data_value = EXCLUDED.data_value,
          updated_at = NOW()
        RETURNING *
      `, {
        bind: [pluginId, key, JSON.stringify(value), dataType],
        type: sequelize.QueryTypes.INSERT
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
  async getData(pluginId, key) {
    try {
      const result = await sequelize.query(`
        SELECT data_value FROM plugin_data
        WHERE plugin_id = $1 AND data_key = $2
      `, {
        bind: [pluginId, key],
        type: sequelize.QueryTypes.SELECT
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
  async getAllData(pluginId, dataType = null) {
    try {
      const query = dataType
        ? `SELECT * FROM plugin_data WHERE plugin_id = $1 AND data_type = $2`
        : `SELECT * FROM plugin_data WHERE plugin_id = $1`;

      const params = dataType ? [pluginId, dataType] : [pluginId];

      const result = await sequelize.query(query, {
        bind: params,
        type: sequelize.QueryTypes.SELECT
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
  async deleteData(pluginId, key) {
    try {
      await sequelize.query(`
        DELETE FROM plugin_data
        WHERE plugin_id = $1 AND data_key = $2
      `, {
        bind: [pluginId, key],
        type: sequelize.QueryTypes.DELETE
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
  async deleteAllData(pluginId) {
    try {
      await sequelize.query(`
        DELETE FROM plugin_data WHERE plugin_id = $1
      `, {
        bind: [pluginId],
        type: sequelize.QueryTypes.DELETE
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
  async updateConfig(pluginId, config) {
    try {
      await sequelize.query(`
        UPDATE plugins
        SET configuration = $1, updated_at = NOW()
        WHERE id = $2
      `, {
        bind: [JSON.stringify(config), pluginId],
        type: sequelize.QueryTypes.UPDATE
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
  async getConfig(pluginId) {
    try {
      const result = await sequelize.query(`
        SELECT configuration FROM plugins WHERE id = $1
      `, {
        bind: [pluginId],
        type: sequelize.QueryTypes.SELECT
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
