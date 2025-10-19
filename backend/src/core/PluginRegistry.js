/**
 * Database-Driven Plugin Registry
 * Creates and manages plugins entirely through database storage
 */

class PluginRegistry {
  constructor(db) {
    this.db = db;
    this.initialized = false;
    this.registeredPlugins = new Map();
  }

  // Initialize the plugin registry system
  async initialize() {
    if (this.initialized) return;

    console.log('🔌 Initializing Database-Driven Plugin Registry...');
    
    // Create core registry tables from database configuration
    await this.createRegistryTables();
    
    // Load existing plugins from database
    await this.loadRegisteredPlugins();
    
    // Register custom-pricing plugin if not exists
    await this.ensureCustomPricingPlugin();
    
    this.initialized = true;
    console.log('✅ Plugin Registry initialized');
  }

  // Create registry tables dynamically from configuration
  async createRegistryTables() {
    const tableDefinitions = {
      plugin_registry: {
        id: 'VARCHAR(255) PRIMARY KEY',
        name: 'VARCHAR(255) NOT NULL',
        version: 'VARCHAR(50) NOT NULL',
        description: 'TEXT',
        type: "VARCHAR(50) DEFAULT 'custom'",
        category: "VARCHAR(50) DEFAULT 'utility'",
        author: 'VARCHAR(255)',
        status: "VARCHAR(50) DEFAULT 'inactive'",
        security_level: "VARCHAR(50) DEFAULT 'sandboxed'",
        framework: "VARCHAR(50) DEFAULT 'react'",
        manifest: "JSONB DEFAULT '{}'",
        config: "JSONB DEFAULT '{}'",
        permissions: "JSONB DEFAULT '[]'",
        dependencies: "JSONB DEFAULT '[]'",
        tags: "JSONB DEFAULT '[]'",
        source_code: 'TEXT',
        compiled_code: 'TEXT',
        installed_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        last_activated: 'TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      },
      
      plugin_hooks: {
        id: 'SERIAL PRIMARY KEY',
        plugin_id: 'VARCHAR(255) REFERENCES plugin_registry(id) ON DELETE CASCADE',
        hook_name: 'VARCHAR(255) NOT NULL',
        hook_type: "VARCHAR(50) DEFAULT 'filter'",
        priority: 'INTEGER DEFAULT 10',
        handler_code: 'TEXT NOT NULL',
        conditions: "JSONB DEFAULT '{}'",
        enabled: 'BOOLEAN DEFAULT true',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      },
      

      plugin_scripts: {
        id: 'SERIAL PRIMARY KEY',
        plugin_id: 'VARCHAR(255) REFERENCES plugin_registry(id) ON DELETE CASCADE',
        name: 'VARCHAR(500) NOT NULL',
        type: "VARCHAR(50) DEFAULT 'module'",
        code: 'TEXT NOT NULL',
        exports: "JSONB DEFAULT '[]'",
        imports: "JSONB DEFAULT '[]'",
        language: "VARCHAR(50) DEFAULT 'javascript'",
        order_index: 'INTEGER DEFAULT 0',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        constraint: 'UNIQUE(plugin_id, name)'
      },

      plugin_dependencies: {
        id: 'SERIAL PRIMARY KEY',
        plugin_id: 'VARCHAR(255) REFERENCES plugin_registry(id) ON DELETE CASCADE',
        package_name: 'VARCHAR(255) NOT NULL',
        version: 'VARCHAR(50) NOT NULL',
        code: 'TEXT NOT NULL',
        exports: "JSONB DEFAULT '[]'",
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        constraint: 'UNIQUE(plugin_id, package_name)'
      },

      plugin_data: {
        id: 'SERIAL PRIMARY KEY',
        plugin_id: 'VARCHAR(255) REFERENCES plugin_registry(id) ON DELETE CASCADE',
        key: 'VARCHAR(255) NOT NULL',
        value: 'JSONB NOT NULL',
        expires_at: 'TIMESTAMP',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        constraint: 'UNIQUE(plugin_id, key)'
      }
    };

    // Create each table dynamically
    for (const [tableName, columns] of Object.entries(tableDefinitions)) {
      await this.createTableIfNotExists(tableName, columns);
    }

    // Create indexes
    await this.createIndexes();
  }

  // Create table dynamically from column definitions
  async createTableIfNotExists(tableName, columns) {
    try {
      const columnDefinitions = [];
      let constraints = [];

      for (const [columnName, definition] of Object.entries(columns)) {
        if (columnName === 'constraint') {
          constraints.push(definition);
        } else {
          columnDefinitions.push(`${columnName} ${definition}`);
        }
      }

      const allDefinitions = [...columnDefinitions, ...constraints];
      const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${allDefinitions.join(', ')})`;
      
      await this.db.query(sql);
      console.log(`📊 Created table: ${tableName}`);
    } catch (error) {
      console.error(`Error creating table ${tableName}:`, error);
    }
  }

  // Create performance indexes
  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_plugin_registry_status ON plugin_registry(status)',
      'CREATE INDEX IF NOT EXISTS idx_plugin_registry_category ON plugin_registry(category)',
      'CREATE INDEX IF NOT EXISTS idx_plugin_hooks_plugin_name ON plugin_hooks(plugin_id, hook_name)',
      'CREATE INDEX IF NOT EXISTS idx_plugin_events_plugin_name ON plugin_events(plugin_id, event_name)',
      'CREATE INDEX IF NOT EXISTS idx_plugin_scripts_plugin_id ON plugin_scripts(plugin_id)',
      'CREATE INDEX IF NOT EXISTS idx_plugin_dependencies_plugin_id ON plugin_dependencies(plugin_id)',
      'CREATE INDEX IF NOT EXISTS idx_plugin_data_plugin_key ON plugin_data(plugin_id, data_key)'
    ];

    for (const indexSql of indexes) {
      try {
        await this.db.query(indexSql);
      } catch (error) {
        console.error('Error creating index:', error);
      }
    }
  }

  // Load registered plugins from database
  async loadRegisteredPlugins() {
    try {
      const result = await this.db.query('SELECT * FROM plugin_registry WHERE status = $1', ['active']);
      
      for (const plugin of result.rows) {
        this.registeredPlugins.set(plugin.id, plugin);
      }
      
      console.log(`📦 Loaded ${result.rows.length} active plugins from database`);
    } catch (error) {
      console.error('Error loading plugins:', error);
    }
  }

  // Register a new plugin in database
  async registerPlugin(pluginData) {
    try {
      const {
        id,
        name,
        version = '1.0.0',
        description = '',
        type = 'custom',
        category = 'utility',
        author = 'System',
        security_level = 'sandboxed',
        framework = 'react',
        manifest = {},
        permissions = [],
        dependencies = [],
        tags = []
      } = pluginData;

      // Insert plugin registry entry
      await this.db.query(`
        INSERT INTO plugin_registry (
          id, name, version, description, type, category, author,
          status, security_level, framework, manifest, permissions, dependencies, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          version = EXCLUDED.version,
          description = EXCLUDED.description,
          updated_at = CURRENT_TIMESTAMP
      `, [
        id, name, version, description, type, category, author,
        'active', security_level, framework,
        JSON.stringify(manifest),
        JSON.stringify(permissions),
        JSON.stringify(dependencies),
        JSON.stringify(tags)
      ]);

      this.registeredPlugins.set(id, { id, name, version, status: 'active', ...pluginData });

      console.log(`✅ Registered plugin: ${name} (${id})`);
      return { success: true, pluginId: id };
    } catch (error) {
      console.error('Error registering plugin:', error);
      return { success: false, error: error.message };
    }
  }

  // Register plugin hook
  async registerPluginHook(pluginId, hookData) {
    const { hook_name, handler_function, priority = 10, is_enabled = true } = hookData;

    await this.db.query(`
      INSERT INTO plugin_hooks (plugin_id, hook_name, handler_function, priority, is_enabled)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT ON CONSTRAINT plugin_hooks_pkey
      DO UPDATE SET handler_function = EXCLUDED.handler_function, priority = EXCLUDED.priority
    `, [pluginId, hook_name, handler_function, priority, is_enabled]);
  }

  // Register plugin event
  async registerPluginEvent(pluginId, eventData) {
    const { event_name, listener_function, priority = 10, is_enabled = true } = eventData;

    await this.db.query(`
      INSERT INTO plugin_events (plugin_id, event_name, listener_function, priority, is_enabled)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT ON CONSTRAINT plugin_events_pkey
      DO UPDATE SET listener_function = EXCLUDED.listener_function, priority = EXCLUDED.priority
    `, [pluginId, event_name, listener_function, priority, is_enabled]);
  }

  // Get all active plugins
  async getActivePlugins() {
    try {
      const result = await this.db.query(
        'SELECT * FROM plugin_registry WHERE status = $1',
        ['active']
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting active plugins:', error);
      return [];
    }
  }

  // Get plugin hooks
  async getPluginHooks(pluginId = null) {
    try {
      const query = pluginId
        ? 'SELECT * FROM plugin_hooks WHERE plugin_id = $1 AND is_enabled = true ORDER BY priority ASC'
        : 'SELECT * FROM plugin_hooks WHERE is_enabled = true ORDER BY priority ASC';
      const params = pluginId ? [pluginId] : [];

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting plugin hooks:', error);
      return [];
    }
  }

  // Ensure custom-pricing plugin exists (demo plugin - simplified)
  async ensureCustomPricingPlugin() {
    const pluginId = 'custom-pricing-v2';

    const existing = await this.db.query(
      'SELECT id FROM plugin_registry WHERE id = $1',
      [pluginId]
    );

    if (existing.rows.length === 0) {
      await this.registerPlugin({
        id: pluginId,
        name: 'Custom Pricing Plugin',
        version: '2.0.0',
        description: 'Database-driven pricing rules and discounts system',
        type: 'custom',
        category: 'commerce',
        author: 'System',
        security_level: 'trusted',
        permissions: ['database.read', 'database.write', 'api.pricing'],
        tags: ['pricing', 'discounts', 'loyalty', 'database']
      });
    }
  }

  // Register plugin script/module
  async registerPluginScript(pluginId, scriptData) {
    const {
      file_name,
      file_content,
      script_type = 'js',
      scope = 'frontend',
      load_priority = 0,
      is_enabled = true
    } = scriptData;

    try {
      await this.db.query(`
        INSERT INTO plugin_scripts (plugin_id, file_name, file_content, script_type, scope, load_priority, is_enabled)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT ON CONSTRAINT plugin_scripts_pkey
        DO UPDATE SET
          file_content = EXCLUDED.file_content,
          updated_at = CURRENT_TIMESTAMP
      `, [
        pluginId,
        file_name,
        file_content,
        script_type,
        scope,
        load_priority,
        is_enabled
      ]);

      console.log(`✅ Registered script: ${file_name} for plugin ${pluginId}`);
    } catch (error) {
      console.error(`Error registering script ${file_name}:`, error);
    }
  }

  // Get plugin scripts
  async getPluginScripts(pluginId) {
    try {
      const result = await this.db.query(
        'SELECT * FROM plugin_scripts WHERE plugin_id = $1 AND is_enabled = true ORDER BY load_priority ASC',
        [pluginId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting plugin scripts:', error);
      return [];
    }
  }

  // Register plugin dependency
  async registerPluginDependency(pluginId, depData) {
    const { package_name, version, bundled_code } = depData;

    try {
      await this.db.query(`
        INSERT INTO plugin_dependencies (plugin_id, package_name, version, bundled_code)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ON CONSTRAINT plugin_dependencies_plugin_id_package_name_key
        DO UPDATE SET bundled_code = EXCLUDED.bundled_code, version = EXCLUDED.version
      `, [pluginId, package_name, version, bundled_code]);

      console.log(`✅ Registered dependency: ${package_name}@${version} for plugin ${pluginId}`);
    } catch (error) {
      console.error(`Error registering dependency ${package_name}:`, error);
    }
  }

  // Get plugin dependencies
  async getPluginDependencies(pluginId) {
    try {
      const result = await this.db.query(
        'SELECT * FROM plugin_dependencies WHERE plugin_id = $1',
        [pluginId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting plugin dependencies:', error);
      return [];
    }
  }

  // Set plugin data (key-value storage)
  async setPluginData(pluginId, key, value, expiresAt = null) {
    try {
      await this.db.query(`
        INSERT INTO plugin_data (plugin_id, data_key, data_value)
        VALUES ($1, $2, $3)
        ON CONFLICT ON CONSTRAINT plugin_data_pkey
        DO UPDATE SET data_value = EXCLUDED.data_value, updated_at = CURRENT_TIMESTAMP
      `, [pluginId, key, JSON.stringify(value)]);
    } catch (error) {
      console.error('Error setting plugin data:', error);
    }
  }

  // Get plugin data
  async getPluginData(pluginId, key) {
    try {
      const result = await this.db.query(
        `SELECT data_value FROM plugin_data
         WHERE plugin_id = $1 AND data_key = $2`,
        [pluginId, key]
      );

      if (result.rows.length > 0) {
        return result.rows[0].data_value;
      }
      return null;
    } catch (error) {
      console.error('Error getting plugin data:', error);
      return null;
    }
  }

  // Delete plugin data
  async deletePluginData(pluginId, key) {
    try {
      await this.db.query(
        'DELETE FROM plugin_data WHERE plugin_id = $1 AND data_key = $2',
        [pluginId, key]
      );
    } catch (error) {
      console.error('Error deleting plugin data:', error);
    }
  }
}

module.exports = PluginRegistry;