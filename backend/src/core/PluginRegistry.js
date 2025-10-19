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
      
      plugin_events: {
        id: 'SERIAL PRIMARY KEY',
        plugin_id: 'VARCHAR(255) REFERENCES plugin_registry(id) ON DELETE CASCADE',
        event_name: 'VARCHAR(255) NOT NULL',
        listener_code: 'TEXT NOT NULL',
        priority: 'INTEGER DEFAULT 10',
        conditions: "JSONB DEFAULT '{}'",
        enabled: 'BOOLEAN DEFAULT true',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      },
      
      plugin_endpoints: {
        id: 'SERIAL PRIMARY KEY',
        plugin_id: 'VARCHAR(255) REFERENCES plugin_registry(id) ON DELETE CASCADE',
        method: 'VARCHAR(10) NOT NULL',
        path: 'VARCHAR(500) NOT NULL',
        handler_code: 'TEXT NOT NULL',
        middleware: "JSONB DEFAULT '[]'",
        validation_schema: "JSONB DEFAULT '{}'",
        description: 'TEXT',
        enabled: 'BOOLEAN DEFAULT true',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      },
      
      plugin_execution_logs: {
        id: 'SERIAL PRIMARY KEY',
        plugin_id: 'VARCHAR(255) REFERENCES plugin_registry(id) ON DELETE CASCADE',
        execution_type: 'VARCHAR(50)',
        execution_context: "JSONB DEFAULT '{}'",
        input_data: "JSONB DEFAULT '{}'",
        output_data: "JSONB DEFAULT '{}'",
        error_message: 'TEXT',
        execution_time_ms: 'INTEGER',
        success: 'BOOLEAN DEFAULT true',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      },
      
      plugin_store_config: {
        id: 'SERIAL PRIMARY KEY',
        plugin_id: 'VARCHAR(255) REFERENCES plugin_registry(id) ON DELETE CASCADE',
        store_id: 'VARCHAR(255) NOT NULL',
        enabled: 'BOOLEAN DEFAULT true',
        config_overrides: "JSONB DEFAULT '{}'",
        activated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        constraint: 'UNIQUE(plugin_id, store_id)'
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
      'CREATE INDEX IF NOT EXISTS idx_plugin_endpoints_plugin_path ON plugin_endpoints(plugin_id, method, path)',
      'CREATE INDEX IF NOT EXISTS idx_plugin_store_config_store ON plugin_store_config(store_id, enabled)',
      'CREATE INDEX IF NOT EXISTS idx_plugin_execution_logs_plugin_time ON plugin_execution_logs(plugin_id, created_at)',
      'CREATE INDEX IF NOT EXISTS idx_plugin_scripts_plugin_id ON plugin_scripts(plugin_id)',
      'CREATE INDEX IF NOT EXISTS idx_plugin_scripts_name ON plugin_scripts(plugin_id, name)',
      'CREATE INDEX IF NOT EXISTS idx_plugin_scripts_order ON plugin_scripts(plugin_id, order_index)',
      'CREATE INDEX IF NOT EXISTS idx_plugin_dependencies_plugin_id ON plugin_dependencies(plugin_id)',
      'CREATE INDEX IF NOT EXISTS idx_plugin_data_plugin_key ON plugin_data(plugin_id, key)'
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
        tags = [],
        source_code = '',
        hooks = [],
        events = [],
        endpoints = []
      } = pluginData;

      // Insert plugin registry entry
      await this.db.query(`
        INSERT INTO plugin_registry (
          id, name, version, description, type, category, author, 
          status, security_level, framework, manifest, permissions, tags, source_code
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
        JSON.stringify(tags), 
        source_code
      ]);

      // Register hooks
      for (const hook of hooks) {
        await this.registerPluginHook(id, hook);
      }

      // Register events
      for (const event of events) {
        await this.registerPluginEvent(id, event);
      }

      // Register endpoints
      for (const endpoint of endpoints) {
        await this.registerPluginEndpoint(id, endpoint);
      }

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
    const { hook_name, handler_code, priority = 10, conditions = {} } = hookData;
    
    await this.db.query(`
      INSERT INTO plugin_hooks (plugin_id, hook_name, handler_code, priority, conditions)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT ON CONSTRAINT plugin_hooks_plugin_id_hook_name_key 
      DO UPDATE SET handler_code = EXCLUDED.handler_code, priority = EXCLUDED.priority
    `, [pluginId, hook_name, handler_code, priority, JSON.stringify(conditions)]);
  }

  // Register plugin event
  async registerPluginEvent(pluginId, eventData) {
    const { event_name, listener_code, priority = 10, conditions = {} } = eventData;
    
    await this.db.query(`
      INSERT INTO plugin_events (plugin_id, event_name, listener_code, priority, conditions)
      VALUES ($1, $2, $3, $4, $5)
    `, [pluginId, event_name, listener_code, priority, JSON.stringify(conditions)]);
  }

  // Register plugin endpoint
  async registerPluginEndpoint(pluginId, endpointData) {
    const { method, path, handler_code, middleware = [], description = '' } = endpointData;
    
    await this.db.query(`
      INSERT INTO plugin_endpoints (plugin_id, method, path, handler_code, middleware, description)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [pluginId, method, path, handler_code, JSON.stringify(middleware), description]);
  }

  // Get all active plugins
  async getActivePlugins(storeId = null) {
    try {
      let query = 'SELECT * FROM plugin_registry WHERE status = $1';
      let params = ['active'];
      
      if (storeId) {
        query += ` AND (
          id IN (SELECT plugin_id FROM plugin_store_config WHERE store_id = $2 AND enabled = true)
          OR id NOT IN (SELECT plugin_id FROM plugin_store_config WHERE store_id = $2)
        )`;
        params.push(storeId);
      }
      
      const result = await this.db.query(query, params);
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
        ? 'SELECT * FROM plugin_hooks WHERE plugin_id = $1 AND enabled = true ORDER BY priority ASC'
        : 'SELECT * FROM plugin_hooks WHERE enabled = true ORDER BY priority ASC';
      const params = pluginId ? [pluginId] : [];
      
      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting plugin hooks:', error);
      return [];
    }
  }

  // Get plugin endpoints
  async getPluginEndpoints(pluginId) {
    try {
      const result = await this.db.query(
        'SELECT * FROM plugin_endpoints WHERE plugin_id = $1 AND enabled = true',
        [pluginId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting plugin endpoints:', error);
      return [];
    }
  }

  // Execute plugin code safely
  async executePluginCode(pluginId, executionType, code, context = {}) {
    const startTime = Date.now();
    let success = true;
    let result = null;
    let error = null;

    try {
      // In a real implementation, this would use a sandboxed JS executor
      // For now, we'll simulate execution
      result = { message: 'Plugin code executed', context };
      
    } catch (err) {
      success = false;
      error = err.message;
      result = { error: err.message };
    }

    const executionTime = Date.now() - startTime;

    // Log execution
    await this.db.query(`
      INSERT INTO plugin_execution_logs (
        plugin_id, execution_type, execution_context, input_data, 
        output_data, error_message, execution_time_ms, success
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      pluginId, 
      executionType, 
      JSON.stringify(context), 
      JSON.stringify(context),
      JSON.stringify(result), 
      error, 
      executionTime, 
      success
    ]);

    return { success, result, executionTime };
  }

  // Ensure custom-pricing plugin exists
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
        tags: ['pricing', 'discounts', 'loyalty', 'database'],
        hooks: [
          {
            hook_name: 'pricing.calculate',
            handler_code: `
              async function(basePrice, context) {
                const response = await fetch('/api/plugins/dynamic/${pluginId}/calculate', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({basePrice, context})
                });
                const result = await response.json();
                return result.success ? result.data.final_price : basePrice;
              }
            `,
            priority: 5
          }
        ],
        endpoints: [
          {
            method: 'GET',
            path: '/rules',
            handler_code: `
              async function(req, res) {
                const query = \`
                  SELECT r.*,
                         JSON_AGG(d.*) FILTER (WHERE d.id IS NOT NULL) as discounts
                  FROM custom_pricing_rules r
                  LEFT JOIN custom_pricing_discounts d ON r.id = d.rule_id
                  WHERE r.enabled = true
                  GROUP BY r.id ORDER BY r.priority ASC
                \`;
                const result = await db.query(query);
                res.json({ success: true, data: result.rows });
              }
            `,
            description: 'Get all pricing rules'
          },
          {
            method: 'POST',
            path: '/calculate',
            handler_code: `
              async function(req, res) {
                const { basePrice, context } = req.body;
                let finalPrice = parseFloat(basePrice);

                // Apply volume discount
                if (context.quantity >= 5) {
                  finalPrice *= 0.9; // 10% off
                }

                // Apply loyalty discount
                if (context.user?.isLoyaltyMember) {
                  finalPrice *= 0.95; // 5% off
                }

                res.json({
                  success: true,
                  data: {
                    original_price: basePrice,
                    final_price: Math.max(0, finalPrice),
                    total_discount: basePrice - finalPrice
                  }
                });
              }
            `,
            description: 'Calculate price with rules'
          }
        ]
      });
    }
  }

  // Register plugin script/module
  async registerPluginScript(pluginId, scriptData) {
    const {
      name,
      code,
      type = 'module',
      exports = [],
      imports = [],
      language = 'javascript',
      order_index = 0
    } = scriptData;

    try {
      await this.db.query(`
        INSERT INTO plugin_scripts (plugin_id, name, code, type, exports, imports, language, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT ON CONSTRAINT plugin_scripts_plugin_id_name_key
        DO UPDATE SET
          code = EXCLUDED.code,
          exports = EXCLUDED.exports,
          imports = EXCLUDED.imports,
          updated_at = CURRENT_TIMESTAMP
      `, [
        pluginId,
        name,
        code,
        type,
        JSON.stringify(exports),
        JSON.stringify(imports),
        language,
        order_index
      ]);

      console.log(`✅ Registered script: ${name} for plugin ${pluginId}`);
    } catch (error) {
      console.error(`Error registering script ${name}:`, error);
    }
  }

  // Get plugin scripts
  async getPluginScripts(pluginId) {
    try {
      const result = await this.db.query(
        'SELECT * FROM plugin_scripts WHERE plugin_id = $1 ORDER BY order_index ASC',
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
    const { package_name, version, code, exports = [] } = depData;

    try {
      await this.db.query(`
        INSERT INTO plugin_dependencies (plugin_id, package_name, version, code, exports)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT ON CONSTRAINT plugin_dependencies_plugin_id_package_name_key
        DO UPDATE SET code = EXCLUDED.code, version = EXCLUDED.version
      `, [pluginId, package_name, version, code, JSON.stringify(exports)]);

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