/**
 * Comprehensive Migration Types Configuration
 * Defines all store data types that can be migrated to store owner's Supabase
 */

const MIGRATION_TYPES = {
  catalog: {
    name: 'Catalog & Inventory',
    description: 'Products, categories, attributes, inventory, and pricing data',
    priority: 1,
    tables: [
      'products',
      'categories', 
      'attributes',
      'attribute_sets',
      'product_labels',
      'product_tabs',
      'custom_option_rules',
      'akeneo_mappings',
      'akeneo_custom_mappings',
      'akeneo_schedules',
      'akeneo_import_statistics'
    ],
    dependencies: ['attributes', 'categories', 'attribute_sets'], // Must be migrated first
    estimated_size_mb: 50,
    critical: true
  },

  sales: {
    name: 'Sales & Orders',
    description: 'Orders, customers, payments, transactions, and sales analytics',
    priority: 2,
    tables: [
      'orders',
      'customers',
      'carts',
      'wishlists',
      'payment_methods',
      'shipping_methods',
      'delivery_settings',
      'taxes',
      'coupons',
      'customer_activities'
    ],
    dependencies: ['products', 'customers'], // Need catalog data first
    estimated_size_mb: 30,
    critical: true
  },

  content: {
    name: 'Content & Media',
    description: 'CMS pages, blocks, media assets, templates, and customizations',
    priority: 3,
    tables: [
      'cms_pages',
      'cms_blocks',
      'media_assets',
      'store_templates',
      'template_assets',
      'template_components',
      'template_customization_layers',
      'seo_settings',
      'seo_templates',
      'redirects'
    ],
    dependencies: [],
    estimated_size_mb: 100,
    critical: false
  },

  analytics: {
    name: 'Analytics & Tracking',
    description: 'User behavior, heatmaps, consent logs, and performance metrics',
    priority: 4,
    tables: [
      'heatmap_sessions',
      'heatmap_interactions', 
      'heatmap_aggregations',
      'consent_logs',
      'cookie_consent_settings'
    ],
    dependencies: [],
    estimated_size_mb: 20,
    critical: false
  },

  integrations: {
    name: 'Integrations & Plugins',
    description: 'Third-party integrations, plugin configurations, and OAuth tokens',
    priority: 5,
    tables: [
      'integration_configs',
      'plugin_configurations',
      'shopify_oauth_tokens',
      'supabase_oauth_tokens',
      'supabase_project_keys'
    ],
    dependencies: [],
    estimated_size_mb: 5,
    critical: false
  },

  operations: {
    name: 'Operations & Management',
    description: 'Background jobs, credits, invitations, and operational data',
    priority: 6,
    tables: [
      'jobs',
      'credits',
      'credit_transactions', 
      'credit_usage',
      'store_invitations',
      'store_teams',
      'store_data_migrations',
      'store_supabase_connections'
    ],
    dependencies: [],
    estimated_size_mb: 10,
    critical: false
  }
};

/**
 * Get all tables across all migration types
 */
const getAllMigrationTables = () => {
  const allTables = [];
  Object.values(MIGRATION_TYPES).forEach(type => {
    allTables.push(...type.tables);
  });
  return [...new Set(allTables)]; // Remove duplicates
};

/**
 * Get migration types sorted by priority
 */
const getMigrationTypesByPriority = () => {
  return Object.entries(MIGRATION_TYPES)
    .sort(([,a], [,b]) => a.priority - b.priority)
    .map(([key, value]) => ({ type: key, ...value }));
};

/**
 * Get critical migration types (must be migrated for basic functionality)
 */
const getCriticalMigrationTypes = () => {
  return Object.entries(MIGRATION_TYPES)
    .filter(([, value]) => value.critical)
    .map(([key, value]) => ({ type: key, ...value }));
};

/**
 * Calculate total estimated migration size
 */
const getTotalEstimatedSize = () => {
  return Object.values(MIGRATION_TYPES)
    .reduce((total, type) => total + type.estimated_size_mb, 0);
};

/**
 * Get dependencies for a specific migration type
 */
const getDependencies = (migrationType) => {
  const type = MIGRATION_TYPES[migrationType];
  return type ? type.dependencies : [];
};

/**
 * Validate migration order based on dependencies
 */
const validateMigrationOrder = (types) => {
  const completed = new Set();
  const errors = [];

  for (const type of types) {
    const dependencies = getDependencies(type);
    const missingDeps = dependencies.filter(dep => !completed.has(dep));
    
    if (missingDeps.length > 0) {
      errors.push(`${type} requires ${missingDeps.join(', ')} to be migrated first`);
    }
    
    completed.add(type);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  MIGRATION_TYPES,
  getAllMigrationTables,
  getMigrationTypesByPriority,
  getCriticalMigrationTypes,
  getTotalEstimatedSize,
  getDependencies,
  validateMigrationOrder
};