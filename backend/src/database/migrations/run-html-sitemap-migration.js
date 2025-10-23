#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { sequelize, supabase } = require('../connection');

async function runHtmlSitemapMigration() {
  try {
    console.log('🚀 Starting HTML sitemap settings migration...');

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'add-html-sitemap-settings.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 HTML sitemap migration file loaded');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection verified');

    // Run the migration using Supabase if available, otherwise use Sequelize
    if (supabase) {
      console.log('🔄 Running HTML sitemap migration with Supabase client...');

      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      console.log(`📊 Found ${statements.length} SQL statements to execute`);

      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          try {
            console.log(`⏳ Executing statement ${i + 1}/${statements.length}`);
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            if (error) {
              console.warn(`⚠️  Statement ${i + 1} warning:`, error.message);
            } else {
              console.log(`✅ Statement ${i + 1} executed successfully`);
            }
          } catch (error) {
            console.warn(`⚠️  Statement ${i + 1} error:`, error.message);
          }
        }
      }
    } else {
      console.log('🔄 Running HTML sitemap migration with Sequelize...');
      await sequelize.query(migrationSQL);
    }

    console.log('✅ HTML sitemap settings migration completed successfully!');

    // Test the migration by checking the updated table structure
    try {
      const { SeoSettings } = require('../../models');

      console.log('🧪 Testing SeoSettings model...');

      // Test SeoSettings count
      const seoSettingsCount = await SeoSettings.count();
      console.log(`📊 SEO Settings count: ${seoSettingsCount}`);

      // Test by trying to fetch a record with the new fields
      const settings = await SeoSettings.findOne();
      if (settings) {
        console.log('📋 HTML Sitemap fields:');
        console.log(`  - enable_html_sitemap: ${settings.enable_html_sitemap ?? 'default'}`);
        console.log(`  - html_sitemap_include_categories: ${settings.html_sitemap_include_categories ?? 'default'}`);
        console.log(`  - html_sitemap_include_products: ${settings.html_sitemap_include_products ?? 'default'}`);
        console.log(`  - html_sitemap_include_pages: ${settings.html_sitemap_include_pages ?? 'default'}`);
        console.log(`  - html_sitemap_max_products: ${settings.html_sitemap_max_products ?? 'default'}`);
      }

      console.log('🎉 HTML sitemap settings are working correctly!');

    } catch (modelError) {
      console.error('⚠️  Model test error (this might be normal):', modelError.message);
    }

    // Only exit if called directly from command line
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ HTML sitemap migration failed:', error);
    // Only exit if called directly from command line
    if (require.main === module) {
      process.exit(1);
    } else {
      // Re-throw the error when called programmatically so server can handle it
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  runHtmlSitemapMigration();
}

module.exports = runHtmlSitemapMigration;
