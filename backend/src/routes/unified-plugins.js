/**
 * Unified Plugin System API Routes
 * Handles advanced plugin creation, scaffolding, and management
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { authMiddleware } = require('../middleware/auth');
const { storeResolver } = require('../middleware/storeResolver');

// AI Plugin Creation with Full Stack Generation
router.post('/create/ai', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const {
      prompt,
      type = 'custom',
      category = 'utility',
      components = {},
      schema = '',
      security = 'sandboxed',
      framework = 'react'
    } = req.body;

    console.log(`🤖 Creating AI-powered plugin: ${prompt}`);

    // Parse schema definition
    const parsedSchema = parseSchemaDefinition(schema);
    
    // Generate plugin structure
    const pluginStructure = await generatePluginStructure({
      name: extractPluginNameFromPrompt(prompt),
      prompt,
      type,
      category,
      components,
      schema: parsedSchema,
      security,
      framework,
      storeId: req.storeId,
      createdBy: req.user.id
    });

    // Create the physical plugin files
    const pluginPath = await createPluginFiles(pluginStructure);

    res.json({
      success: true,
      message: 'AI plugin created successfully',
      data: {
        pluginId: pluginStructure.id,
        name: pluginStructure.name,
        path: pluginPath,
        structure: pluginStructure,
        componentsCreated: Object.keys(pluginStructure.files).length
      }
    });

  } catch (error) {
    console.error('❌ Error creating AI plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
});

// Plugin Scaffolding
router.post('/scaffold', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const {
      name,
      namespace = 'Custom',
      template = 'full',
      customComponents = {}
    } = req.body;

    console.log(`🏗️ Scaffolding plugin: ${name} (${template})`);

    const scaffoldStructure = generateScaffoldStructure({
      name,
      namespace,
      template,
      customComponents,
      storeId: req.storeId,
      createdBy: req.user.id
    });

    const pluginPath = await createPluginFiles(scaffoldStructure);

    res.json({
      success: true,
      message: 'Plugin scaffold created successfully',
      data: {
        pluginId: scaffoldStructure.id,
        name: scaffoldStructure.name,
        path: pluginPath,
        template,
        files: Object.keys(scaffoldStructure.files)
      }
    });

  } catch (error) {
    console.error('❌ Error scaffolding plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Database Table Creation
router.post('/create-tables', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const { pluginId, tables } = req.body;

    console.log(`🗄️ Creating tables for plugin: ${pluginId}`);

    const createdTables = [];
    
    for (const table of tables) {
      const tableName = `plugin_${pluginId}_${table.name}`;
      const sql = generateCreateTableSQL(tableName, table.fields);
      
      // Execute the SQL (implement your database connection logic here)
      // await executeSQL(sql);
      
      createdTables.push({
        name: tableName,
        fields: table.fields,
        sql: sql
      });
    }

    res.json({
      success: true,
      message: `Created ${createdTables.length} tables`,
      data: {
        tables: createdTables
      }
    });

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Slot/Hook Registration
router.post('/create-slot', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const {
      pluginId,
      slotName,
      hookName,
      description = '',
      priority = 10,
      async: false
    } = req.body;

    console.log(`🎣 Creating slot/hook: ${slotName} -> ${hookName}`);

    const slotDefinition = {
      id: `${pluginId}_${slotName}`,
      pluginId,
      slotName,
      hookName,
      description,
      priority,
      async,
      createdAt: new Date().toISOString(),
      createdBy: req.user.id,
      storeId: req.storeId
    };

    // Register the slot/hook in the system
    // This would integrate with your hook system
    
    res.json({
      success: true,
      message: 'Slot/hook created successfully',
      data: slotDefinition
    });

  } catch (error) {
    console.error('❌ Error creating slot:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper Functions

function parseSchemaDefinition(schema) {
  if (!schema.trim()) return {};
  
  const tables = {};
  const lines = schema.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const [tableName, fieldsStr] = line.split(':').map(s => s.trim());
    if (tableName && fieldsStr) {
      const fields = fieldsStr.split(',').map(field => {
        const parts = field.trim().split(':');
        return {
          name: parts[0],
          type: parts[1] || 'string',
          modifier: parts[2] || null
        };
      });
      tables[tableName] = fields;
    }
  }
  
  return tables;
}

function extractPluginNameFromPrompt(prompt) {
  // Simple extraction - in production, use AI to extract a better name
  const words = prompt.split(' ').slice(0, 3);
  return words.join('_').toLowerCase().replace(/[^a-z0-9_]/g, '');
}

async function generatePluginStructure({
  name,
  prompt,
  type,
  category,
  components,
  schema,
  security,
  framework,
  storeId,
  createdBy
}) {
  const pluginId = `${name}_${Date.now()}`;
  const structure = {
    id: pluginId,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    prompt,
    type,
    category,
    security,
    framework,
    storeId,
    createdBy,
    createdAt: new Date().toISOString(),
    files: {}
  };

  // Generate manifest
  structure.files['manifest.json'] = JSON.stringify({
    name: structure.name,
    version: '1.0.0',
    description: `AI-generated plugin: ${prompt}`,
    type,
    category,
    security: { level: security },
    framework,
    author: 'AI Generator',
    createdAt: structure.createdAt
  }, null, 2);

  // Generate components based on selection
  if (components.controllers) {
    structure.files[`controllers/${structure.name}Controller.js`] = generateController(structure);
  }
  
  if (components.models) {
    structure.files[`models/${structure.name}Model.js`] = generateModel(structure, schema);
  }
  
  if (components.routes) {
    structure.files[`routes/${structure.name.toLowerCase()}.js`] = generateRoutes(structure);
  }
  
  if (components.components) {
    structure.files[`components/${structure.name}Component.jsx`] = generateReactComponent(structure);
  }
  
  if (components.slots) {
    structure.files[`hooks/${structure.name}Hooks.js`] = generateHooks(structure);
  }
  
  if (components.migrations && Object.keys(schema).length > 0) {
    const timestamp = Date.now();
    structure.files[`migrations/${timestamp}_create_${structure.name.toLowerCase()}_tables.js`] = generateMigration(structure, schema);
  }

  if (components.tests) {
    structure.files[`tests/${structure.name}.test.js`] = generateTests(structure);
  }

  if (components.docs) {
    structure.files['README.md'] = generateDocumentation(structure);
  }

  return structure;
}

function generateScaffoldStructure({
  name,
  namespace,
  template,
  customComponents,
  storeId,
  createdBy
}) {
  const pluginId = `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
  const structure = {
    id: pluginId,
    name,
    namespace,
    template,
    storeId,
    createdBy,
    createdAt: new Date().toISOString(),
    files: {}
  };

  // Generate based on template
  switch (template) {
    case 'full':
      structure.files = {
        ...generateFullScaffold(structure),
      };
      break;
    case 'api-only':
      structure.files = {
        ...generateAPIScaffold(structure),
      };
      break;
    case 'widget':
      structure.files = {
        ...generateWidgetScaffold(structure),
      };
      break;
    case 'custom':
      structure.files = {
        ...generateCustomScaffold(structure, customComponents),
      };
      break;
  }

  return structure;
}

function generateController(structure) {
  return `/**
 * ${structure.name} Controller
 * Generated by AI Plugin Creator
 */

const express = require('express');

class ${structure.name}Controller {
  
  // GET /api/${structure.name.toLowerCase()}
  async index(req, res) {
    try {
      // TODO: Implement list logic
      res.json({
        success: true,
        message: '${structure.name} list retrieved',
        data: []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /api/${structure.name.toLowerCase()}
  async create(req, res) {
    try {
      // TODO: Implement creation logic
      const data = req.body;
      
      res.json({
        success: true,
        message: '${structure.name} created successfully',
        data: { id: Date.now(), ...data }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // PUT /api/${structure.name.toLowerCase()}/:id
  async update(req, res) {
    try {
      // TODO: Implement update logic
      const { id } = req.params;
      const data = req.body;
      
      res.json({
        success: true,
        message: '${structure.name} updated successfully',
        data: { id, ...data }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // DELETE /api/${structure.name.toLowerCase()}/:id
  async delete(req, res) {
    try {
      // TODO: Implement deletion logic
      const { id } = req.params;
      
      res.json({
        success: true,
        message: '${structure.name} deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ${structure.name}Controller();
`;
}

function generateModel(structure, schema) {
  const tableName = structure.name.toLowerCase() + 's';
  const schemaFields = schema[tableName] || schema[Object.keys(schema)[0]] || [];
  
  const fields = schemaFields.map(field => `    ${field.name}: {
      type: '${field.type}',
      ${field.modifier ? `modifier: '${field.modifier}',` : ''}
    }`).join(',\n');

  return `/**
 * ${structure.name} Model
 * Generated by AI Plugin Creator
 */

class ${structure.name}Model {
  constructor() {
    this.tableName = '${tableName}';
    this.fields = {
${fields}
    };
  }

  // Find all records
  async findAll(filters = {}) {
    try {
      // TODO: Implement database query
      console.log(\`Finding all \${this.tableName} with filters:\`, filters);
      return [];
    } catch (error) {
      throw new Error(\`Error finding \${this.tableName}: \${error.message}\`);
    }
  }

  // Find by ID
  async findById(id) {
    try {
      // TODO: Implement database query
      console.log(\`Finding \${this.tableName} by ID: \${id}\`);
      return null;
    } catch (error) {
      throw new Error(\`Error finding \${this.tableName} by ID: \${error.message}\`);
    }
  }

  // Create new record
  async create(data) {
    try {
      // TODO: Implement database insertion
      console.log(\`Creating new \${this.tableName}:\`, data);
      return { id: Date.now(), ...data };
    } catch (error) {
      throw new Error(\`Error creating \${this.tableName}: \${error.message}\`);
    }
  }

  // Update record
  async update(id, data) {
    try {
      // TODO: Implement database update
      console.log(\`Updating \${this.tableName} \${id}:\`, data);
      return { id, ...data };
    } catch (error) {
      throw new Error(\`Error updating \${this.tableName}: \${error.message}\`);
    }
  }

  // Delete record
  async delete(id) {
    try {
      // TODO: Implement database deletion
      console.log(\`Deleting \${this.tableName} \${id}\`);
      return true;
    } catch (error) {
      throw new Error(\`Error deleting \${this.tableName}: \${error.message}\`);
    }
  }
}

module.exports = new ${structure.name}Model();
`;
}

function generateRoutes(structure) {
  return `/**
 * ${structure.name} Routes
 * Generated by AI Plugin Creator
 */

const express = require('express');
const router = express.Router();
const ${structure.name}Controller = require('../controllers/${structure.name}Controller');
const { authMiddleware } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authMiddleware);

// GET /api/${structure.name.toLowerCase()}
router.get('/', ${structure.name}Controller.index);

// POST /api/${structure.name.toLowerCase()}
router.post('/', ${structure.name}Controller.create);

// PUT /api/${structure.name.toLowerCase()}/:id
router.put('/:id', ${structure.name}Controller.update);

// DELETE /api/${structure.name.toLowerCase()}/:id
router.delete('/:id', ${structure.name}Controller.delete);

module.exports = router;
`;
}

function generateReactComponent(structure) {
  return `/**
 * ${structure.name} Component
 * Generated by AI Plugin Creator
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from '@/api/client';

const ${structure.name}Component = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.request('GET', '${structure.name.toLowerCase()}');
      setData(response.data || []);
    } catch (error) {
      console.error('Error loading ${structure.name.toLowerCase()}:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.request('POST', '${structure.name.toLowerCase()}', formData);
      setFormData({});
      await loadData();
    } catch (error) {
      console.error('Error creating ${structure.name.toLowerCase()}:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>${structure.name} Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Enter ${structure.name.toLowerCase()} name"
              value={formData.name || ''}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <Button type="submit">
              Create ${structure.name}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>${structure.name} List</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No ${structure.name.toLowerCase()} items found
            </p>
          ) : (
            <div className="space-y-2">
              {data.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                  <span>{item.name || item.id}</span>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ${structure.name}Component;
`;
}

function generateHooks(structure) {
  return `/**
 * ${structure.name} Hooks & Slots
 * Generated by AI Plugin Creator
 */

import hookSystem from '@/core/HookSystem.js';
import eventSystem from '@/core/EventSystem.js';

// Register hooks for ${structure.name}
export const ${structure.name}Hooks = {
  
  // Initialize all hooks
  init() {
    console.log('🎣 Initializing ${structure.name} hooks');
    
    // Register hook handlers
    hookSystem.register('${structure.name.toLowerCase()}.beforeCreate', this.beforeCreate);
    hookSystem.register('${structure.name.toLowerCase()}.afterCreate', this.afterCreate);
    hookSystem.register('${structure.name.toLowerCase()}.beforeUpdate', this.beforeUpdate);
    hookSystem.register('${structure.name.toLowerCase()}.afterUpdate', this.afterUpdate);
    
    // Register event listeners
    eventSystem.on('${structure.name.toLowerCase()}.created', this.onCreated);
    eventSystem.on('${structure.name.toLowerCase()}.updated', this.onUpdated);
    eventSystem.on('${structure.name.toLowerCase()}.deleted', this.onDeleted);
  },

  // Hook: Before creating ${structure.name}
  beforeCreate(data) {
    console.log('🔄 ${structure.name}: Before create hook', data);
    
    // Add validation logic here
    if (!data.name) {
      throw new Error('${structure.name} name is required');
    }
    
    // Add timestamps
    data.createdAt = new Date().toISOString();
    data.updatedAt = new Date().toISOString();
    
    return data;
  },

  // Hook: After creating ${structure.name}
  afterCreate(result, originalData) {
    console.log('✅ ${structure.name}: After create hook', result);
    
    // Emit event
    eventSystem.emit('${structure.name.toLowerCase()}.created', {
      id: result.id,
      data: originalData,
      result
    });
    
    return result;
  },

  // Hook: Before updating ${structure.name}
  beforeUpdate(id, data) {
    console.log('🔄 ${structure.name}: Before update hook', id, data);
    
    // Add update timestamp
    data.updatedAt = new Date().toISOString();
    
    return data;
  },

  // Hook: After updating ${structure.name}
  afterUpdate(result, id, originalData) {
    console.log('✅ ${structure.name}: After update hook', result);
    
    // Emit event
    eventSystem.emit('${structure.name.toLowerCase()}.updated', {
      id,
      data: originalData,
      result
    });
    
    return result;
  },

  // Event: ${structure.name} created
  onCreated(eventData) {
    console.log('📡 ${structure.name}: Created event received', eventData);
    
    // Add post-creation logic here
    // e.g., send notifications, update caches, etc.
  },

  // Event: ${structure.name} updated
  onUpdated(eventData) {
    console.log('📡 ${structure.name}: Updated event received', eventData);
    
    // Add post-update logic here
  },

  // Event: ${structure.name} deleted
  onDeleted(eventData) {
    console.log('📡 ${structure.name}: Deleted event received', eventData);
    
    // Add post-deletion logic here
  },

  // Cleanup hooks
  cleanup() {
    console.log('🧹 Cleaning up ${structure.name} hooks');
    
    // Unregister hooks
    hookSystem.unregister('${structure.name.toLowerCase()}.beforeCreate');
    hookSystem.unregister('${structure.name.toLowerCase()}.afterCreate');
    hookSystem.unregister('${structure.name.toLowerCase()}.beforeUpdate');
    hookSystem.unregister('${structure.name.toLowerCase()}.afterUpdate');
    
    // Remove event listeners  
    eventSystem.off('${structure.name.toLowerCase()}.created');
    eventSystem.off('${structure.name.toLowerCase()}.updated');
    eventSystem.off('${structure.name.toLowerCase()}.deleted');
  }
};

// Auto-initialize on import
${structure.name}Hooks.init();

export default ${structure.name}Hooks;
`;
}

function generateMigration(structure, schema) {
  const tables = Object.entries(schema).map(([tableName, fields]) => {
    const fieldDefinitions = fields.map(field => {
      let sql = `${field.name} `;
      
      switch (field.type.toLowerCase()) {
        case 'string':
          sql += 'VARCHAR(255)';
          break;
        case 'text':
          sql += 'TEXT';
          break;
        case 'integer':
          sql += 'INTEGER';
          break;
        case 'decimal':
          sql += 'DECIMAL(10,2)';
          break;
        case 'boolean':
          sql += 'BOOLEAN';
          break;
        case 'datetime':
          sql += 'TIMESTAMP';
          break;
        case 'foreign':
          sql += 'INTEGER REFERENCES ';
          break;
        default:
          sql += 'VARCHAR(255)';
      }
      
      if (field.modifier) {
        switch (field.modifier.toLowerCase()) {
          case 'unique':
            sql += ' UNIQUE';
            break;
          case 'required':
            sql += ' NOT NULL';
            break;
        }
      }
      
      return sql;
    }).join(',\n      ');
    
    return {
      name: `plugin_${structure.id}_${tableName}`,
      fields: fieldDefinitions
    };
  });

  return `/**
 * Migration: Create ${structure.name} Tables
 * Generated by AI Plugin Creator
 */

exports.up = async function(knex) {
  console.log('🗄️ Running ${structure.name} migration: UP');
  
${tables.map(table => `  // Create ${table.name} table
  await knex.schema.createTable('${table.name}', (table) => {
    table.increments('id').primary();
    ${table.fields.split('\n').map(field => `table.${field.trim()};`).join('\n    ')}
    table.timestamps(true, true);
  });`).join('\n\n')}
  
  console.log('✅ ${structure.name} migration completed');
};

exports.down = async function(knex) {
  console.log('🗄️ Running ${structure.name} migration: DOWN');
  
${tables.map(table => `  await knex.schema.dropTableIfExists('${table.name}');`).join('\n')}
  
  console.log('✅ ${structure.name} migration rollback completed');
};
`;
}

function generateTests(structure) {
  return `/**
 * ${structure.name} Tests
 * Generated by AI Plugin Creator
 */

const request = require('supertest');
const app = require('../app'); // Adjust path as needed

describe('${structure.name} API', () => {
  
  describe('GET /${structure.name.toLowerCase()}', () => {
    it('should return list of ${structure.name.toLowerCase()}', async () => {
      const response = await request(app)
        .get('/api/${structure.name.toLowerCase()}')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /${structure.name.toLowerCase()}', () => {
    it('should create new ${structure.name.toLowerCase()}', async () => {
      const testData = {
        name: 'Test ${structure.name}'
      };
      
      const response = await request(app)
        .post('/api/${structure.name.toLowerCase()}')
        .send(testData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(testData.name);
    });
  });

  describe('PUT /${structure.name.toLowerCase()}/:id', () => {
    it('should update existing ${structure.name.toLowerCase()}', async () => {
      const testData = {
        name: 'Updated ${structure.name}'
      };
      
      const response = await request(app)
        .put('/api/${structure.name.toLowerCase()}/1')
        .send(testData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(testData.name);
    });
  });

  describe('DELETE /${structure.name.toLowerCase()}/:id', () => {
    it('should delete ${structure.name.toLowerCase()}', async () => {
      const response = await request(app)
        .delete('/api/${structure.name.toLowerCase()}/1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
});
`;
}

function generateDocumentation(structure) {
  return `# ${structure.name} Plugin

Generated by AI Plugin Creator

## Description
${structure.prompt || `AI-generated plugin for ${structure.name}`}

## Features
- CRUD operations for ${structure.name}
- RESTful API endpoints
- React component for UI
- Database integration
- Hook system integration
- Event-driven architecture

## Installation
1. Copy plugin files to your plugins directory
2. Run migrations: \`npm run migrate\`
3. Import and register the plugin

## API Endpoints

### GET /api/${structure.name.toLowerCase()}
Get list of ${structure.name.toLowerCase()} items

### POST /api/${structure.name.toLowerCase()}
Create new ${structure.name.toLowerCase()} item

### PUT /api/${structure.name.toLowerCase()}/:id
Update existing ${structure.name.toLowerCase()} item

### DELETE /api/${structure.name.toLowerCase()}/:id
Delete ${structure.name.toLowerCase()} item

## React Component
Import and use the ${structure.name}Component in your application:

\`\`\`jsx
import ${structure.name}Component from './components/${structure.name}Component';

function App() {
  return <${structure.name}Component />;
}
\`\`\`

## Hooks & Events
The plugin registers several hooks and events:

### Hooks
- \`${structure.name.toLowerCase()}.beforeCreate\` - Called before creating item
- \`${structure.name.toLowerCase()}.afterCreate\` - Called after creating item
- \`${structure.name.toLowerCase()}.beforeUpdate\` - Called before updating item
- \`${structure.name.toLowerCase()}.afterUpdate\` - Called after updating item

### Events
- \`${structure.name.toLowerCase()}.created\` - Emitted when item is created
- \`${structure.name.toLowerCase()}.updated\` - Emitted when item is updated
- \`${structure.name.toLowerCase()}.deleted\` - Emitted when item is deleted

## Generated Files
${Object.keys(structure.files || {}).map(file => `- \`${file}\``).join('\n')}

## License
MIT
`;
}

function generateFullScaffold(structure) {
  return {
    'manifest.json': JSON.stringify({
      name: structure.name,
      version: '1.0.0',
      description: `Full-stack plugin: ${structure.name}`,
      type: 'full',
      category: 'custom'
    }, null, 2),
    [`controllers/${structure.name}Controller.js`]: generateController(structure),
    [`models/${structure.name}Model.js`]: generateModel(structure, {}),
    [`routes/${structure.name.toLowerCase()}.js`]: generateRoutes(structure),
    [`components/${structure.name}Component.jsx`]: generateReactComponent(structure),
    [`hooks/${structure.name}Hooks.js`]: generateHooks(structure),
    'README.md': generateDocumentation(structure)
  };
}

function generateAPIScaffold(structure) {
  return {
    'manifest.json': JSON.stringify({
      name: structure.name,
      version: '1.0.0',
      description: `API-only plugin: ${structure.name}`,
      type: 'api',
      category: 'custom'
    }, null, 2),
    [`controllers/${structure.name}Controller.js`]: generateController(structure),
    [`models/${structure.name}Model.js`]: generateModel(structure, {}),
    [`routes/${structure.name.toLowerCase()}.js`]: generateRoutes(structure),
    'README.md': generateDocumentation(structure)
  };
}

function generateWidgetScaffold(structure) {
  return {
    'manifest.json': JSON.stringify({
      name: structure.name,
      version: '1.0.0',
      description: `Widget plugin: ${structure.name}`,
      type: 'widget',
      category: 'ui'
    }, null, 2),
    [`components/${structure.name}Widget.jsx`]: generateReactComponent(structure),
    [`hooks/${structure.name}Hooks.js`]: generateHooks(structure),
    'README.md': generateDocumentation(structure)
  };
}

function generateCustomScaffold(structure, customComponents) {
  const files = {
    'manifest.json': JSON.stringify({
      name: structure.name,
      version: '1.0.0',
      description: `Custom plugin: ${structure.name}`,
      type: 'custom',
      category: 'custom'
    }, null, 2)
  };

  if (customComponents.controller) {
    files[`controllers/${structure.name}Controller.js`] = generateController(structure);
  }
  if (customComponents.model) {
    files[`models/${structure.name}Model.js`] = generateModel(structure, {});
  }
  if (customComponents.routes) {
    files[`routes/${structure.name.toLowerCase()}.js`] = generateRoutes(structure);
  }
  if (customComponents.component) {
    files[`components/${structure.name}Component.jsx`] = generateReactComponent(structure);
  }
  if (customComponents.hooks) {
    files[`hooks/${structure.name}Hooks.js`] = generateHooks(structure);
  }

  files['README.md'] = generateDocumentation(structure);
  return files;
}

async function createPluginFiles(structure) {
  const pluginDir = path.join(process.cwd(), 'plugins', structure.id);
  
  try {
    // Create plugin directory
    await fs.mkdir(pluginDir, { recursive: true });
    
    // Create subdirectories
    const dirs = ['controllers', 'models', 'routes', 'components', 'hooks', 'tests', 'migrations'];
    for (const dir of dirs) {
      await fs.mkdir(path.join(pluginDir, dir), { recursive: true });
    }
    
    // Write all files
    for (const [filePath, content] of Object.entries(structure.files)) {
      const fullPath = path.join(pluginDir, filePath);
      const fileDir = path.dirname(fullPath);
      await fs.mkdir(fileDir, { recursive: true });
      await fs.writeFile(fullPath, content, 'utf8');
    }
    
    console.log(`✅ Plugin files created at: ${pluginDir}`);
    return pluginDir;
    
  } catch (error) {
    console.error(`❌ Error creating plugin files:`, error);
    throw error;
  }
}

function generateCreateTableSQL(tableName, fields) {
  const fieldSQL = fields.map(field => {
    let sql = `${field.name} `;
    
    switch (field.type.toLowerCase()) {
      case 'string':
        sql += 'VARCHAR(255)';
        break;
      case 'text':
        sql += 'TEXT';
        break;
      case 'integer':
        sql += 'INTEGER';
        break;
      case 'decimal':
        sql += 'DECIMAL(10,2)';
        break;
      case 'boolean':
        sql += 'BOOLEAN';
        break;
      case 'datetime':
        sql += 'TIMESTAMP';
        break;
      default:
        sql += 'VARCHAR(255)';
    }
    
    if (field.modifier === 'unique') {
      sql += ' UNIQUE';
    }
    if (field.modifier === 'required') {
      sql += ' NOT NULL';
    }
    
    return sql;
  }).join(',\n  ');
  
  return `CREATE TABLE ${tableName} (
  id SERIAL PRIMARY KEY,
  ${fieldSQL},
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
}

module.exports = router;