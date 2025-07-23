#!/usr/bin/env node

// Set environment to production to use PostgreSQL
process.env.DATABASE_URL = "postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";
process.env.NODE_ENV = "production";

const { sequelize } = require('./src/database/connection');

async function cleanupTables() {
  try {
    console.log('🧹 Starting cleanup of duplicate PascalCase tables...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Drop PascalCase tables one by one
    const tablesToDrop = ['Category', 'CmsPage', 'Order', 'Product', 'Store', 'User'];
    
    for (const table of tablesToDrop) {
      try {
        console.log(`🗑️  Dropping table: ${table}`);
        await sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`✅ Dropped: ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not drop ${table}: ${error.message}`);
      }
    }
    
    // Verify that only lowercase tables remain
    console.log('\n📋 Checking remaining tables...');
    const [tables] = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'stores', 'products', 'orders', 'categories', 'cms_pages')
      ORDER BY tablename
    `);
    
    console.log('✅ Remaining lowercase tables:');
    tables.forEach(table => {
      console.log(`   - ${table.tablename}`);
    });
    
    console.log('\n🎉 Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

cleanupTables();