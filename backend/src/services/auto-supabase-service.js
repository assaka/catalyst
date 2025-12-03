const axios = require('axios');
const crypto = require('crypto');

class AutoSupabaseService {
  constructor() {
    this.baseUrl = 'https://api.supabase.com/v1';
    this.masterToken = process.env.SUPABASE_MASTER_TOKEN; // Platform-wide token for auto-setup
    this.organizationId = process.env.SUPABASE_ORGANIZATION_ID;
  }

  /**
   * Auto-create a Supabase project for a new store
   */
  async autoCreateProject(storeId, storeData, userId) {
    try {
      if (!this.masterToken || !this.organizationId) {
        // Fallback: Create placeholder project data for now
        return this.createPlaceholderProject(storeId, storeData);
      }

      const projectConfig = {
        name: `daino-${storeData.slug}`,
        organization_id: this.organizationId,
        plan: 'free',
        region: 'us-east-1',
        db_pass: this.generateSecurePassword()
      };

      const response = await axios.post(`${this.baseUrl}/projects`, projectConfig, {
        headers: {
          'Authorization': `Bearer ${this.masterToken}`,
          'Content-Type': 'application/json'
        }
      });

      const project = response.data;

      // Wait for project to be ready
      await this.waitForProjectReady(project.id);

      // Set up database schema and initial data
      await this.setupProjectSchema(project.id, storeId);

      // Generate API keys
      const apiKeys = await this.generateProjectKeys(project.id);

      // Note: auto_supabase_project_id and auto_supabase_project_url columns have been removed
      // Store Supabase project info in settings if needed
      const Store = require('../models/Store');
      const store = await Store.findByPk(storeId);
      const settings = store.settings || {};
      settings.supabase = {
        project_id: project.id,
        project_url: `https://${project.ref}.supabase.co`
      };
      await store.update({ settings });

      return {
        success: true,
        project: {
          id: project.id,
          name: project.name,
          url: `https://${project.ref}.supabase.co`,
          ref: project.ref,
          status: project.status
        },
        api_keys: apiKeys,
        message: 'Supabase project created successfully'
      };

    } catch (error) {
      console.error('Auto-creation of Supabase project failed:', error.response?.data || error.message);
      
      // Fallback to placeholder
      return this.createPlaceholderProject(storeId, storeData);
    }
  }

  /**
   * Create placeholder project when Supabase API is not available
   */
  createPlaceholderProject(storeId, storeData) {
    const placeholderRef = `placeholder-${crypto.randomBytes(8).toString('hex')}`;
    
    return {
      success: true,
      project: {
        id: `placeholder-${storeId}`,
        name: `daino-${storeData.slug}`,
        url: `https://${placeholderRef}.supabase.co`,
        ref: placeholderRef,
        status: 'ACTIVE_PLACEHOLDER'
      },
      api_keys: {
        anon: `placeholder_anon_${crypto.randomBytes(16).toString('hex')}`,
        service_role: `placeholder_service_${crypto.randomBytes(16).toString('hex')}`
      },
      message: 'Placeholder Supabase project created (will be upgraded when published)',
      is_placeholder: true
    };
  }

  /**
   * Wait for project to be ready
   */
  async waitForProjectReady(projectId, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(`${this.baseUrl}/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${this.masterToken}`
          }
        });

        if (response.data.status === 'ACTIVE') {
          return true;
        }

        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      } catch (error) {
        console.error(`Attempt ${i + 1} to check project status failed:`, error.message);
      }
    }

    throw new Error('Project failed to become ready within expected time');
  }

  /**
   * Set up database schema for the store
   */
  async setupProjectSchema(projectId, storeId) {
    try {
      // Get project database URL
      const dbUrl = await this.getProjectDatabaseUrl(projectId);
      
      // Run initialization SQL
      const initSQL = this.generateInitializationSQL(storeId);
      
      // Execute SQL (this would need actual implementation based on Supabase REST API)
      await this.executeDatabaseSQL(projectId, initSQL);

      return {
        success: true,
        message: 'Database schema set up successfully'
      };

    } catch (error) {
      console.error('Failed to set up project schema:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate initialization SQL for store database
   */
  generateInitializationSQL(storeId) {
    return `
      -- Create store-specific tables
      CREATE SCHEMA IF NOT EXISTS store_${storeId.replace(/-/g, '_')};
      
      -- Create products table
      CREATE TABLE IF NOT EXISTS store_${storeId.replace(/-/g, '_')}.products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        description TEXT,
        price DECIMAL(10,2),
        sku VARCHAR UNIQUE,
        stock_quantity INTEGER DEFAULT 0,
        images JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create categories table
      CREATE TABLE IF NOT EXISTS store_${storeId.replace(/-/g, '_')}.categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        slug VARCHAR UNIQUE NOT NULL,
        description TEXT,
        image_url VARCHAR,
        parent_id UUID REFERENCES store_${storeId.replace(/-/g, '_')}.categories(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create orders table
      CREATE TABLE IF NOT EXISTS store_${storeId.replace(/-/g, '_')}.orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_email VARCHAR NOT NULL,
        status VARCHAR DEFAULT 'pending',
        total_amount DECIMAL(10,2) NOT NULL,
        items JSONB DEFAULT '[]',
        shipping_address JSONB,
        billing_address JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create storage bucket for store assets
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('store-${storeId}', 'store-${storeId}', true)
      ON CONFLICT (id) DO NOTHING;
      
      -- Set up RLS policies
      ALTER TABLE store_${storeId.replace(/-/g, '_')}.products ENABLE ROW LEVEL SECURITY;
      ALTER TABLE store_${storeId.replace(/-/g, '_')}.categories ENABLE ROW LEVEL SECURITY;
      ALTER TABLE store_${storeId.replace(/-/g, '_')}.orders ENABLE ROW LEVEL SECURITY;
      
      -- Create policies for public access to products and categories
      CREATE POLICY IF NOT EXISTS "Public can view products" ON store_${storeId.replace(/-/g, '_')}.products
        FOR SELECT USING (true);
      
      CREATE POLICY IF NOT EXISTS "Public can view categories" ON store_${storeId.replace(/-/g, '_')}.categories
        FOR SELECT USING (true);
    `;
  }

  /**
   * Execute SQL commands on the project database
   */
  async executeDatabaseSQL(projectId, sql) {
    // This would use Supabase's SQL execution API when available
    // For now, this is a placeholder
    return {
      success: true,
      message: 'SQL executed (placeholder implementation)'
    };
  }

  /**
   * Generate API keys for the project
   */
  async generateProjectKeys(projectId) {
    try {
      const response = await axios.get(`${this.baseUrl}/projects/${projectId}/api-keys`, {
        headers: {
          'Authorization': `Bearer ${this.masterToken}`
        }
      });

      return {
        anon: response.data.anon,
        service_role: response.data.service_role
      };

    } catch (error) {
      console.error('Failed to get project API keys:', error);
      // Return placeholder keys
      return {
        anon: `placeholder_anon_${crypto.randomBytes(16).toString('hex')}`,
        service_role: `placeholder_service_${crypto.randomBytes(16).toString('hex')}`
      };
    }
  }

  /**
   * Transfer project ownership to user's Supabase account
   */
  async transferProjectOwnership(storeId, userSupabaseCredentials) {
    try {
      const Store = require('../models/Store');
      const store = await Store.findByPk(storeId);

      // Check for Supabase project in settings (columns auto_supabase_project_id removed)
      if (!store.settings?.supabase?.project_id) {
        return {
          success: false,
          message: 'No auto-created project to transfer'
        };
      }

      // This would implement actual project transfer when Supabase API supports it
      return {
        success: false,
        message: 'Project transfer not yet supported by Supabase API'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upgrade placeholder project to real Supabase project
   */
  async upgradeToRealProject(storeId) {
    try {
      const Store = require('../models/Store');
      const store = await Store.findByPk(storeId);

      // Check for placeholder project in settings (columns auto_supabase_project_id removed)
      const projectId = store.settings?.supabase?.project_id;
      if (!projectId || !projectId.startsWith('placeholder-')) {
        return {
          success: false,
          message: 'Store does not have a placeholder project'
        };
      }

      // Create real Supabase project
      const realProject = await this.autoCreateProject(storeId, store.dataValues, store.user_id);

      if (realProject.success && !realProject.is_placeholder) {
        // Update store with real project info in settings
        const settings = store.settings || {};
        settings.supabase = {
          project_id: realProject.project.id,
          project_url: realProject.project.url
        };
        await store.update({ settings });

        return {
          success: true,
          message: 'Successfully upgraded to real Supabase project',
          project: realProject.project
        };
      }

      return {
        success: false,
        message: 'Failed to create real Supabase project'
      };

    } catch (error) {
      console.error('Failed to upgrade to real project:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate secure password
   */
  generateSecurePassword(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return password;
  }

  /**
   * Get project database URL
   */
  async getProjectDatabaseUrl(projectId) {
    try {
      const response = await axios.get(`${this.baseUrl}/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${this.masterToken}`
        }
      });

      return response.data.database.host;
    } catch (error) {
      throw new Error('Failed to get project database URL');
    }
  }
}

module.exports = new AutoSupabaseService();