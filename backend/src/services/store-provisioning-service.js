/**
 * Store Provisioning Service
 * Handles automatic provisioning of new stores with custom subdomains
 */

const { v4: uuidv4 } = require('uuid');
const { Store } = require('../models'); // Master/Tenant hybrid model
const { MIGRATION_TYPES } = require('../config/migration-types');

class StoreProvisioningService {
  constructor() {
    this.defaultSubdomains = ['store', 'shop', 'market', 'boutique', 'outlet'];
    this.reservedSubdomains = [
      'www', 'api', 'admin', 'dashboard', 'app', 'mail', 'blog', 
      'support', 'help', 'docs', 'cdn', 'assets', 'static',
      'catalyst', 'platform', 'system', 'root', 'dev', 'test',
      'staging', 'prod', 'production'
    ];
  }

  /**
   * Generate a unique subdomain for a store
   */
  generateSubdomain(storeName, userId, maxLength = 15) {
    // Clean store name: lowercase, alphanumeric only
    const cleanName = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, maxLength - 4); // Leave room for suffix

    if (cleanName.length < 3) {
      // Fallback to user-based subdomain
      const userSuffix = userId.slice(-8).replace(/-/g, '');
      return `store${userSuffix}`.slice(0, maxLength);
    }

    return cleanName;
  }

  /**
   * Check if subdomain is available
   */
  async isSubdomainAvailable(subdomain) {
    if (this.reservedSubdomains.includes(subdomain.toLowerCase())) {
      return false;
    }

    const existingStore = await Store.findOne({
      where: { subdomain: subdomain.toLowerCase() }
    });

    return !existingStore;
  }

  /**
   * Generate unique subdomain with fallbacks
   */
  async generateUniqueSubdomain(storeName, userId) {
    let baseSubdomain = this.generateSubdomain(storeName, userId);
    
    // Try base subdomain first
    if (await this.isSubdomainAvailable(baseSubdomain)) {
      return baseSubdomain;
    }

    // Try with numbers (1-99)
    for (let i = 1; i <= 99; i++) {
      const candidate = `${baseSubdomain}${i}`;
      if (candidate.length <= 15 && await this.isSubdomainAvailable(candidate)) {
        return candidate;
      }
    }

    // Fallback to UUID-based subdomain
    const fallback = `store${uuidv4().slice(0, 8)}`;
    return fallback;
  }

  /**
   * Setup default store configuration
   */
  getDefaultStoreSettings() {
    return {
      // Theme settings
      theme: {
        primaryColor: '#3B82F6',
        secondaryColor: '#1F2937',
        accentColor: '#F59E0B',
        fontFamily: 'Inter'
      },
      
      // Navigation settings
      navigation: {
        showCategories: true,
        maxCategoryDepth: 3,
        showSearch: true,
        showCart: true,
        showWishlist: true
      },
      
      // SEO settings
      seo: {
        metaTitle: '',
        metaDescription: '',
        enableSitemap: true,
        enableRobots: true
      },
      
      // Features
      features: {
        reviews: true,
        wishlist: true,
        compareProducts: false,
        socialLogin: false,
        newsletter: true,
        chatSupport: false
      },
      
      // Migration settings
      migration: {
        autoMigrateOnCreation: false,
        defaultMigrationTypes: ['catalog', 'content'],
        requireSupabaseConnection: false
      }
    };
  }

  /**
   * Create DNS records for new subdomain
   */
  async setupDomainDns(subdomain) {
    // This would integrate with DNS provider (Cloudflare, Route53, etc.)
    const records = [
      {
        type: 'CNAME',
        name: subdomain,
        value: 'catalyst.app', // Your main domain
        ttl: 300
      },
      {
        type: 'TXT',
        name: `_verification.${subdomain}`,
        value: `catalyst-store-${Date.now()}`,
        ttl: 300
      }
    ];

    // TODO: Implement actual DNS provider integration
    console.log(`🌐 DNS records to create for ${subdomain}:`, records);
    
    return {
      success: true,
      records,
      domain: `${subdomain}.catalyst.app`
    };
  }

  /**
   * Initialize default store data
   */
  async initializeStoreData(storeId) {
    try {
      // Create default categories
      const { Category } = require('../models'); // Tenant DB model
      const defaultCategories = [
        { name: 'All Products', slug: 'all-products', is_active: true, level: 0, sort_order: 0 }
      ];

      for (const categoryData of defaultCategories) {
        await Category.create({
          id: uuidv4(),
          store_id: storeId,
          ...categoryData
        });
      }

      // Create default CMS pages
      const { CmsPage } = require('../models'); // Tenant DB model
      const defaultPages = [
        {
          title: 'Home',
          slug: 'home',
          content: '<h1>Welcome to Your Store</h1><p>Start customizing your storefront!</p>',
          is_active: true,
          page_type: 'home'
        },
        {
          title: 'About Us',
          slug: 'about',
          content: '<h1>About Us</h1><p>Tell your story here.</p>',
          is_active: true,
          page_type: 'page'
        }
      ];

      for (const pageData of defaultPages) {
        await CmsPage.create({
          id: uuidv4(),
          store_id: storeId,
          ...pageData
        });
      }

      return { success: true, message: 'Default store data initialized' };
    } catch (error) {
      console.error('Store data initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Provision new store with subdomain and initial setup
   */
  async provisionStore(userData, storeData) {
    try {
      console.log(`🏪 Provisioning new store: ${storeData.name}`);
      
      // 1. Generate unique subdomain
      const subdomain = await this.generateUniqueSubdomain(storeData.name, userData.id);
      const domain = `${subdomain}.catalyst.app`;
      
      console.log(`🌐 Generated subdomain: ${subdomain}`);

      // 2. Setup DNS records
      const dnsResult = await this.setupDomainDns(subdomain);
      if (!dnsResult.success) {
        throw new Error('Failed to setup DNS records');
      }

      // 3. Create store record
      const store = await Store.create({
        id: uuidv4(),
        user_id: userData.id,
        name: storeData.name,
        description: storeData.description || '',
        subdomain: subdomain,
        domain: domain,
        status: 'active',
        plan: storeData.plan || 'starter',
        settings: {
          ...this.getDefaultStoreSettings(),
          ...storeData.settings
        },
        created_at: new Date(),
        updated_at: new Date()
      });

      console.log(`✅ Store created with ID: ${store.id}`);

      // 4. Initialize default store data
      const initResult = await this.initializeStoreData(store.id);
      if (!initResult.success) {
        console.warn('⚠️ Default data initialization had issues:', initResult.error);
      }

      // 5. Setup migration configuration
      await this.setupMigrationConfiguration(store.id);

      return {
        success: true,
        store: {
          id: store.id,
          name: store.name,
          subdomain,
          domain,
          status: store.status,
          plan: store.plan
        },
        dns: dnsResult,
        provisioning: {
          defaultDataInitialized: initResult.success,
          migrationConfigured: true,
          readyForCustomization: true
        }
      };

    } catch (error) {
      console.error('Store provisioning error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Setup initial migration configuration
   */
  async setupMigrationConfiguration(storeId) {
    try {
      const { StoreDataMigration } = require('../models'); // Tenant DB model
      
      // Create migration records for critical types
      const criticalTypes = ['catalog', 'content'];
      
      for (const migrationType of criticalTypes) {
        await StoreDataMigration.create({
          id: uuidv4(),
          store_id: storeId,
          migration_type: migrationType,
          status: 'pending',
          target_system: 'supabase',
          migration_config: {
            auto_created: true,
            preserve_relationships: true,
            include_metadata: true
          },
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      console.log(`📊 Migration configuration created for store: ${storeId}`);
      return true;
    } catch (error) {
      console.error('Migration configuration error:', error);
      return false;
    }
  }

  /**
   * Get provisioning status for a store
   */
  async getProvisioningStatus(storeId) {
    try {
      const store = await Store.findById(storeId);
      if (!store) {
        return { success: false, error: 'Store not found' };
      }

      // Check various provisioning aspects
      const { Category, CmsPage, StoreDataMigration } = require('../models'); // Tenant DB models
      
      const [categoryCount] = await Category.count({ where: { store_id: storeId } });
      const [pageCount] = await CmsPage.count({ where: { store_id: storeId } });
      const [migrationCount] = await StoreDataMigration.count({ where: { store_id: storeId } });

      return {
        success: true,
        store: {
          id: store.id,
          name: store.name,
          subdomain: store.subdomain,
          domain: store.domain,
          status: store.status
        },
        provisioning: {
          hasDefaultCategories: categoryCount > 0,
          hasDefaultPages: pageCount > 0,
          hasMigrationConfig: migrationCount > 0,
          readyForUse: categoryCount > 0 && pageCount > 0
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = StoreProvisioningService;