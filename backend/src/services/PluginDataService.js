// backend/src/services/PluginDataService.js
const db = require('../database/db');

class PluginDataService {

  /**
   * Store plugin data (tenant-isolated)
   */
  async setData(pluginId, key, value, dataType = 'user_data') {
    try {
      const result = await db.query(`
        INSERT INTO plugin_data (plugin_id, data_key, data_value, data_type)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (plugin_id, data_key) DO UPDATE SET
          data_value = EXCLUDED.data_value,
          updated_at = NOW()
        RETURNING *
      `, [pluginId, key, JSON.stringify(value), dataType]);

      return result.rows[0];
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
      const result = await db.query(`
        SELECT data_value FROM plugin_data
        WHERE plugin_id = $1 AND data_key = $2
      `, [pluginId, key]);

      if (!result.rows[0]) {
        return null;
      }

      return result.rows[0].data_value;
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

      const result = await db.query(query, params);

      const data = {};
      result.rows.forEach(row => {
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
      await db.query(`
        DELETE FROM plugin_data
        WHERE plugin_id = $1 AND data_key = $2
      `, [pluginId, key]);

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
      await db.query(`
        DELETE FROM plugin_data WHERE plugin_id = $1
      `, [pluginId]);

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
      await db.query(`
        UPDATE plugins
        SET config_data = $1, updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(config), pluginId]);

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
      const result = await db.query(`
        SELECT config_data FROM plugins WHERE id = $1
      `, [pluginId]);

      if (!result.rows[0]) {
        throw new Error('Plugin not found');
      }

      return result.rows[0].config_data || {};
    } catch (error) {
      console.error('Failed to get plugin config:', error);
      throw error;
    }
  }
}

module.exports = new PluginDataService();
