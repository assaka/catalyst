// LocalStorage-based slot configuration with database sync
// This provides immediate persistence while backend API is being fixed

class LocalStorageSlotConfiguration {
  constructor() {
    this.storageKey = 'slot_configurations';
  }

  // Get all configurations from localStorage
  getStorageData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('❌ Error reading slot configurations from localStorage:', error);
      return {};
    }
  }

  // Save all configurations to localStorage
  setStorageData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      console.log('💾 Saved slot configurations to localStorage');
    } catch (error) {
      console.error('❌ Error saving slot configurations to localStorage:', error);
    }
  }

  // Generate a unique ID for new configurations
  generateId() {
    return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async findAll(filters = {}) {
    try {
      console.log('🔍 LocalStorageSlotConfiguration.findAll with filters:', filters);
      
      const allData = this.getStorageData();
      let configurations = Object.values(allData);

      // Apply filters
      if (filters.store_id) {
        configurations = configurations.filter(config => config.store_id === filters.store_id);
      }
      
      if (filters.is_active !== undefined) {
        configurations = configurations.filter(config => config.is_active === filters.is_active);
      }

      // Sort by updated_at (most recent first)
      configurations.sort((a, b) => {
        const aTime = new Date(a.updated_at || a.created_at || 0);
        const bTime = new Date(b.updated_at || b.created_at || 0);
        return bTime - aTime;
      });

      console.log('📥 Found configurations in localStorage:', configurations.length);
      return configurations;
    } catch (error) {
      console.error('❌ LocalStorageSlotConfiguration.findAll error:', error);
      return [];
    }
  }

  async create(data) {
    try {
      console.log('📤 LocalStorageSlotConfiguration.create:', data);
      
      const allData = this.getStorageData();
      const id = this.generateId();
      const now = new Date().toISOString();
      
      const newConfig = {
        id,
        store_id: data.store_id,
        user_id: localStorage.getItem('userId') || 'default_user',
        configuration: data.configuration,
        is_active: data.is_active !== undefined ? data.is_active : true,
        created_at: now,
        updated_at: now
      };

      allData[id] = newConfig;
      this.setStorageData(allData);
      
      // Schedule background sync to database
      this.scheduleDatabaseSync();
      
      console.log('✅ Created slot configuration in localStorage:', id);
      return newConfig;
    } catch (error) {
      console.error('❌ LocalStorageSlotConfiguration.create error:', error);
      throw error;
    }
  }

  async update(id, data) {
    try {
      console.log('📝 LocalStorageSlotConfiguration.update:', id, data);
      
      const allData = this.getStorageData();
      
      if (!allData[id]) {
        throw new Error('Configuration not found: ' + id);
      }

      const updatedConfig = {
        ...allData[id],
        configuration: data.configuration,
        is_active: data.is_active !== undefined ? data.is_active : allData[id].is_active,
        updated_at: new Date().toISOString()
      };

      allData[id] = updatedConfig;
      this.setStorageData(allData);
      
      // Schedule background sync to database
      this.scheduleDatabaseSync();
      
      console.log('✅ Updated slot configuration in localStorage:', id);
      return updatedConfig;
    } catch (error) {
      console.error('❌ LocalStorageSlotConfiguration.update error:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      console.log('🗑️ LocalStorageSlotConfiguration.delete:', id);
      
      const allData = this.getStorageData();
      
      if (!allData[id]) {
        console.log('⚠️ Configuration not found for deletion:', id);
        return { success: false };
      }

      delete allData[id];
      this.setStorageData(allData);
      
      console.log('✅ Deleted slot configuration from localStorage:', id);
      return { success: true };
    } catch (error) {
      console.error('❌ LocalStorageSlotConfiguration.delete error:', error);
      throw error;
    }
  }

  // Schedule a background sync to database (when backend is fixed)
  scheduleDatabaseSync() {
    // For now, just log that sync is scheduled
    console.log('⏰ Database sync scheduled (waiting for backend API fix)');
    
    // TODO: When backend API is working, implement actual sync:
    // - Send all localStorage configurations to database
    // - Handle conflicts and merging
    // - Clean up old localStorage data after successful sync
  }

  // Clear localStorage (for debugging)
  clearStorage() {
    localStorage.removeItem(this.storageKey);
    console.log('🧹 Cleared slot configurations from localStorage');
  }
}

export default new LocalStorageSlotConfiguration();