#!/usr/bin/env node

const { sequelize } = require('./src/database/connection');
const CookieConsentSettings = require('./src/models/CookieConsentSettings');

async function migrateCookieConsentSettings() {
  try {
    console.log('🚀 Starting cookie consent settings migration...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection verified');
    
    // Sync the CookieConsentSettings model (alter existing table)
    console.log('🔄 Syncing CookieConsentSettings model...');
    await CookieConsentSettings.sync({ alter: true });
    console.log('✅ CookieConsentSettings table updated successfully!');
    
    // Describe the table to see what columns exist
    const tableDescription = await sequelize.getQueryInterface().describeTable('cookie_consent_settings');
    console.log('📊 Updated table structure:');
    console.log(Object.keys(tableDescription).join(', '));
    
    // Test a simple query
    const count = await CookieConsentSettings.count();
    console.log(`📊 Current cookie consent settings count: ${count}`);
    
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('❌ Error details:', error.message);
    process.exit(1);
  }
}

// Run migration
migrateCookieConsentSettings();