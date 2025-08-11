const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

class StoreDataMigration {
  constructor() {
    this.migrationPath = path.join(__dirname, '../database/migrations/store-schema');
    this.ensureMigrationDirectoryExists();
  }

  /**
   * Ensure migration directory exists
   */
  ensureMigrationDirectoryExists() {
    if (!fs.existsSync(this.migrationPath)) {
      fs.mkdirSync(this.migrationPath, { recursive: true });
    }
  }

  /**
   * Create database and run migrations for a store
   */
  async createStoreDatabase(storeId, supabaseCredentials) {
    try {
      console.log(`🚀 Starting database migration for store ${storeId}`);

      // Create Supabase client with service role
      const supabase = createClient(
        supabaseCredentials.project_url,
        supabaseCredentials.service_role_key
      );

      // Run core migrations
      await this.runCoreMigrations(supabase, storeId);

      // Run store-specific migrations
      await this.runStoreMigrations(supabase, storeId);

      // Setup RLS policies
      await this.setupRLSPolicies(supabase, storeId);

      // Create initial data
      await this.createInitialData(supabase, storeId);

      return {
        success: true,
        message: 'Database created and migrated successfully'
      };

    } catch (error) {
      console.error('Store database migration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run core database migrations
   */
  async runCoreMigrations(supabase, storeId) {
    console.log('📝 Running core migrations...');

    const coreMigrations = [
      this.createStoresTable(),
      this.createUsersTable(),
      this.createProductsTable(),
      this.createCategoriesTable(),
      this.createOrdersTable(),
      this.createCustomersTable(),
      this.createMediaAssetsTable(),
      this.createSettingsTable()
    ];

    for (const migration of coreMigrations) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: migration.sql
        });

        if (error) {
          console.error(`Migration failed: ${migration.name}`, error);
          throw error;
        }

        console.log(`✅ ${migration.name}`);
      } catch (error) {
        // Some errors might be expected (table exists, etc.)
        if (!error.message.includes('already exists')) {
          throw error;
        }
        console.log(`⏭️ ${migration.name} (already exists)`);
      }
    }
  }

  /**
   * Run store-specific migrations
   */
  async runStoreMigrations(supabase, storeId) {
    console.log('🏪 Running store-specific migrations...');

    // Create store record
    const { error: storeError } = await supabase
      .from('stores')
      .upsert({
        id: storeId,
        name: `Store ${storeId.slice(0, 8)}`,
        slug: `store-${storeId.slice(0, 8)}`,
        status: 'active',
        settings: {
          currency: 'USD',
          timezone: 'UTC',
          theme: 'default'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (storeError) {
      console.error('Failed to create store record:', storeError);
      throw storeError;
    }

    console.log('✅ Store record created');
  }

  /**
   * Setup Row Level Security policies
   */
  async setupRLSPolicies(supabase, storeId) {
    console.log('🔐 Setting up RLS policies...');

    const rlsPolicies = [
      // Products policies
      {
        table: 'products',
        policies: [
          `CREATE POLICY "Store owners can manage products" ON products FOR ALL USING (store_id = '${storeId}');`,
          `CREATE POLICY "Public can view published products" ON products FOR SELECT USING (status = 'published' AND store_id = '${storeId}');`
        ]
      },
      // Categories policies
      {
        table: 'categories',
        policies: [
          `CREATE POLICY "Store owners can manage categories" ON categories FOR ALL USING (store_id = '${storeId}');`,
          `CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (store_id = '${storeId}');`
        ]
      },
      // Orders policies
      {
        table: 'orders',
        policies: [
          `CREATE POLICY "Store owners can view orders" ON orders FOR SELECT USING (store_id = '${storeId}');`,
          `CREATE POLICY "Customers can view own orders" ON orders FOR SELECT USING (store_id = '${storeId}' AND customer_id = auth.uid());`
        ]
      }
    ];

    for (const { table, policies } of rlsPolicies) {
      // Enable RLS
      try {
        await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
        });
      } catch (error) {
        // Ignore if RLS is already enabled
      }

      // Create policies
      for (const policy of policies) {
        try {
          await supabase.rpc('exec_sql', { sql: policy });
        } catch (error) {
          // Ignore if policy already exists
          if (!error.message.includes('already exists')) {
            console.warn(`Policy creation warning: ${error.message}`);
          }
        }
      }
    }

    console.log('✅ RLS policies configured');
  }

  /**
   * Create initial data for the store
   */
  async createInitialData(supabase, storeId) {
    console.log('🌱 Creating initial data...');

    // Create default category
    const { error: categoryError } = await supabase
      .from('categories')
      .upsert({
        id: `${storeId}-root`,
        store_id: storeId,
        name: 'All Products',
        slug: 'all-products',
        parent_id: null,
        level: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (categoryError) {
      console.warn('Warning: Failed to create default category:', categoryError);
    } else {
      console.log('✅ Default category created');
    }

    // Create sample product
    const { error: productError } = await supabase
      .from('products')
      .upsert({
        id: `${storeId}-sample`,
        store_id: storeId,
        name: 'Sample Product',
        slug: 'sample-product',
        description: 'This is a sample product to get you started.',
        price: 29.99,
        stock_quantity: 100,
        status: 'draft',
        category_ids: [`${storeId}-root`],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (productError) {
      console.warn('Warning: Failed to create sample product:', productError);
    } else {
      console.log('✅ Sample product created');
    }

    console.log('✅ Initial data created');
  }

  /**
   * Create stores table migration
   */
  createStoresTable() {
    return {
      name: 'Create stores table',
      sql: `
        CREATE TABLE IF NOT EXISTS stores (
          id UUID PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          domain VARCHAR(255),
          status VARCHAR(50) DEFAULT 'active',
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
        CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
      `
    };
  }

  /**
   * Create users table migration
   */
  createUsersTable() {
    return {
      name: 'Create users table',
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'customer',
          store_id UUID REFERENCES stores(id),
          is_active BOOLEAN DEFAULT true,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      `
    };
  }

  /**
   * Create products table migration
   */
  createProductsTable() {
    return {
      name: 'Create products table',
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          store_id UUID NOT NULL REFERENCES stores(id),
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2),
          compare_price DECIMAL(10,2),
          cost_price DECIMAL(10,2),
          sku VARCHAR(255),
          stock_quantity INTEGER DEFAULT 0,
          status VARCHAR(50) DEFAULT 'draft',
          category_ids JSONB DEFAULT '[]',
          images JSONB DEFAULT '[]',
          attributes JSONB DEFAULT '{}',
          seo_title VARCHAR(255),
          seo_description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(store_id, slug)
        );

        CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
        CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
        CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
        CREATE INDEX IF NOT EXISTS idx_products_category_ids ON products USING GIN(category_ids);
      `
    };
  }

  /**
   * Create categories table migration
   */
  createCategoriesTable() {
    return {
      name: 'Create categories table',
      sql: `
        CREATE TABLE IF NOT EXISTS categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          store_id UUID NOT NULL REFERENCES stores(id),
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          description TEXT,
          parent_id UUID REFERENCES categories(id),
          level INTEGER DEFAULT 0,
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          image_url VARCHAR(500),
          seo_title VARCHAR(255),
          seo_description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(store_id, slug)
        );

        CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);
        CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
        CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);
        CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
      `
    };
  }

  /**
   * Create orders table migration
   */
  createOrdersTable() {
    return {
      name: 'Create orders table',
      sql: `
        CREATE TABLE IF NOT EXISTS orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          store_id UUID NOT NULL REFERENCES stores(id),
          customer_id UUID,
          order_number VARCHAR(50) UNIQUE NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          total_amount DECIMAL(10,2) NOT NULL,
          subtotal_amount DECIMAL(10,2) NOT NULL,
          tax_amount DECIMAL(10,2) DEFAULT 0,
          shipping_amount DECIMAL(10,2) DEFAULT 0,
          currency VARCHAR(3) DEFAULT 'USD',
          items JSONB DEFAULT '[]',
          shipping_address JSONB,
          billing_address JSONB,
          payment_status VARCHAR(50) DEFAULT 'pending',
          payment_method VARCHAR(100),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
        CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
      `
    };
  }

  /**
   * Create customers table migration
   */
  createCustomersTable() {
    return {
      name: 'Create customers table',
      sql: `
        CREATE TABLE IF NOT EXISTS customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          store_id UUID NOT NULL REFERENCES stores(id),
          email VARCHAR(255) NOT NULL,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          phone VARCHAR(50),
          accepts_marketing BOOLEAN DEFAULT false,
          addresses JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(store_id, email)
        );

        CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);
        CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
      `
    };
  }

  /**
   * Create media_assets table migration
   */
  createMediaAssetsTable() {
    return {
      name: 'Create media_assets table',
      sql: `
        CREATE TABLE IF NOT EXISTS media_assets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          store_id UUID NOT NULL REFERENCES stores(id),
          file_name VARCHAR(255) NOT NULL,
          original_name VARCHAR(255),
          file_path VARCHAR(500) NOT NULL,
          file_url VARCHAR(500) NOT NULL,
          mime_type VARCHAR(100),
          file_size INTEGER,
          folder VARCHAR(255) DEFAULT 'library',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_media_assets_store_id ON media_assets(store_id);
        CREATE INDEX IF NOT EXISTS idx_media_assets_folder ON media_assets(folder);
        CREATE INDEX IF NOT EXISTS idx_media_assets_mime_type ON media_assets(mime_type);
      `
    };
  }

  /**
   * Create settings table migration
   */
  createSettingsTable() {
    return {
      name: 'Create settings table',
      sql: `
        CREATE TABLE IF NOT EXISTS store_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          store_id UUID NOT NULL REFERENCES stores(id),
          key VARCHAR(255) NOT NULL,
          value JSONB,
          category VARCHAR(100) DEFAULT 'general',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(store_id, key)
        );

        CREATE INDEX IF NOT EXISTS idx_store_settings_store_id ON store_settings(store_id);
        CREATE INDEX IF NOT EXISTS idx_store_settings_category ON store_settings(category);
      `
    };
  }

  /**
   * Check migration status
   */
  async checkMigrationStatus(supabaseCredentials, storeId) {
    try {
      const supabase = createClient(
        supabaseCredentials.project_url,
        supabaseCredentials.service_role_key
      );

      // Check if store exists
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name, created_at')
        .eq('id', storeId)
        .single();

      if (storeError) {
        return {
          migrated: false,
          error: storeError.message
        };
      }

      // Check table existence
      const tables = ['products', 'categories', 'orders', 'customers', 'media_assets'];
      const tableStatus = {};

      for (const table of tables) {
        try {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq('store_id', storeId);

          tableStatus[table] = { exists: true, count };
        } catch (error) {
          tableStatus[table] = { exists: false, error: error.message };
        }
      }

      return {
        migrated: true,
        store: storeData,
        tables: tableStatus
      };

    } catch (error) {
      return {
        migrated: false,
        error: error.message
      };
    }
  }

  /**
   * Rollback migrations (for testing/cleanup)
   */
  async rollbackMigrations(supabaseCredentials, storeId) {
    try {
      const supabase = createClient(
        supabaseCredentials.project_url,
        supabaseCredentials.service_role_key
      );

      // Delete all data for the store
      const tables = ['orders', 'products', 'categories', 'customers', 'media_assets', 'store_settings'];
      
      for (const table of tables) {
        await supabase
          .from(table)
          .delete()
          .eq('store_id', storeId);
      }

      // Delete store record
      await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      return {
        success: true,
        message: 'Migrations rolled back successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = StoreDataMigration;